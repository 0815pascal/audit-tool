import {http, HttpResponse} from 'msw';
import {
  generateAuditLinks,
  generatePaginationLinks,
  createSuccessResponse,
  createBusinessLogicProblem,
  createNotFoundProblem,
  createInternalErrorProblem,
  validateAuditCompletion,
  canUserAuditOwnCase,
  // New REST utilities for Medium Impact fixes
  generateCachingHeaders,
  parsePaginationParams,
  paginateData,
  negotiateContent,
  getResponseContentType,
  CACHE_STRATEGIES
} from '../utils/restUtils';
import { CURRENCY, ValidCurrency } from '../types/currencyTypes';
import {ClaimsStatus, QuarterPeriod, AuditCompletionParams} from '../types/types';
import {createCaseId, createUserId, isQuarterPeriod,} from '../types/typeHelpers';
import {API_BASE_PATH, CASE_STATUS_MAPPING, CLAIMS_STATUS} from '../constants';
import {CASE_STATUS_ENUM, USER_ROLE_ENUM} from '../enums';
import {ApiAuditRequestPayload, ApiAuditResponse} from './mockTypes';
import {
  auditStore,
  caseToAudit,
  caseToCaseObj,
  generateFindings,
  getNumericId,
  getPreviousQuarterInfo,
  getQuarterFromDate,
  parseQuarter,
  safeParseInt
} from './auxiliaryFunctions';
import {
  mockCases, 
  users, 
  generateMockCurrentQuarterCase,
  generateMockPreviousQuarterCase,
  generateQuarterlyAuditSelectionCases,
  generateUserQuarterlyAudits,
  generatePreviousQuarterRandomAudits,
  generateCompletionData,
  generateAuditCompletionResponse,
  generateFallbackAudit,
  generateFallbackCompletionResponse,
  generateRandomAuditId,
  generateRandomFindingId,
  generateRandomCaseNumber,
  shuffleArray,
  generateCurrentQuarterString,
  generateCurrentDateString,
  generateCurrentTimestamp
} from './mockData';

// Type the handlers array properly
type MSWHandler = ReturnType<typeof http.get> | ReturnType<typeof http.post> | ReturnType<typeof http.put> | ReturnType<typeof http.patch> | ReturnType<typeof http.delete>;

/**
 * Enhanced response helper with caching, pagination, and content negotiation
 */
const createEnhancedResponse = (
  request: Request,
  data: unknown,
  status = 200,
  cacheStrategy: keyof typeof CACHE_STRATEGIES = 'DYNAMIC',
  lastModified?: Date | string
) => {
  // Content negotiation
  const contentNegotiation = negotiateContent(request);
  const contentType = getResponseContentType(contentNegotiation);
  
  // Caching headers
  const cachingHeaders = generateCachingHeaders(
    data,
    cacheStrategy,
    lastModified,
    ['Accept', 'Accept-Language'] // Vary headers for content negotiation
  );
  
  // Combine headers
  const headers = {
    'Content-Type': contentType,
    ...cachingHeaders
  };
  
  return HttpResponse.json(data as Record<string, unknown>, { status, headers });
};

export const handlers: MSWHandler[] = [
  // Get audits with query parameter support (REST compliant)
  http.get(`${API_BASE_PATH}/audits`, ({ request }) => {
    try {
      const url = new URL(request.url);
      const quarter = url.searchParams.get('quarter');
      const auditor = url.searchParams.get('auditor');
      
      // Parse pagination parameters
      const paginationParams = parsePaginationParams(url.searchParams);
      
      console.log(`[MSW] GET /audits with params:`, { quarter, auditor, pagination: paginationParams });
      
      let filteredAudits: ApiAuditResponse[] = [];
      
      if (quarter) {
        // Filter by quarter
        const quarterValue = quarter;
        const parsedQuarter = parseQuarter(quarterValue);
      
      if (!parsedQuarter) {
        console.log(`[MSW] Failed to parse quarter: ${quarterValue}`);
          return createEnhancedResponse(request, [], 200, 'DYNAMIC');
        }
        
        // Get current quarter cases (6 cases - one per employee)
      const currentQuarterCases = mockCases.filter(caseItem => {
        try {
          const { quarterNum, year } = getQuarterFromDate(caseItem.notificationDate);
          return quarterNum === parsedQuarter.quarterNum && 
                year === parsedQuarter.year;
        } catch {
          return false;
        }
      });
      
        // Get previous quarter (2 random cases)
      let previousQuarter = parsedQuarter.quarterNum - 1;
      let previousYear = parsedQuarter.year;
      if (previousQuarter < 1) {
        previousQuarter = 4;
        previousYear = parsedQuarter.year - 1;
      }
      
      const previousQuarterCases = mockCases.filter(caseItem => {
        try {
          const { quarterNum, year } = getQuarterFromDate(caseItem.notificationDate);
          return quarterNum === previousQuarter && 
                year === previousYear;
        } catch {
          return false;
        }
      });
      
        const selectedPreviousCases = shuffleArray(previousQuarterCases).slice(0, 2);
      const combinedCases = [...currentQuarterCases, ...selectedPreviousCases];
      
        const quarterAudits = combinedCases
        .map(caseItem => {
          try {
            const caseObj = caseToCaseObj(caseItem);
              return caseToAudit(caseObj, quarterValue as QuarterPeriod);
          } catch {
            return null;
          }
        })
          .filter((audit): audit is ApiAuditResponse => audit !== null);
      
        filteredAudits = quarterAudits;
          
        // Add stored audits for this quarter
      for (const [, audit] of Array.from(auditStore.entries())) {
        if (audit.quarter === quarter) {
            filteredAudits.push(audit);
          }
        }
        
      } else if (auditor) {
        // Filter by auditor
        const numericAuditorId = safeParseInt(auditor);
        
        const filteredCases = mockCases.filter(caseItem => 
          (getNumericId(caseItem.id) % 2) + 1 === numericAuditorId
        );
        
        const currentQuarter: QuarterPeriod = generateCurrentQuarterString() as QuarterPeriod;
        const auditorAudits = filteredCases
          .map(caseItem => {
            try {
              const caseObj = caseToCaseObj(caseItem);
              return caseToAudit(caseObj, currentQuarter);
            } catch {
              return null;
            }
          })
          .filter((audit): audit is ApiAuditResponse => audit !== null);
          
        filteredAudits = auditorAudits;
          
      } else {
        // No filters - return all audits (or empty for now)
        filteredAudits = [];
      }
      
      // Apply pagination
      const paginatedResult = paginateData(filteredAudits, paginationParams);
      
      // Enhance with HATEOAS links
      const enhancedAudits = paginatedResult.data.map(audit => ({
        ...audit,
        _links: generateAuditLinks(String(audit.auditId))
      }));
      
      // Generate pagination links
      const baseUrl = quarter ? `${API_BASE_PATH}/audits?quarter=${quarter}` : `${API_BASE_PATH}/audits`;
      const paginationLinks = generatePaginationLinks(
        baseUrl,
        paginatedResult.metadata.page,
        paginatedResult.metadata.pages,
        paginatedResult.metadata.limit
      );
      
      const response = createSuccessResponse(enhancedAudits, 
        paginationLinks, 
        {
          timestamp: new Date().toISOString(),
          total: paginatedResult.metadata.total,
          pagination: paginatedResult.metadata
        }
      );
      
      // Use conditional caching for audit data that changes occasionally
      return createEnhancedResponse(request, response, 200, 'CONDITIONAL');
    } catch (error) {
      console.error("[MSW] Error in GET /audits handler:", error);
      return createEnhancedResponse(request, [], 200, 'REAL_TIME');
    }
  }),

  // Legacy endpoint support for backward compatibility
  http.get(`${API_BASE_PATH}/audits/quarter/:quarter`, ({ params }) => {
    const { quarter } = params;
    const quarterValue = Array.isArray(quarter) ? quarter[0] : quarter ?? '';
    
    // Redirect to new endpoint with proper URL construction
    const redirectUrl = `${API_BASE_PATH}/audits?quarter=${quarterValue}`;
    return HttpResponse.redirect(redirectUrl, 302);
  }),

  // Legacy endpoint support for backward compatibility  
  http.get(`${API_BASE_PATH}/audits/auditor/:auditorId`, ({ params }) => {
    const { auditorId } = params;
    const auditorValue = Array.isArray(auditorId) ? auditorId[0] : auditorId ?? '';
    
    // Redirect to new endpoint with proper URL construction
    const redirectUrl = `${API_BASE_PATH}/audits?auditor=${auditorValue}`;
    return HttpResponse.redirect(redirectUrl, 302);
  }),

  // Audit completion endpoints - Standardized under /audits/{id}/completion
  http.get(`${API_BASE_PATH}/audits/:auditId/completion`, ({ params, request }) => {
    try {
      const { auditId } = params;
      const numericAuditId = safeParseInt(Array.isArray(auditId) ? auditId[0] : auditId);
      
      const completionData = generateCompletionData(numericAuditId);
      
      const response = {
        success: true,
        data: completionData
      };
      
      // Cache completion data for longer since it doesn't change often once set
      return createEnhancedResponse(request, response, 200, 'CONDITIONAL');
    } catch (error) {
      console.error("[MSW] Error in GET /audits/:auditId/completion handler:", error);
      const errorResponse = {
        success: false,
        error: 'Failed to fetch audit completion'
      };
      return createEnhancedResponse(request, errorResponse, 500, 'REAL_TIME');
    }
  }),

  http.put(`${API_BASE_PATH}/audits/:auditId/completion`, async ({ params, request }) => {
    try {
      const { auditId } = params;
      const numericAuditId = safeParseInt(Array.isArray(auditId) ? auditId[0] : auditId);
      
      const clonedRequest = request.clone();
              let requestData: Record<string, unknown> = {};
      try {
        const jsonData = await clonedRequest.json();
        if (jsonData && typeof jsonData === 'object') {
          requestData = jsonData as Partial<AuditCompletionParams>;
        }
      } catch {
        console.warn("[MSW] Failed to parse request body for completion update");
      }
      
      const completionResponse = generateFallbackCompletionResponse(numericAuditId, requestData);
      
      const response = {
        success: true,
        data: completionResponse
      };
      
      // No caching for write operations
      return createEnhancedResponse(request, response, 200, 'REAL_TIME');
    } catch (error) {
      console.error("[MSW] Error in PUT /audits/:auditId/completion handler:", error);
      const errorResponse = {
        success: false,
        error: 'Failed to update audit completion'
      };
      return createEnhancedResponse(request, errorResponse, 500, 'REAL_TIME');
    }
  }),

  http.post(`${API_BASE_PATH}/audits/:auditId/completion`, async ({ params, request }) => {
    const { auditId } = params;
    const auditIdStr = Array.isArray(auditId) ? auditId[0] : auditId;
    
    try {
      const numericAuditId = safeParseInt(auditIdStr);
      
      // Validate audit exists (simulate 404 for invalid IDs)
      if (numericAuditId < 1 || numericAuditId > 1000) {
        const problem = createNotFoundProblem(
          'audit',
          auditIdStr,
          `/audits/${auditIdStr}/completion`
        );
        
        return createEnhancedResponse(request, problem, 404, 'REAL_TIME');
      }
      
      const clonedRequest = request.clone();
      let requestData: Record<string, unknown> = {};
      
      try {
        const jsonData = await clonedRequest.json();
        if (jsonData && typeof jsonData === 'object') {
          requestData = jsonData;
        }
      } catch {
        console.warn("[MSW] Failed to parse request body for audit completion");
      }
      
      // Enhanced validation using REST utilities
      const validationProblems = validateAuditCompletion(requestData);
      if (validationProblems.length > 0) {
        return createEnhancedResponse(request, validationProblems[0], 400, 'REAL_TIME');
      }
      
      // Business logic validation using REST utilities
      if (!canUserAuditOwnCase(String(requestData.auditor), String(requestData.caseUserId))) {
        const problem = createBusinessLogicProblem(
          'Users cannot audit their own cases',
          `/audits/${auditIdStr}/completion`,
          { violatedRule: 'self-audit-restriction' }
        );
        return createEnhancedResponse(request, problem, 422, 'REAL_TIME');
      }
      
      // Generate completion response with HATEOAS links
      const completionResponse = generateAuditCompletionResponse(numericAuditId, {
        ...requestData,
        status: 'completed',
        isCompleted: true,
      });
      
      // Add HATEOAS links
      const links = {
        self: {
          href: `${API_BASE_PATH}/audits/${auditIdStr}/completion`,
          method: 'GET'
        },
        audit: {
          href: `${API_BASE_PATH}/audits/${auditIdStr}`,
          method: 'GET',
          title: 'Parent audit'
        },
        auditor: {
          href: `${API_BASE_PATH}/users/${requestData.auditor}`,
          method: 'GET',
          title: 'Auditor details'
        }
      };
      
      // Enhanced response with HATEOAS and metadata
      const enhancedResponse = {
        ...completionResponse,
        _links: links,
        _meta: {
          timestamp: new Date().toISOString(),
          completedAt: new Date().toISOString()
        }
      };
      
      // No caching for completion creation
      return createEnhancedResponse(request, enhancedResponse, 200, 'REAL_TIME');
    } catch (error) {
      console.error("[MSW] Error in POST /audits/:auditId/completion handler:", error);
      
      const problem = createInternalErrorProblem(
        'An unexpected error occurred while processing your request',
        `/audits/${auditIdStr}/completion`
      );
      
      return createEnhancedResponse(request, problem, 500, 'REAL_TIME');
    }
  }),

  // Quarterly selections - Resource-based approach
  http.post(`${API_BASE_PATH}/quarterly-selections`, async ({ request }) => {
    try {
      const clonedRequest = request.clone();
      let requestData: { quarterKey?: string; userIds?: number[] } = {};
      
      try {
        const jsonData = await clonedRequest.json();
        if (jsonData && typeof jsonData === 'object') {
          requestData = jsonData as typeof requestData;
        }
      } catch {
        console.warn("[MSW] Failed to parse request body for quarterly selection");
      }
      
      const quarterPeriod = requestData.quarterKey as QuarterPeriod;
      if (!quarterPeriod || !isQuarterPeriod(quarterPeriod)) {
        const errorResponse = {
          success: false,
          error: 'Invalid quarter period'
        };
        return createEnhancedResponse(request, errorResponse, 400, 'REAL_TIME');
      }
      
      const data = generateQuarterlyAuditSelectionCases(quarterPeriod, users);
      
      const response = {
        success: true,
        data
      };
      
      // No caching for quarterly selections (they're generated fresh each time)
      return createEnhancedResponse(request, response, 200, 'REAL_TIME');
    } catch (error) {
      console.error('Error in quarterly selections handler:', error);
      const errorResponse = {
        success: false,
        error: 'Failed to create quarterly selection'
      };
      return createEnhancedResponse(request, errorResponse, 500, 'REAL_TIME');
    }
  }),

  http.get(`${API_BASE_PATH}/quarterly-selections/:period`, ({ params, request }) => {
    try {
      const { period } = params;
      const quarterPeriod = Array.isArray(period) ? period[0] : period;
      
      if (!quarterPeriod || !isQuarterPeriod(quarterPeriod as QuarterPeriod)) {
        const errorResponse = {
          success: false,
          error: 'Invalid quarter period'
        };
        return createEnhancedResponse(request, errorResponse, 400, 'REAL_TIME');
      }
      
      const data = generateQuarterlyAuditSelectionCases(quarterPeriod as QuarterPeriod, users);
      
      const response = {
        success: true,
        data
      };
      
      // Cache quarterly selections for a moderate time
      return createEnhancedResponse(request, response, 200, 'DYNAMIC');
    } catch (error) {
      console.error("[MSW] Error in GET /quarterly-selections/:period handler:", error);
      const errorResponse = {
        success: false,
        error: 'Failed to fetch quarterly selection'
      };
      return createEnhancedResponse(request, errorResponse, 500, 'REAL_TIME');
    }
  }),

  // Audit findings with query parameter support and pagination
  http.get(`${API_BASE_PATH}/audit-findings`, ({ request }) => {
    try {
      const url = new URL(request.url);
      const auditId = url.searchParams.get('auditId');
      const paginationParams = parsePaginationParams(url.searchParams);
      
      if (!auditId) {
        return createEnhancedResponse(request, [], 200, 'DYNAMIC');
      }
      
      const numericAuditId = safeParseInt(auditId);
      const allFindings = generateFindings(numericAuditId);
      
      // Apply pagination to findings
      const paginatedResult = paginateData(allFindings, paginationParams);
      
      // Generate pagination links
      const baseUrl = `${API_BASE_PATH}/audit-findings?auditId=${auditId}`;
      const paginationLinks = generatePaginationLinks(
        baseUrl,
        paginatedResult.metadata.page,
        paginatedResult.metadata.pages,
        paginatedResult.metadata.limit
      );
      
      const response = createSuccessResponse(
        paginatedResult.data,
        paginationLinks,
        {
          timestamp: new Date().toISOString(),
          total: paginatedResult.metadata.total,
          pagination: paginatedResult.metadata
        }
      );
      
      // Cache findings data conditionally
      return createEnhancedResponse(request, response, 200, 'CONDITIONAL');
    } catch (error) {
      console.error("[MSW] Error in GET /audit-findings handler:", error);
      return createEnhancedResponse(request, [], 200, 'REAL_TIME');
    }
  }),

  // Get ALL cases by quarter (not just selected for audit)
  http.get(`${API_BASE_PATH}/cases/quarter/:quarter`, ({ params }) => {
    try {
      const { quarter } = params;
      
      const quarterValue = Array.isArray(quarter) ? quarter[0] : quarter ?? '';
      const parsedQuarter = parseQuarter(quarterValue);
      
      console.log(`[MSW] Requested ALL cases for quarter: ${quarterValue}`, parsedQuarter);
      
      if (!parsedQuarter) {
        console.log(`[MSW] Failed to parse quarter: ${quarterValue}`);
        return HttpResponse.json([], { status: 200 });
      }
      
      // Filter ALL cases for the requested quarter
      const quarterCases = mockCases.filter(caseItem => {
        try {
          const { quarterNum, year } = getQuarterFromDate(caseItem.notificationDate);
          return quarterNum === parsedQuarter.quarterNum && 
                year === parsedQuarter.year;
        } catch {
          return false;
        }
      });
      
      console.log(`[MSW] Found ${quarterCases.length} cases for quarter Q${parsedQuarter.quarterNum}-${parsedQuarter.year}`);
      
      // Convert to case object format
      const cases = quarterCases
        .map(caseItem => {
          try {
            return caseToCaseObj(caseItem);
          } catch {
            return null;
          }
        })
        .filter(caseObj => caseObj !== null);
      
      return HttpResponse.json(cases, { status: 200 });
    } catch (error) {
      console.error("[MSW] Error in /rest/kuk/v1/cases/quarter/:quarter handler:", error);
      return HttpResponse.json([], { status: 200 });
    }
  }),

  // Get audits by auditor
  http.get(`${API_BASE_PATH}/audits/auditor/:auditorId`, ({ params }) => {
    try {
      const { auditorId } = params;
      const auditorIdValue = Array.isArray(auditorId) ? auditorId[0] : auditorId;
      const numericAuditorId = safeParseInt(auditorIdValue);
      
      // Filter cases to create mock audits for the given auditor
      // In this mock, we'll use modulo operation to assign audits to auditors
      const filteredCases = mockCases.filter(caseItem => 
        (getNumericId(caseItem.id) % 2) + 1 === numericAuditorId
      );
      
      // Convert to API format - use a recent quarter for these
      const currentQuarter: QuarterPeriod = generateCurrentQuarterString() as QuarterPeriod;
      const audits = filteredCases
        .map(caseItem => {
          try {
            const caseObj = caseToCaseObj(caseItem);
            return caseToAudit(caseObj, currentQuarter);
          } catch {
            return null;
          }
        })
        .filter(audit => audit !== null);
      
      // Add any audits from our store that match this auditor
      for (const [, audit] of Array.from(auditStore.entries())) {
        if (audit.auditor && audit.auditor.userId === numericAuditorId) {
          audits.push(audit);
        }
      }
      
      return HttpResponse.json(audits, { status: 200 });
    } catch (error) {
      console.error("[MSW] Error in /rest/kuk/v1/audits/auditor/:auditorId handler:", error);
      return HttpResponse.json([], { status: 200 });
    }
  }),

  // Create Audit
  http.post(`${API_BASE_PATH}/audits`, async ({ request }) => {
    try {
      // Clone the request to avoid "Body is unusable" errors
      const clonedRequest = request.clone();
      
      let requestData: ApiAuditRequestPayload = {};
      
      try {
        requestData = await clonedRequest.json() as typeof requestData;
      } catch (error) {
        // Ignore parse error but log warning
        console.warn("[MSW] Failed to parse request body for /rest/kuk/v1/audits POST", error);
      }
      
      // Generate a new audit ID
      const auditId = generateRandomAuditId();
      
      // Create valid quarter format if needed
      let quarter = requestData.quarter;
      if (!quarter || !isQuarterPeriod(quarter)) {
        quarter = generateCurrentQuarterString();
      }
      
      // Create a new audit object
      const newAudit: ApiAuditResponse = {
        auditId,
        quarter: quarter as QuarterPeriod,
        caseObj: {
          caseNumber: createCaseId(generateRandomCaseNumber()),
          claimOwner: {
            userId: typeof requestData.caseObj === 'object' && requestData.caseObj?.claimOwner?.userId !== undefined 
              ? safeParseInt(String(requestData.caseObj.claimOwner.userId)) 
              : 1,
            role: typeof requestData.caseObj === 'object' && requestData.caseObj?.claimOwner?.role !== undefined
              ? requestData.caseObj.claimOwner.role
              : USER_ROLE_ENUM.TEAM_LEADER
          },
          claimsStatus: (requestData.caseObj?.claimsStatus as ClaimsStatus) || CLAIMS_STATUS.FULL_COVER,
          coverageAmount: requestData.caseObj?.coverageAmount ?? 10000.00,
          caseStatus: (requestData.caseObj?.caseStatus as CASE_STATUS_ENUM) || CASE_STATUS_MAPPING.COMPENSATED,
          notificationDate: generateCurrentDateString(),
          notifiedCurrency: CURRENCY.CHF
        },
        auditor: {
          userId: requestData.auditor?.userId !== undefined 
            ? safeParseInt(requestData.auditor.userId)
            : 2,
          role: requestData.auditor?.role ?? USER_ROLE_ENUM.SPECIALIST
        }
      };
      
      // Store the audit
      auditStore.set(auditId, newAudit);
      
      return HttpResponse.json(newAudit, { status: 201 });
    } catch (error) {
      console.error("[MSW] Error in /rest/kuk/v1/audits POST handler:", error);
      
      // Return a fallback audit object
      const fallbackAudit = generateFallbackAudit();
      
      return HttpResponse.json(fallbackAudit, { status: 201 });
    }
  }),

  // Update Audit
  http.put(`${API_BASE_PATH}/audits/:auditId`, async ({ params, request }) => {
    try {
      const { auditId } = params;
      const auditIdValue = Array.isArray(auditId) ? auditId[0] : auditId;
      const numericAuditorId = safeParseInt(auditIdValue);
      
      // Clone the request to avoid "Body is unusable" errors
      const clonedRequest = request.clone();
      
      let requestData: Record<string, unknown> = {
        type: "DOCUMENTATION_ISSUE",
        description: "No description provided"
      };
      
      try {
        const jsonData = await clonedRequest.json();
        if (jsonData && typeof jsonData === 'object') {
          requestData = {
            type: jsonData.type ?? requestData.type,
            description: jsonData.description ?? requestData.description,
            quarter: jsonData.quarter ?? requestData.quarter,
            caseObj: jsonData.caseObj ?? requestData.caseObj,
            auditor: jsonData.auditor ?? requestData.auditor
          };
        }
      } catch (error) {
        // Ignore parse error but log warning
        console.warn("[MSW] Failed to parse request body, using default data", error);
      }
      
      // Fix requestData.quarter if needed
      if (requestData.quarter && !isQuarterPeriod(requestData.quarter as string)) {
        requestData.quarter = generateCurrentQuarterString();
      }
      
      // Get existing audit or create a placeholder
      let existingAudit = auditStore.get(numericAuditorId);
      
      if (!existingAudit) {
        // If not in our store, create a new one with this ID
        const quarterStr = generateCurrentQuarterString();
        
        existingAudit = {
          auditId: numericAuditorId,
          quarter: (requestData.quarter && isQuarterPeriod(requestData.quarter as string) ? requestData.quarter : quarterStr) as QuarterPeriod,
          caseObj: {
            caseNumber: createCaseId(generateRandomCaseNumber()),
            claimOwner: {
              userId: 1,
              role: USER_ROLE_ENUM.TEAM_LEADER
            },
            claimsStatus: CLAIMS_STATUS.FULL_COVER,
            coverageAmount: 10000.00,
            caseStatus: CASE_STATUS_MAPPING.COMPENSATED,
            notificationDate: generateCurrentDateString(),
            notifiedCurrency: CURRENCY.CHF
          },
          auditor: {
            userId: 2,
            role: USER_ROLE_ENUM.SPECIALIST
          }
        };
      }
      
      // Update audit with new data
      const updatedAudit = {
        ...existingAudit,
        ...(requestData.quarter ? { quarter: requestData.quarter as QuarterPeriod } : {}),
        ...(requestData.caseObj && typeof requestData.caseObj === 'object' ? { caseObj: {
          ...existingAudit.caseObj,
          // Safely handle caseObj properties with proper typing
          ...((requestData.caseObj as Record<string, unknown>)?.caseNumber !== undefined ? { 
            caseNumber: createCaseId(safeParseInt((requestData.caseObj as Record<string, unknown>).caseNumber as string))
          } : {}),
          ...((requestData.caseObj as Record<string, unknown>)?.claimOwner ? {
                claimOwner: {
                  ...existingAudit.caseObj.claimOwner,
              ...((requestData.caseObj as Record<string, unknown>).claimOwner as Record<string, unknown>)?.userId !== undefined ? {
                userId: safeParseInt(String(((requestData.caseObj as Record<string, unknown>).claimOwner as Record<string, unknown>).userId))
              } : {},
              ...((requestData.caseObj as Record<string, unknown>)?.claimOwner as Record<string, unknown>)?.role ? {
                role: ((requestData.caseObj as Record<string, unknown>).claimOwner as Record<string, unknown>).role
              } : {}
            }
          } : {}),
          ...((requestData.caseObj as Record<string, unknown>)?.claimsStatus ? {
            claimsStatus: (requestData.caseObj as Record<string, unknown>).claimsStatus
          } : {}),
          ...((requestData.caseObj as Record<string, unknown>)?.coverageAmount !== undefined ? {
            coverageAmount: safeParseInt((requestData.caseObj as Record<string, unknown>).coverageAmount as string | number, existingAudit.caseObj.coverageAmount)
          } : {}),
          ...((requestData.caseObj as Record<string, unknown>)?.caseStatus ? {
            caseStatus: (requestData.caseObj as Record<string, unknown>).caseStatus
          } : {}),
          ...((requestData.caseObj as Record<string, unknown>)?.notifiedCurrency ? {
            notifiedCurrency: (requestData.caseObj as Record<string, unknown>).notifiedCurrency as ValidCurrency
            } : {})
        }} : {}),
        ...(requestData.auditor && typeof requestData.auditor === 'object' ? { auditor: {
          ...existingAudit.auditor,
          // Safely handle auditor properties with proper typing
          ...((requestData.auditor as Record<string, unknown>)?.userId !== undefined ? {
            userId: safeParseInt(String((requestData.auditor as Record<string, unknown>).userId))
          } : {}),
          ...((requestData.auditor as Record<string, unknown>)?.role ? {
            role: (requestData.auditor as Record<string, unknown>).role
          } : {})
        }} : {})
      };
      
      // Store the updated audit
      auditStore.set(numericAuditorId, updatedAudit as ApiAuditResponse);
      
      return HttpResponse.json(updatedAudit, { status: 200 });
    } catch (error) {
      console.error("[MSW] Error in /rest/kuk/v1/audits/:auditId PUT handler:", error);
      
      // Return a fallback updated audit
      const fallbackAudit = {
        ...generateFallbackAudit(),
        auditId: safeParseInt(Array.isArray(params.auditId) ? params.auditId[0] : params.auditId, 1)
      } as ApiAuditResponse;
      
      return HttpResponse.json(fallbackAudit, { status: 200 });
    }
  }),

  // Get findings for an audit
  http.get(`${API_BASE_PATH}/audits/:auditId/findings`, ({ params }) => {
    try {
      const { auditId } = params;
      
      // Generate mock findings for this audit
      const auditIdValue = Array.isArray(auditId) ? auditId[0] : auditId;
      const findings = generateFindings(auditIdValue ?? 1);
      
      return HttpResponse.json(findings, { status: 200 });
    } catch (error) {
      console.error("[MSW] Error in /rest/kuk/v1/audits/:auditId/findings GET handler:", error);
      return HttpResponse.json([], { status: 200 });
    }
  }),

  // Add finding to audit
  http.post(`${API_BASE_PATH}/audits/:auditId/findings`, async ({ params, request }) => {
    try {
      // We don't need auditId for this mock implementation, but it's part of the URL structure
      void params.auditId;
      
      // Clone the request to avoid "Body is unusable" errors
      const clonedRequest = request.clone();
      
      let requestData: Record<string, unknown> = {
        type: "DOCUMENTATION_ISSUE",
        description: "No description provided"
      };
      
      try {
        const jsonData = await clonedRequest.json();
        if (jsonData && typeof jsonData === 'object') {
          requestData = {
            type: jsonData.type ?? requestData.type,
            description: jsonData.description ?? requestData.description
          };
        }
      } catch (error) {
        // Ignore parse error but log warning
        console.warn("[MSW] Failed to parse request body, using default data", error);
      }
      
      // Create a new finding with an ID
      const newFinding = {
        findingId: generateRandomFindingId(),
        type: requestData.type ?? "DOCUMENTATION_ISSUE",
        description: requestData.description ?? "No description provided"
      };
      
      return HttpResponse.json(newFinding, { status: 201 });
    } catch (error) {
      console.error("[MSW] Error in /rest/kuk/v1/audits/:auditId/findings POST handler:", error);
      return HttpResponse.json({
        findingId: generateRandomFindingId(),
        type: "DOCUMENTATION_ISSUE",
        description: "Error creating finding"
      }, { status: 201 });
    }
  }),

  // Select cases for audit
  http.get(`${API_BASE_PATH}/audits/select-cases/:quarter`, ({ params, request }) => {
    try {
      const { quarter } = params;
      const url = new URL(request.url);
      const preLoadedCount = parseInt(url.searchParams.get('preLoadedCount') ?? '0');
      
      const quarterValue = Array.isArray(quarter) ? quarter[0] : quarter ?? '';
      const parsedQuarter = parseQuarter(quarterValue);
      
      if (!parsedQuarter) {
        return HttpResponse.json([], { status: 200 });
      }
      
      // Total cases should always be 8, minus any pre-loaded cases
      const totalNeeded = 8 - preLoadedCount;
      
      // Calculate how many current quarter and previous quarter cases we need
      // Original ratio: 6 current, 2 previous = 8 total
      // If we have pre-loaded cases, we need to adjust
      const currentQuarterNeeded = Math.max(0, 6 - preLoadedCount); // Reduce current quarter cases first
      const previousQuarterNeeded = totalNeeded > currentQuarterNeeded ? Math.min(2, totalNeeded - currentQuarterNeeded) : 0;
      
      console.log(`[MSW] Auto-selecting for ${quarterValue}: preLoaded=${preLoadedCount}, currentNeeded=${currentQuarterNeeded}, previousNeeded=${previousQuarterNeeded}, total=${currentQuarterNeeded + previousQuarterNeeded + preLoadedCount}`);
      
      // Get cases for the current quarter - using notificationDate to deduce quarter
      const currentQuarterCases = mockCases
        .filter(caseItem => {
          try {
            // Use the notificationDate property to deduce quarter
            const { quarterNum, year } = getQuarterFromDate(caseItem.notificationDate);
            
            return quarterNum === parsedQuarter.quarterNum && 
                  year === parsedQuarter.year;
          } catch {
            return false;
          }
        })
        .slice(0, currentQuarterNeeded) // Take only what we need
        .map(caseItem => caseToCaseObj(caseItem))
        .filter(caseObj => caseObj !== null);
      
      // Get cases from previous quarter - using notificationDate to deduce quarter
      const { quarter: prevQuarterNum, year: prevYear } = getPreviousQuarterInfo(parsedQuarter.quarterNum, parsedQuarter.year);
      
      const previousQuarterCases = mockCases
        .filter(caseItem => {
          if (!caseItem.notificationDate) return false;
          const { quarterNum: caseQuarter, year: caseYear } = getQuarterFromDate(caseItem.notificationDate);
          return caseQuarter === prevQuarterNum && caseYear === prevYear;
        })
        .slice(0, previousQuarterNeeded) // Take only what we need
        .map(caseItem => caseToCaseObj(caseItem))
        .filter(caseObj => caseObj !== null);
      
      // If we don't have enough cases from existing data, generate mock ones
      const totalCurrentCases = currentQuarterCases.length;
      const totalPreviousCases = previousQuarterCases.length;
      
      // Generate additional current quarter cases if needed
      for (let i = totalCurrentCases; i < currentQuarterNeeded; i++) {
        const mockCase = generateMockCurrentQuarterCase(i, parsedQuarter.quarterNum, parsedQuarter.year, users);
        currentQuarterCases.push(mockCase);
      }
      
      // Generate additional previous quarter cases if needed
      for (let i = totalPreviousCases; i < previousQuarterNeeded; i++) {
        const { quarter: prevQuarterNum, year: prevYear } = getPreviousQuarterInfo(parsedQuarter.quarterNum, parsedQuarter.year);
        const mockCase = generateMockPreviousQuarterCase(i, prevQuarterNum, prevYear, users);
        previousQuarterCases.push(mockCase);
      }
      
      // Combine cases (total should be exactly what we need to reach 8 with pre-loaded)
      const allCases = [...currentQuarterCases, ...previousQuarterCases];
      
      console.log(`[MSW] Returning ${allCases.length} auto-selected cases (${currentQuarterCases.length} current + ${previousQuarterCases.length} previous). With ${preLoadedCount} pre-loaded = ${allCases.length + preLoadedCount} total`);
      
      return HttpResponse.json(allCases, { status: 200 });
    } catch (error) {
      console.error("[MSW] Error in /rest/kuk/v1/audits/select-cases/:quarter handler:", error);
      return HttpResponse.json([], { status: 200 });
    }
  }),

  // Get all users
  http.get(`${API_BASE_PATH}/users`, () => {
    return HttpResponse.json({ 
      success: true, 
      data: users
    });
  }),
  
  http.get(`${API_BASE_PATH}/users/:id`, ({ params }) => {
    const user = users.find(u => u.id === createUserId(params.id as string));
    
    if (!user) {
      return HttpResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json({ 
      success: true, 
      data: user
    });
  }),
  
  // Get current logged-in user
  http.get(`${API_BASE_PATH}/auth/current-user`, () => {
    // In production, this would return information about the currently logged-in user
    // For our mock, we pretend the logged-in user is the team leader with id '4'
    const currentUser = users.find(u => u.id === createUserId('4'));
    
    if (currentUser) {
      return HttpResponse.json({ 
        success: true, 
        data: currentUser
      });
    }
    
    return HttpResponse.json(
      { success: false, error: 'No current user found' },
      { status: 404 }
    );
  }),

  // Audit completion handlers
  http.get(`${API_BASE_PATH}/audit-completion/select-quarterly/:quarterPeriod`, async ({ params }) => {
    try {
      const quarterPeriod = params.quarterPeriod as string;
      
      // Generate mock cases for audit selection
      const cases = generateQuarterlyAuditSelectionCases(quarterPeriod, users, 10);
      
      return HttpResponse.json(cases);
    } catch (error) {
      console.error('Error in quarterly case selection handler:', error);
      return HttpResponse.json([], { status: 500 });
    }
  }),

  // POST handler for selecting quarterly dossiers (legacy)
  http.post(`${API_BASE_PATH}/audit-completion/select-quarterly`, async ({ request }) => {
    try {
      // Clone the request to avoid "Body is unusable" errors
      const clonedRequest = request.clone();
      
      const body = await clonedRequest.json() as { quarterKey: string; userIds: string[] };
      const { quarterKey } = body;
      
      // Parse the quarter key (e.g., "Q1-2023")
      const [quarterStr, yearStr] = quarterKey.split('-');
      const quarterNum = parseInt(quarterStr.replace('Q', ''));
      const year = parseInt(yearStr);
      
      // Calculate previous quarter (use the function)
      const { quarter: prevQuarterNum, year: prevYear } = getPreviousQuarterInfo(quarterNum, year);
      
      // Generate mock user audits (would be one per eligible user)
      const userQuarterlyAudits = generateUserQuarterlyAudits(quarterKey, year, users);
      
      // Generate mock previous quarter audits for quality control
      const previousQuarterRandomAudits = generatePreviousQuarterRandomAudits(prevQuarterNum, prevYear, users, 2);
      
      return HttpResponse.json({
        success: true,
        data: {
          quarterKey,
          userQuarterlyAudits,
          previousQuarterRandomAudits,
          lastSelectionDate: generateCurrentTimestamp()
        }
      });
    } catch (error) {
      console.error('Error in quarterly dossier selection handler:', error);
      return HttpResponse.json(
        { success: false, error: 'Failed to select quarterly dossiers' },
        { status: 500 }
      );
    }
  }),

  // =======================================================
  // PRE-LOADED CASES ENDPOINT
  // =======================================================

  // GET /rest/kuk/v1/pre-loaded-cases - Get pre-loaded cases (verified and in-progress)
  http.get(`${API_BASE_PATH}/pre-loaded-cases`, () => {
    const preLoadedCases = mockCases.filter((caseItem: typeof mockCases[0]) => 
      caseItem.caseType === 'PRE_LOADED'
    ).map((caseItem: typeof mockCases[0]) => ({
      id: caseItem.id,
      userId: caseItem.userId,
      auditor: caseItem.auditor,
      isCompleted: caseItem.isCompleted,
      comment: caseItem.comment,
      rating: caseItem.rating,
      specialFindings: caseItem.specialFindings,
      detailedFindings: caseItem.detailedFindings,
      coverageAmount: caseItem.coverageAmount,
      claimsStatus: caseItem.claimsStatus,
      quarter: `Q${caseItem.quarter}-${caseItem.year}`,
      notifiedCurrency: caseItem.notifiedCurrency
    }));

    console.log(`[MSW] Serving ${preLoadedCases.length} pre-loaded cases`);
      
      return HttpResponse.json({
        success: true,
      data: preLoadedCases
    });
  }),

  // =======================================================

  // Legacy endpoints for backward compatibility during transition
  // These support the old API patterns that tests are expecting
  
  // Legacy: POST /audit/{id}/complete
  http.post(`${API_BASE_PATH}/audit/:auditId/complete`, async ({ params, request }) => {
    try {
      const { auditId } = params;
      const numericAuditId = safeParseInt(Array.isArray(auditId) ? auditId[0] : auditId);
      
      const clonedRequest = request.clone();
      let requestData: Record<string, unknown> = {};
      
      try {
        const jsonData = await clonedRequest.json();
        if (jsonData && typeof jsonData === 'object') {
          requestData = jsonData;
        }
      } catch {
        console.warn("[MSW] Failed to parse request body for legacy audit completion");
      }
      
      // Create completion response
      const completionResponse = generateAuditCompletionResponse(numericAuditId, requestData);
      
      return HttpResponse.json(completionResponse, { status: 200 });
    } catch (error) {
      console.error("[MSW] Error in legacy POST /audit/:auditId/complete handler:", error);
      return HttpResponse.json({
        success: false,
        error: 'Failed to complete audit'
      }, { status: 500 });
    }
  }),

  // Legacy: GET /audit-completion/{id}
  http.get(`${API_BASE_PATH}/audit-completion/:auditId`, ({ params }) => {
    try {
      const { auditId } = params;
      const numericAuditId = safeParseInt(Array.isArray(auditId) ? auditId[0] : auditId);
      
      const completionData = generateCompletionData(numericAuditId);
      
      return HttpResponse.json({
        success: true,
        data: completionData
      }, { status: 200 });
    } catch (error) {
      console.error("[MSW] Error in legacy GET /audit-completion/:auditId handler:", error);
      return HttpResponse.json({
        success: false,
        error: 'Failed to fetch audit completion'
      }, { status: 500 });
    }
  }),

  // Legacy: PUT /audit-completion/{id}
  http.put(`${API_BASE_PATH}/audit-completion/:auditId`, async ({ params, request }) => {
    try {
      const { auditId } = params;
      const numericAuditId = safeParseInt(Array.isArray(auditId) ? auditId[0] : auditId);
      
      const clonedRequest = request.clone();
      let requestData: Record<string, unknown> = {};
      try {
        const jsonData = await clonedRequest.json();
        if (jsonData && typeof jsonData === 'object') {
          requestData = jsonData;
        }
      } catch {
        console.warn("[MSW] Failed to parse request body for legacy completion update");
      }
      
      const completionResponse = generateFallbackCompletionResponse(numericAuditId, requestData);
      
      return HttpResponse.json({
        success: true,
        data: completionResponse
      }, { status: 200 });
    } catch (error) {
      console.error("[MSW] Error in legacy PUT /audit-completion/:auditId handler:", error);
      return HttpResponse.json({
        success: false,
        error: 'Failed to update audit completion'
      }, { status: 500 });
    }
  }),

  // =======================================================
];