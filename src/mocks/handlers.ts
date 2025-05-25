import { http, HttpResponse } from 'msw';
import { 
  ClaimsStatus, 
  CaseStatus, 
  QuarterPeriod,
  isQuarterPeriod,
  QuarterNumber,
  createCaseId,
  createUserId
} from '../types';
import { 
  CLAIMS_STATUS, 
  CASE_STATUS, 
  QUARTER_CALCULATIONS
} from '../constants';
import { USER_ROLE_ENUM, DEFAULT_VALUE_ENUM } from '../enums';
import { createCaseAuditId } from '../types';
import { generateRealisticCaseNumber } from '../utils/statusUtils';
import {
  ApiCaseResponse,
  ApiAuditResponse,
  ApiAuditRequestPayload
} from './mockTypes';
import {
  auditStore,
  safeParseInt,
  getNumericId,
  parseQuarter,
  getQuarterFromDate,
  caseToCaseObj,
  caseToAudit,
  generateFindings,
  getPreviousQuarterInfo
} from './auxiliaryFunctions';
import { users, mockCases } from './mockData';

export const handlers = [
  // Get audits by quarter
  http.get('/api/audits/quarter/:quarter', ({ params }) => {
    try {
      const { quarter } = params;
      console.log(`[MSW] Handling request for quarter: ${quarter}`);
      
      const quarterValue = Array.isArray(quarter) ? quarter[0] : quarter ?? '';
      const parsedQuarter = parseQuarter(quarterValue);
      
      if (!parsedQuarter) {
        console.warn(`[MSW] Could not parse quarter string: ${quarter}`);
        return HttpResponse.json([], { status: 200 });
      }
      
      console.log(`[MSW] Parsed quarter: ${parsedQuarter.quarterNum}, year: ${parsedQuarter.year}`);
      
      // Filter cases for the requested quarter
      const filteredCases = mockCases.filter(caseItem => {
        try {
          const { quarterNum, year } = getQuarterFromDate(caseItem.notificationDate);
          
          return quarterNum === parsedQuarter.quarterNum && 
                year === parsedQuarter.year;
        } catch (_e) {
          console.warn(`[MSW] Error filtering case ${caseItem.id}:`, _e);
          return false;
        }
      });
      
      console.log(`[MSW] Filtered ${filteredCases.length} cases`);
      
      // Convert to API format
      const audits = filteredCases
        .map(caseItem => {
          try {
            return caseToAudit(caseItem, quarterValue);
          } catch (e) {
            console.warn(`[MSW] Error converting case ${caseItem.id} to audit:`, e);
            return null;
          }
        })
        .filter(audit => audit !== null);
      
      // Add any audits from our store that match this quarter
      let storeAudits = 0;
      for (const [, audit] of auditStore.entries()) {
        if (audit.quarter === quarter) {
          audits.push(audit);
          storeAudits++;
        }
      }
      
      console.log(`[MSW] Returning ${audits.length} audits (${storeAudits} from store)`);
      
      return HttpResponse.json(audits || [], { status: 200 });
    } catch (error) {
      console.error("[MSW] Error in /api/audits/quarter/:quarter handler:", error);
      return HttpResponse.json([], { status: 200 });
    }
  }),

  // Get audits by auditor
  http.get('/api/audits/auditor/:auditorId', ({ params }) => {
    try {
      const { auditorId } = params;
      const auditorIdValue = Array.isArray(auditorId) ? auditorId[0] : auditorId;
      const numericAuditorId = safeParseInt(auditorIdValue);
      console.log(`[MSW] Handling request for auditor: ${auditorId}`);
      
      // Filter cases to create mock audits for the given auditor
      // In this mock, we'll use modulo operation to assign audits to auditors
      const filteredCases = mockCases.filter(caseItem => 
        (getNumericId(caseItem.id) % 2) + 1 === numericAuditorId
      );
      
      // Convert to API format - use a recent quarter for these
      const currentQuarter = `Q${Math.floor((new Date().getMonth()) / 3) + 1}-${new Date().getFullYear()}`;
      const audits = filteredCases
        .map(caseItem => {
          try {
            return caseToAudit(caseItem, currentQuarter);
          } catch (e) {
            console.warn(`[MSW] Error converting case to audit:`, e);
            return null;
          }
        })
        .filter(audit => audit !== null);
      
      // Add any audits from our store that match this auditor
      for (const [, audit] of auditStore.entries()) {
        if (audit.auditor && audit.auditor.userId === numericAuditorId) {
          audits.push(audit);
        }
      }
      
      console.log(`[MSW] Returning ${audits.length} audits for auditor ${auditorId}`);
      
      return HttpResponse.json(audits, { status: 200 });
    } catch (error) {
      console.error("[MSW] Error in /api/audits/auditor/:auditorId handler:", error);
      return HttpResponse.json([], { status: 200 });
    }
  }),

  // Create Audit
  http.post('/api/audits', async ({ request }) => {
    try {
      let requestData: ApiAuditRequestPayload = {};
      
      try {
        requestData = await request.json() as typeof requestData;
      } catch (error) {
        // Ignore parse error but log warning
        console.warn("[MSW] Failed to parse request body for /api/audits POST", error);
      }
      
      // Generate a new audit ID
      const auditId = Math.floor(Math.random() * 10000) + 1;
      
      // Create valid quarter format if needed
      let quarter = requestData.quarter;
      if (!quarter || !isQuarterPeriod(quarter)) {
        const now = new Date();
        const currentQuarter = Math.floor((now.getMonth()) / 3) + 1 as QuarterNumber;
        quarter = `Q${currentQuarter}-${now.getFullYear()}` as QuarterPeriod;
      }
      
      // Create a new audit object
      const newAudit: ApiAuditResponse = {
        auditId,
        quarter: quarter as QuarterPeriod,
        caseObj: {
          caseNumber: createCaseId(Math.floor(DEFAULT_VALUE_ENUM.DEFAULT_CASE_NUMBER + Math.random() * DEFAULT_VALUE_ENUM.CASE_NUMBER_RANGE)),
          claimOwner: {
            userId: typeof requestData.caseObj === 'object' && requestData.caseObj?.claimOwner?.userId !== undefined 
              ? safeParseInt(String(requestData.caseObj.claimOwner.userId)) 
              : 1,
            role: typeof requestData.caseObj === 'object' && requestData.caseObj?.claimOwner?.role !== undefined
              ? requestData.caseObj.claimOwner.role
              : USER_ROLE_ENUM.TEAM_LEADER
          },
          claimsStatus: (requestData.caseObj?.claimsStatus as ClaimsStatus) || CLAIMS_STATUS.FULL_COVER,
          coverageAmount: requestData.caseObj?.coverageAmount || 10000.00,
          caseStatus: (requestData.caseObj?.caseStatus as CaseStatus) || CASE_STATUS.COMPENSATED,
          notificationDate: new Date().toISOString().split('T')[0],
          notifiedCurrency: 'CHF'
        },
        auditor: {
          userId: requestData.auditor?.userId !== undefined 
            ? safeParseInt(requestData.auditor.userId as string | number) 
            : 2,
          role: requestData.auditor?.role || USER_ROLE_ENUM.SPECIALIST
        },
        isAkoReviewed: false
      };
      
      // Store the audit
      auditStore.set(auditId, newAudit);
      
      console.log(`[MSW] Created new audit with ID ${auditId}`);
      
      return HttpResponse.json(newAudit, { status: 201 });
    } catch (error) {
      console.error("[MSW] Error in /api/audits POST handler:", error);
      
      // Return a fallback audit object
      const fallbackAudit = {
        auditId: Math.floor(Math.random() * 10000) + 1,
        quarter: `Q${Math.floor((new Date().getMonth()) / 3) + 1}-${new Date().getFullYear()}`,
        caseObj: {
          caseNumber: Math.floor(DEFAULT_VALUE_ENUM.DEFAULT_CASE_NUMBER + Math.random() * DEFAULT_VALUE_ENUM.CASE_NUMBER_RANGE),
          claimOwner: {
            userId: 1,
            role: USER_ROLE_ENUM.TEAM_LEADER
          },
          claimsStatus: CLAIMS_STATUS.FULL_COVER,
          coverageAmount: 10000.00,
          caseStatus: CASE_STATUS.COMPENSATED,
          notificationDate: new Date().toISOString().split('T')[0],
          notifiedCurrency: 'CHF'
        },
        auditor: {
          userId: 2,
          role: USER_ROLE_ENUM.SPECIALIST
        },
        isAkoReviewed: false
      };
      
      return HttpResponse.json(fallbackAudit, { status: 201 });
    }
  }),

  // Update Audit
  http.put('/api/audits/:auditId', async ({ params, request }) => {
    try {
      const { auditId } = params;
      const auditIdValue = Array.isArray(auditId) ? auditId[0] : auditId;
      const numericAuditorId = safeParseInt(auditIdValue);
      
      let requestData: ApiAuditRequestPayload = {
        type: "DOCUMENTATION_ISSUE",
        description: "No description provided"
      };
      
      try {
        const jsonData = await request.json();
        if (jsonData && typeof jsonData === 'object') {
          requestData = {
            type: jsonData.type || requestData.type,
            description: jsonData.description || requestData.description,
            quarter: jsonData.quarter || requestData.quarter,
            caseObj: jsonData.caseObj || requestData.caseObj,
            auditor: jsonData.auditor || requestData.auditor
          };
        }
      } catch (error) {
        // Ignore parse error but log warning
        console.warn("[MSW] Failed to parse request body, using default data", error);
      }
      
      // Fix requestData.quarter if needed
      if (requestData.quarter && !isQuarterPeriod(requestData.quarter)) {
        const now = new Date();
        const currentQuarter = Math.floor((now.getMonth()) / 3) + 1 as QuarterNumber;
        requestData.quarter = `Q${currentQuarter}-${now.getFullYear()}` as QuarterPeriod;
      }
      
      // Get existing audit or create a placeholder
      let existingAudit = auditStore.get(numericAuditorId);
      
      if (!existingAudit) {
        // If not in our store, create a new one with this ID
        const now = new Date();
        const currentQuarter = Math.floor((now.getMonth()) / QUARTER_CALCULATIONS.MONTHS_PER_QUARTER) + QUARTER_CALCULATIONS.QUARTER_OFFSET as QuarterNumber;
        const quarterStr = `Q${currentQuarter}-${now.getFullYear()}` as QuarterPeriod;
        
        existingAudit = {
          auditId: numericAuditorId,
          quarter: requestData.quarter as QuarterPeriod || quarterStr,
          caseObj: {
            caseNumber: createCaseId(Math.floor(DEFAULT_VALUE_ENUM.DEFAULT_CASE_NUMBER + Math.random() * DEFAULT_VALUE_ENUM.CASE_NUMBER_RANGE)),
            claimOwner: {
              userId: 1,
              role: USER_ROLE_ENUM.TEAM_LEADER
            },
            claimsStatus: CLAIMS_STATUS.FULL_COVER as ClaimsStatus,
            coverageAmount: 10000.00,
            caseStatus: CASE_STATUS.COMPENSATED as CaseStatus,
            notificationDate: new Date().toISOString().split('T')[0],
            notifiedCurrency: 'CHF'
          },
          auditor: {
            userId: 2,
            role: USER_ROLE_ENUM.SPECIALIST
          },
          isAkoReviewed: false
        };
      }
      
      // Update audit with new data
      const updatedAudit = {
        ...existingAudit!,
        ...(requestData.quarter && { quarter: requestData.quarter as QuarterPeriod }),
        ...(requestData.caseObj && { caseObj: {
          ...existingAudit!.caseObj,
          // Safely handle caseObj properties
          ...(typeof requestData.caseObj === 'object' ? 
            // Only include properties that can be safely typed
            {
              ...(requestData.caseObj.caseNumber !== undefined && { 
                caseNumber: createCaseId(safeParseInt(requestData.caseObj.caseNumber as string | number))
              }),
              ...(requestData.caseObj.claimOwner && {
                claimOwner: {
                  ...existingAudit!.caseObj.claimOwner,
                  ...(requestData.caseObj.claimOwner.userId !== undefined && {
                    userId: safeParseInt(String(requestData.caseObj.claimOwner.userId))
                  }),
                  ...(requestData.caseObj.claimOwner.role && {
                    role: requestData.caseObj.claimOwner.role
                  })
                }
              }),
              ...(requestData.caseObj.claimsStatus && {
                claimsStatus: requestData.caseObj.claimsStatus as ClaimsStatus
              }),
              ...(requestData.caseObj.coverageAmount !== undefined && {
                coverageAmount: safeParseInt(requestData.caseObj.coverageAmount as string | number, existingAudit!.caseObj.coverageAmount)
              }),
              ...(requestData.caseObj.caseStatus && {
                caseStatus: requestData.caseObj.caseStatus as CaseStatus
              }),
              ...(requestData.caseObj.notifiedCurrency && {
                notifiedCurrency: requestData.caseObj.notifiedCurrency
              })
            } : {})
        }}),
        ...(requestData.auditor && { auditor: {
          ...existingAudit!.auditor,
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
      
      console.log(`[MSW] Updated audit with ID ${numericAuditorId}`);
      
      return HttpResponse.json(updatedAudit, { status: 200 });
    } catch (error) {
      console.error("[MSW] Error in /api/audits/:auditId PUT handler:", error);
      
      // Return a fallback updated audit
      const fallbackAudit: ApiAuditResponse = {
        auditId: safeParseInt(Array.isArray(params.auditId) ? params.auditId[0] : params.auditId, 1),
        quarter: `Q${Math.floor((new Date().getMonth()) / 3) + 1}-${new Date().getFullYear()}` as QuarterPeriod,
        caseObj: {
          caseNumber: createCaseId(Math.floor(DEFAULT_VALUE_ENUM.DEFAULT_CASE_NUMBER + Math.random() * DEFAULT_VALUE_ENUM.CASE_NUMBER_RANGE)),
          claimOwner: {
            userId: 1,
            role: USER_ROLE_ENUM.TEAM_LEADER
          },
          claimsStatus: CLAIMS_STATUS.FULL_COVER as ClaimsStatus,
          coverageAmount: 10000.00,
          caseStatus: CASE_STATUS.COMPENSATED as CaseStatus,
          notificationDate: new Date().toISOString().split('T')[0],
          notifiedCurrency: 'CHF'
        },
        auditor: {
          userId: 2,
          role: USER_ROLE_ENUM.SPECIALIST
        },
        isAkoReviewed: false
      };
      
      return HttpResponse.json(fallbackAudit, { status: 200 });
    }
  }),

  // Get findings for an audit
  http.get('/api/audits/:auditId/findings', ({ params }) => {
    try {
      const { auditId } = params;
      console.log(`[MSW] Getting findings for audit ${auditId}`);
      
      // Generate mock findings for this audit
      const auditIdValue = Array.isArray(auditId) ? auditId[0] : auditId;
      const findings = generateFindings(auditIdValue ?? 1);
      
      return HttpResponse.json(findings, { status: 200 });
    } catch (error) {
      console.error("[MSW] Error in /api/audits/:auditId/findings GET handler:", error);
      return HttpResponse.json([], { status: 200 });
    }
  }),

  // Add finding to audit
  http.post('/api/audits/:auditId/findings', async ({ params, request }) => {
    try {
      const { auditId } = params;
      
      let requestData: { type: string; description: string; } = {
        type: "DOCUMENTATION_ISSUE",
        description: "No description provided"
      };
      
      try {
        const jsonData = await request.json();
        if (jsonData && typeof jsonData === 'object') {
          requestData = {
            type: jsonData.type || requestData.type,
            description: jsonData.description || requestData.description
          };
        }
      } catch (error) {
        // Ignore parse error but log warning
        console.warn("[MSW] Failed to parse request body, using default data", error);
      }
      
      // Create a new finding with an ID
      const newFinding = {
        findingId: Math.floor(Math.random() * 1000) + 1,
        type: requestData.type || "DOCUMENTATION_ISSUE",
        description: requestData.description || "No description provided"
      };
      
      console.log(`[MSW] Added finding to audit ${auditId}:`, newFinding);
      
      return HttpResponse.json(newFinding, { status: 201 });
    } catch (error) {
      console.error("[MSW] Error in /api/audits/:auditId/findings POST handler:", error);
      return HttpResponse.json({
        findingId: Math.floor(Math.random() * 1000) + 1,
        type: "DOCUMENTATION_ISSUE",
        description: "Error creating finding"
      }, { status: 201 });
    }
  }),

  // Select cases for audit
  http.get('/api/audits/select-cases/:quarter', ({ params }) => {
    try {
      const { quarter } = params;
      console.log(`[MSW] Selecting cases for quarter ${quarter}`);
      
      const quarterValue = Array.isArray(quarter) ? quarter[0] : quarter ?? '';
      const parsedQuarter = parseQuarter(quarterValue);
      
      if (!parsedQuarter) {
        console.warn(`[MSW] Could not parse quarter string: ${quarter}`);
        return HttpResponse.json([], { status: 200 });
      }
      
      // Get 8 cases for the current quarter - using notificationDate to deduce quarter
      const currentQuarterCases = mockCases
        .filter(caseItem => {
          try {
            // Use the notificationDate property to deduce quarter
            const notificationDate = caseItem.notificationDate;
            const { quarterNum, year } = getQuarterFromDate(notificationDate);
            
            const isMatch = quarterNum === parsedQuarter.quarterNum && year === parsedQuarter.year;
            if (isMatch) {
              console.log(`[MSW] Found current quarter case: ${caseItem.id} with notificationDate ${notificationDate} (Q${quarterNum}-${year})`);
            }
            return isMatch;
          } catch (_e) {
            console.warn(`[MSW] Error filtering case ${caseItem.id}:`, _e);
            return false;
          }
        })
        .slice(0, 8) // Take 8 cases for current quarter
        .map(caseItem => caseToCaseObj(caseItem))
        .filter(caseObj => caseObj !== null);
      
      // Get 2 random cases from previous quarter - using notificationDate to deduce quarter
      const { quarter: prevQuarterNum, year: prevYear } = getPreviousQuarterInfo(parsedQuarter.quarterNum, parsedQuarter.year);
      console.log(`[MSW] Looking for previous quarter cases: Q${prevQuarterNum}-${prevYear}`);
      
      const previousQuarterCases = mockCases
        .filter(caseItem => {
          try {
            // Use the notificationDate property to deduce quarter
            const notificationDate = caseItem.notificationDate;
            const { quarterNum, year } = getQuarterFromDate(notificationDate);
            
            const isMatch = quarterNum === prevQuarterNum && year === prevYear;
            if (isMatch) {
              console.log(`[MSW] Found previous quarter case: ${caseItem.id} with notificationDate ${notificationDate} (Q${quarterNum}-${year})`);
            }
            return isMatch;
          } catch (_e) {
            console.warn(`[MSW] Error filtering case ${caseItem.id}:`, _e);
            return false;
          }
        })
        .slice(0, 2) // Take 2 random cases from previous quarter
        .map(caseItem => caseToCaseObj(caseItem))
        .filter(caseObj => caseObj !== null);
      
      // If we don't have enough cases, generate some mock ones
      const totalCurrentCases = currentQuarterCases.length;
      const totalPreviousCases = previousQuarterCases.length;
      
      console.log(`[MSW] Found ${totalCurrentCases} current quarter cases, need 8`);
      console.log(`[MSW] Found ${totalPreviousCases} previous quarter cases, need 2`);
      
      // Generate additional current quarter cases if needed
      for (let i = totalCurrentCases; i < 8; i++) {
        // Generate a notification date for the current quarter
        const currentQuarterDate = new Date(parsedQuarter.year, (parsedQuarter.quarterNum - 1) * 3 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1);
        
        // Random currency selection
        const currencies = ['CHF', 'EUR', 'USD'];
        const randomCurrency = currencies[Math.floor(Math.random() * currencies.length)];
        
        const mockCase: ApiCaseResponse = {
          caseNumber: createCaseId(40000000 + i),
          claimOwner: {
            userId: users[i % users.length].id,
            role: users[i % users.length].role
          },
          claimsStatus: i % 2 === 0 ? CLAIMS_STATUS.FULL_COVER : CLAIMS_STATUS.PARTIAL_COVER,
          coverageAmount: Math.floor(Math.random() * 100000) + 1000,
          caseStatus: CASE_STATUS.COMPENSATED,
          notificationDate: currentQuarterDate.toISOString().split('T')[0],
          notifiedCurrency: randomCurrency
        };
        console.log(`[MSW] Generated additional current quarter case with notificationDate: ${mockCase.notificationDate}`);
        currentQuarterCases.push(mockCase);
      }
      
      // Generate additional previous quarter cases if needed
      for (let i = totalPreviousCases; i < 2; i++) {
        // Generate a notification date for the previous quarter
        const { quarter: prevQuarterNum, year: prevYear } = getPreviousQuarterInfo(parsedQuarter.quarterNum, parsedQuarter.year);
        const previousQuarterDate = new Date(prevYear, (prevQuarterNum - 1) * 3 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1);
        
        // Random currency selection
        const currencies = ['CHF', 'EUR', 'USD'];
        const randomCurrency = currencies[Math.floor(Math.random() * currencies.length)];
        
        const mockCase: ApiCaseResponse = {
          caseNumber: createCaseId(30000000 + i),
          claimOwner: {
            userId: users[i % users.length].id,
            role: users[i % users.length].role
          },
          claimsStatus: i % 2 === 0 ? CLAIMS_STATUS.FULL_COVER : CLAIMS_STATUS.PARTIAL_COVER,
          coverageAmount: Math.floor(Math.random() * 100000) + 1000,
          caseStatus: CASE_STATUS.COMPENSATED,
          notificationDate: previousQuarterDate.toISOString().split('T')[0],
          notifiedCurrency: randomCurrency
        };
        console.log(`[MSW] Generated additional previous quarter case with notificationDate: ${mockCase.notificationDate}`);
        previousQuarterCases.push(mockCase);
      }
      
      // Combine all cases (8 current + 2 previous = 10 total)
      const allCases = [...currentQuarterCases, ...previousQuarterCases];
      
      console.log(`[MSW] Returning ${allCases.length} cases (${currentQuarterCases.length} current quarter + ${previousQuarterCases.length} previous quarter)`);
      console.log(`[MSW] Cases now include notificationDate for quarter deduction`);
      
      // Log the notification dates of all returned cases for verification
      allCases.forEach((caseObj, index) => {
        const { quarterNum, year } = getQuarterFromDate(caseObj.notificationDate);
        console.log(`[MSW] Case ${index + 1}: notificationDate ${caseObj.notificationDate} → Q${quarterNum}-${year}, currency: ${caseObj.notifiedCurrency}`);
      });
      
      return HttpResponse.json(allCases, { status: 200 });
    } catch (error) {
      console.error("[MSW] Error in /api/audits/select-cases/:quarter handler:", error);
      return HttpResponse.json([], { status: 200 });
    }
  }),

  // Get all users
  http.get('/api/users', () => {
    return HttpResponse.json({ 
      success: true, 
      data: users
    });
  }),
  
  http.get('/api/users/:id', ({ params }) => {
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
  
  // Verification handlers
  
  // Handler for getting audits by user/auditor
  http.get('/api/audits/auditor/:userId', ({ params }) => {
    const { userId } = params;
    const userIdValue = userId ? userId.toString() : '';
    
    // Generate audit objects for this user
    const auditCount = getNumericId(userIdValue) % 5 + 1; // 1-5 audits based on ID
    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
    const year = now.getFullYear();
    
    const audits = Array.from({ length: auditCount }, (_, i) => {
      const caseNumber = createCaseId(30040000 + getNumericId(userIdValue) * 100 + i);
      const caseObj = {
        caseNumber,
        claimOwner: {
          userId: createUserId(userIdValue),
          role: Math.random() > 0.7 ? USER_ROLE_ENUM.SPECIALIST : USER_ROLE_ENUM.STAFF
        },
        coverageAmount: Math.floor(Math.random() * 100000) + 500,
        claimsStatus: Math.random() > 0.7 ? CLAIMS_STATUS.PARTIAL_COVER : CLAIMS_STATUS.FULL_COVER as ClaimsStatus,
        caseStatus: CASE_STATUS.COMPENSATED as CaseStatus
      };
      
      return {
        auditId: (getNumericId(userIdValue) * 1000 + i + 1),
        quarter: `Q${currentQuarter}-${year}` as QuarterPeriod,
        caseObj,
        auditor: {
          userId: createUserId(userIdValue),
          role: Math.random() > 0.7 ? USER_ROLE_ENUM.SPECIALIST : USER_ROLE_ENUM.STAFF
        },
        isAkoReviewed: Math.random() > 0.8 // 20% chance of being reviewed
      };
    });
    
    return HttpResponse.json({ 
      success: true, 
      data: audits
    });
  }),
  
  // Get random audit for user
  http.get('/api/audits/random/:userId', ({ params, request }) => {
    try {
      const { userId } = params;
    const url = new URL(request.url);
      const quarter = url.searchParams.get('quarter');
      const year = url.searchParams.get('year');
      
      console.log(`[MSW] Getting random audit for user ${userId}, quarter ${quarter}, year ${year}`);
      
      // Parse the user ID
      const userIdValue = Array.isArray(userId) ? userId[0] : userId;
      const numericUserId = safeParseInt(userIdValue);
      
      // Parse the quarter (e.g., "Q1-2023")
      let quarterPeriod: QuarterPeriod;
      if (!quarter || !isQuarterPeriod(quarter)) {
        const currentYear = year ? parseInt(year) : new Date().getFullYear();
        const currentQuarter = Math.floor((new Date().getMonth()) / 3) + 1 as QuarterNumber;
        quarterPeriod = `Q${currentQuarter}-${currentYear}` as QuarterPeriod;
      } else {
        quarterPeriod = quarter as QuarterPeriod;
      }
      
      // Try to find a suitable audit for this user
      const filteredAudits = mockCases
        .filter(caseItem => {
          // Some logic to determine if this case should be assigned to this user
          return getNumericId(caseItem.id) % 5 === numericUserId % 5;
        })
        .slice(0, 3); // Limit to 3 possible audits
      
      if (filteredAudits.length > 0) {
        // Pick one randomly
        const randomIndex = Math.floor(Math.random() * filteredAudits.length);
        const randomCase = filteredAudits[randomIndex];
        const auditRecord = caseToAudit(randomCase, quarterPeriod);
        
        // Add dossierRisk to the audit record
        const auditWithRisk = {
          ...auditRecord,
          dossierRisk: Math.floor(Math.random() * 10) + 1
        };
        
        console.log(`[MSW] Found random audit for user ${userId}`);
        return HttpResponse.json({
          success: true,
          data: auditWithRisk
        }, { status: 200 });
      }
      
      // If no audit found, create a fallback audit
      console.log(`[MSW] Creating fallback audit for user ${userId}`);
      const fallbackAudit = {
        auditId: createCaseAuditId((Math.floor(Math.random() * 10000) + 1).toString()),
        quarter: quarterPeriod,
        caseObj: {
          caseNumber: createCaseId(Math.floor(DEFAULT_VALUE_ENUM.DEFAULT_CASE_NUMBER + Math.random() * DEFAULT_VALUE_ENUM.CASE_NUMBER_RANGE)),
          claimOwner: {
            userId: numericUserId,
            role: USER_ROLE_ENUM.SPECIALIST
          },
          coverageAmount: 0,
          claimsStatus: CLAIMS_STATUS.FULL_COVER,
          caseStatus: CASE_STATUS.COMPENSATED
        },
        isAkoReviewed: false,
        auditor: {
          userId: numericUserId,
          role: USER_ROLE_ENUM.SPECIALIST
        },
        dossierRisk: Math.floor(Math.random() * 10) + 1
      };
      
      return HttpResponse.json({
        success: true,
        data: fallbackAudit
      }, { status: 200 });
      
    } catch (error) {
      console.error("[MSW] Error in /api/audits/random/:userId handler:", error);
      
      // Return error response
      return HttpResponse.json({
        success: false,
        error: "Failed to get random audit"
      }, { status: 500 });
    }
  }),
  
  // Handler for selecting quarterly dossiers
  http.post('/api/verification/select-quarterly', async ({ request }) => {
    try {
      const body = await request.json() as { quarterKey: string; userIds: string[] };
      const { quarterKey } = body;
      
      // Parse the quarter key (e.g., "Q1-2023")
      const [quarterStr, yearStr] = quarterKey.split('-');
      const quarterNum = parseInt(quarterStr.replace('Q', ''));
      const year = parseInt(yearStr);
      
      // Calculate previous quarter (use the function)
      const { quarter: prevQuarterNum, year: prevYear } = getPreviousQuarterInfo(quarterNum, year);
      
      // Use these values
      console.log(`[MSW] Previous quarter: Q${prevQuarterNum}-${prevYear}`);
      
      // Generate mock user audits (would be one per eligible user)
      const userQuarterlyAudits = users
        .filter(user => user.isActive)
        .map(user => {
          const caseNumber = generateRealisticCaseNumber();
          const id = caseNumber; // Remove QUARTERLY prefix
          return {
            id,
            auditId: id,
            dossierId: id,
            userId: user.id,
            coverageAmount: Math.floor(
              Math.random() * (user.role === USER_ROLE_ENUM.STAFF ? 30000 : 150000)
            ),
            claimsStatus: CLAIMS_STATUS.FULL_COVER as ClaimsStatus,
            isAkoReviewed: false,
            quarter: quarterKey, // Add current quarter
            year: year, // Add current year
            caseType: 'USER_QUARTERLY' // Add case type
          };
        });
      
      // Generate mock previous quarter audits for quality control
      const previousQuarterRandomAudits = Array.from({ length: 2 }).map((_, index) => {
        const caseNumber = generateRealisticCaseNumber();
        const id = caseNumber; // Remove PREV-QUARTER prefix
        // Assign to a random active user
        const activeUsers = users.filter(user => user.isActive && user.role !== USER_ROLE_ENUM.READER);
        const randomUser = activeUsers[index % activeUsers.length];
        
        return {
          id,
          dossierId: id,
          auditId: id,
          userId: randomUser.id, // Assign to actual user
          coverageAmount: Math.floor(Math.random() * 100000),
          claimsStatus: CLAIMS_STATUS.FULL_COVER as ClaimsStatus,
          isAkoReviewed: false,
          quarter: `Q${prevQuarterNum}-${prevYear}`, // Add previous quarter
          year: prevYear, // Add previous quarter year
          caseType: 'PREVIOUS_QUARTER_RANDOM' // Add case type
        };
      });
      
      return HttpResponse.json({
        success: true,
        data: {
          quarterKey,
          userQuarterlyAudits,
          previousQuarterRandomAudits,
          lastSelectionDate: new Date().toISOString()
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

  // Get current logged-in user
  http.get('/api/auth/current-user', () => {
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
  
  // Get audit verification data
  http.get('/api/audit-verification/:auditId', async ({ params }) => {
    try {
      const { auditId } = params;
      const numericAuditId = safeParseInt(Array.isArray(auditId) ? auditId[0] : auditId);
      
      // For now, return a basic verification response
      // In a real implementation, this would fetch from the database
      const verificationData = {
        auditId: numericAuditId,
        status: 'not_verified' as const,
        verifierId: 1,
        rating: '',
        comment: '',
        findings: []
      };
      
      return HttpResponse.json({
        success: true,
        data: verificationData
      }, { status: 200 });
    } catch (error) {
      console.error("[MSW] Error in /api/audit-verification/:auditId GET handler:", error);
      return HttpResponse.json({
        success: false,
        error: 'Failed to fetch verification data'
      }, { status: 500 });
    }
  }),
  
  // Update audit verification data
  http.put('/api/audit-verification/:auditId', async ({ params, request }) => {
    try {
      const { auditId } = params;
      const numericAuditId = safeParseInt(Array.isArray(auditId) ? auditId[0] : auditId);
      
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
        const jsonData = await request.json();
        if (jsonData && typeof jsonData === 'object') {
          requestData = jsonData as typeof requestData;
        }
      } catch {
        console.warn("[MSW] Failed to parse request body for verification update");
      }
      
      console.log(`[MSW] Updating verification data for audit ${numericAuditId}:`, requestData);
      
      // In a real implementation, this would save to the database
      // For now, just return a success response with the data
      const verificationResponse = {
        auditId: numericAuditId,
        status: requestData.status || 'not_verified',
        verifierId: requestData.verifierId || 1,
        rating: requestData.rating || '',
        comment: requestData.comment || '',
        verificationDate: requestData.status === 'verified' ? new Date().toISOString() : undefined,
        findings: requestData.findings || []
      };
      
      return HttpResponse.json({
        success: true,
        data: verificationResponse
      }, { status: 200 });
    } catch (error) {
      console.error("[MSW] Error in /api/audit-verification/:auditId PUT handler:", error);
      return HttpResponse.json({
        success: false,
        error: 'Failed to update verification data'
      }, { status: 500 });
    }
  }),
]; 