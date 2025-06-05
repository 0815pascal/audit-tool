import {http, HttpResponse} from 'msw';
import { CURRENCY, ValidCurrency } from '../types/currencyTypes';
import {ClaimsStatus, QuarterPeriod} from '../types/types';
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

export const handlers = [
  // Get audits by quarter
  http.get(`${API_BASE_PATH}/audits/quarter/:quarter`, ({ params }) => {
    try {
      const { quarter } = params;
      
      const quarterValue = Array.isArray(quarter) ? quarter[0] : quarter ?? '';
      const parsedQuarter = parseQuarter(quarterValue);
      
      console.log(`[MSW] Requested quarter: ${quarterValue}`, parsedQuarter);
      
      if (!parsedQuarter) {
        console.log(`[MSW] Failed to parse quarter: ${quarterValue}`);
        return HttpResponse.json([], { status: 200 });
      }
      
      // According to requirements: 8 cases per quarter
      // - 6 cases from current quarter (one per employee)
      // - 2 additional random cases from previous quarter
      
      // Filter cases for the requested quarter (current quarter)
      const currentQuarterCases = mockCases.filter(caseItem => {
        try {
          const { quarterNum, year } = getQuarterFromDate(caseItem.notificationDate);
          return quarterNum === parsedQuarter.quarterNum && 
                year === parsedQuarter.year;
        } catch {
          return false;
        }
      });
      
      console.log(`[MSW] Current quarter (Q${parsedQuarter.quarterNum}-${parsedQuarter.year}) cases:`, currentQuarterCases.length);
      
      // Get previous quarter
      let previousQuarter = parsedQuarter.quarterNum - 1;
      let previousYear = parsedQuarter.year;
      if (previousQuarter < 1) {
        previousQuarter = 4;
        previousYear = parsedQuarter.year - 1;
      }
      
      console.log(`[MSW] Looking for previous quarter: Q${previousQuarter}-${previousYear}`);
      
      // Filter cases for the previous quarter
      const previousQuarterCases = mockCases.filter(caseItem => {
        try {
          const { quarterNum, year } = getQuarterFromDate(caseItem.notificationDate);
          return quarterNum === previousQuarter && 
                year === previousYear;
        } catch {
          return false;
        }
      });
      
      console.log(`[MSW] Previous quarter (Q${previousQuarter}-${previousYear}) cases:`, previousQuarterCases.length);
      
      // Take all available current quarter cases (should be 6 based on requirements)
      // and 2 random cases from previous quarter
      const selectedPreviousCases = shuffleArray(previousQuarterCases)
        .slice(0, 2); // Take first 2
      
      // Combine current quarter cases with 2 previous quarter cases
      const combinedCases = [...currentQuarterCases, ...selectedPreviousCases];
      
      console.log(`[MSW] Returning ${combinedCases.length} total cases (${currentQuarterCases.length} current + ${selectedPreviousCases.length} previous)`);
      
      // Convert to API format
      const audits = combinedCases
        .map(caseItem => {
          try {
            const caseObj = caseToCaseObj(caseItem);
            return caseToAudit(caseObj, quarterValue);
          } catch {
            return null;
          }
        })
        .filter(audit => audit !== null);
      
      // Add any audits from our store that match this quarter
      for (const [, audit] of Array.from(auditStore.entries())) {
        if (audit.quarter === quarter) {
          audits.push(audit);
        }
      }
      
      return HttpResponse.json(audits || [], { status: 200 });
    } catch (error) {
      console.error("[MSW] Error in /rest/kuk/v1/audits/quarter/:quarter handler:", error);
      return HttpResponse.json([], { status: 200 });
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
      
      let requestData: ApiAuditRequestPayload = {
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
      if (requestData.quarter && !isQuarterPeriod(requestData.quarter)) {
        requestData.quarter = generateCurrentQuarterString();
      }
      
      // Get existing audit or create a placeholder
      let existingAudit = auditStore.get(numericAuditorId);
      
      if (!existingAudit) {
        // If not in our store, create a new one with this ID
        const quarterStr = generateCurrentQuarterString();
        
        existingAudit = {
          auditId: numericAuditorId,
          quarter: (requestData.quarter && isQuarterPeriod(requestData.quarter) ? requestData.quarter : quarterStr) as QuarterPeriod,
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
        ...(requestData.quarter && { quarter: requestData.quarter as QuarterPeriod }),
        ...(requestData.caseObj && { caseObj: {
          ...existingAudit.caseObj,
          // Safely handle caseObj properties
          ...(typeof requestData.caseObj === 'object' ? 
            // Only include properties that can be safely typed
            {
              ...(requestData.caseObj.caseNumber !== undefined && { 
                caseNumber: createCaseId(safeParseInt(requestData.caseObj.caseNumber))
              }),
              ...(requestData.caseObj.claimOwner && {
                claimOwner: {
                  ...existingAudit.caseObj.claimOwner,
                  ...(requestData.caseObj.claimOwner.userId !== undefined && {
                    userId: safeParseInt(String(requestData.caseObj.claimOwner.userId))
                  }),
                  ...(requestData.caseObj.claimOwner.role && {
                    role: requestData.caseObj.claimOwner.role
                  })
                }
              }),
              ...(requestData.caseObj.claimsStatus && {
                claimsStatus: requestData.caseObj.claimsStatus
              }),
              ...(requestData.caseObj.coverageAmount !== undefined && {
                coverageAmount: safeParseInt(requestData.caseObj.coverageAmount as string | number, existingAudit.caseObj.coverageAmount)
              }),
              ...(requestData.caseObj.caseStatus && {
                caseStatus: requestData.caseObj.caseStatus
              }),
              ...(requestData.caseObj.notifiedCurrency && {
                notifiedCurrency: requestData.caseObj.notifiedCurrency as ValidCurrency
              })
            } : {})
        }}),
        ...(requestData.auditor && { auditor: {
          ...existingAudit.auditor,
          // Safely handle auditor properties
          ...(requestData.auditor.userId !== undefined && {
            userId: safeParseInt(String(requestData.auditor.userId))
          }),
          ...(requestData.auditor.role && {
            role: requestData.auditor.role
          })
        }})
      };
      
      // Store the updated audit
      auditStore.set(numericAuditorId, updatedAudit);
      
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
      
      let requestData: { type: string; description: string; } = {
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
        type: requestData.type || "DOCUMENTATION_ISSUE",
        description: requestData.description || "No description provided"
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

  // Get audit completion data
  http.get(`${API_BASE_PATH}/audit-completion/:auditId`, async ({ params }) => {
    try {
      const { auditId } = params;
      const numericAuditId = safeParseInt(Array.isArray(auditId) ? auditId[0] : auditId);
      
      // For now, return a basic completion response
      const completionData = generateCompletionData(numericAuditId);
      
      return HttpResponse.json({
        success: true,
        data: completionData
      }, { status: 200 });
    } catch (error) {
      console.error("[MSW] Error in /rest/kuk/v1/audit-completion/:auditId GET handler:", error);
      return HttpResponse.json({
        success: false,
        error: 'Failed to fetch completion data'
      }, { status: 500 });
    }
  }),
  
  // Update audit completion data
  http.put(`${API_BASE_PATH}/audit-completion/:auditId`, async ({ params, request }) => {
    try {
      const { auditId } = params;
      const numericAuditId = safeParseInt(Array.isArray(auditId) ? auditId[0] : auditId);
      
      // Clone the request to avoid "Body is unusable" errors
      const clonedRequest = request.clone();
      
      // Parse request body
      let requestData: {
        status?: string;
        verifierId?: number;
        rating?: string;
        comment?: string;
        findings?: Array<{
          type: string;
          description: string;
          category: string;
        }>;
      } = {};
      try {
        const jsonData = await clonedRequest.json();
        if (jsonData && typeof jsonData === 'object') {
          requestData = jsonData as typeof requestData;
        }
      } catch {
        console.warn("[MSW] Failed to parse request body for completion update");
      }
      
      // In a real implementation, this would save to the database
      // For now, just return a success response with the data
      const completionResponse = generateFallbackCompletionResponse(numericAuditId, requestData);
      
      return HttpResponse.json({
        success: true,
        data: completionResponse
      }, { status: 200 });
    } catch (error) {
      console.error("[MSW] Error in /rest/kuk/v1/audit-completion/:auditId PUT handler:", error);
      return HttpResponse.json({
        success: false,
        error: 'Failed to update completion data'
      }, { status: 500 });
    }
  }),

  // Complete audit - POST handler for /audit/{id}/complete
  http.post(`${API_BASE_PATH}/audit/:auditId/complete`, async ({ params, request }) => {
    try {
      const { auditId } = params;
      const numericAuditId = safeParseInt(Array.isArray(auditId) ? auditId[0] : auditId);
      
      // Clone the request to avoid "Body is unusable" errors
      const clonedRequest = request.clone();
      
      // Parse request body
      let requestData: {
        auditor?: string;
        rating?: string;
        comment?: string;
        specialFindings?: Record<string, boolean>;
        detailedFindings?: Record<string, boolean>;
        status?: string;
        isCompleted?: boolean;
      } = {};
      
      try {
        const jsonData = await clonedRequest.json();
        if (jsonData && typeof jsonData === 'object') {
          requestData = jsonData as typeof requestData;
        }
      } catch {
        console.warn("[MSW] Failed to parse request body for audit completion");
      }
      
      // Create completion response
      const completionResponse = generateAuditCompletionResponse(numericAuditId, requestData);
      
      return HttpResponse.json(completionResponse, { status: 200 });
    } catch (error) {
      console.error("[MSW] Error in /rest/kuk/v1/audit/:auditId/complete POST handler:", error);
      return HttpResponse.json({
        success: false,
        error: 'Failed to complete audit'
      }, { status: 500 });
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
];