import {http, HttpResponse} from 'msw';
import {
  CaseStatus,
  ClaimsStatus,
  QuarterNumber,
  QuarterPeriod
} from '../types/types';
import {
  createUserId,
  createCaseId,
  isQuarterPeriod,
} from '../types/typeHelpers';
import {CASE_STATUS_MAPPING, CLAIMS_STATUS, QUARTER_CALCULATIONS, API_BASE_PATH} from '../constants';
import {DEFAULT_VALUE_ENUM, USER_ROLE_ENUM} from '../enums';
import {generateRealisticCaseNumber} from '../utils/statusUtils';
import {ApiAuditRequestPayload, ApiAuditResponse, ApiCaseResponse} from './mockTypes';
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
import {mockCases, users} from './mockData';

export const handlers = [
  // Get audits by quarter
  http.get(`${API_BASE_PATH}/audits/quarter/:quarter`, ({ params }) => {
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
            const caseObj = caseToCaseObj(caseItem);
            return caseToAudit(caseObj, quarterValue);
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
      console.error("[MSW] Error in /rest/kuk/v1/audits/quarter/:quarter handler:", error);
      return HttpResponse.json([], { status: 200 });
    }
  }),

  // Get audits by auditor
  http.get(`${API_BASE_PATH}/audits/auditor/:auditorId`, ({ params }) => {
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
      const currentQuarter: QuarterPeriod = `Q${Math.floor((new Date().getMonth()) / 3) + 1}-${new Date().getFullYear()}` as QuarterPeriod;
      const audits = filteredCases
        .map(caseItem => {
          try {
            const caseObj = caseToCaseObj(caseItem);
            return caseToAudit(caseObj, currentQuarter);
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
      console.error("[MSW] Error in /rest/kuk/v1/audits/auditor/:auditorId handler:", error);
      return HttpResponse.json([], { status: 200 });
    }
  }),

  // Create Audit
  http.post(`${API_BASE_PATH}/audits`, async ({ request }) => {
    try {
      let requestData: ApiAuditRequestPayload = {};
      
      try {
        requestData = await request.json() as typeof requestData;
      } catch (error) {
        // Ignore parse error but log warning
        console.warn("[MSW] Failed to parse request body for /rest/kuk/v1/audits POST", error);
      }
      
      // Generate a new audit ID
      const auditId = Math.floor(Math.random() * 10000) + 1;
      
      // Create valid quarter format if needed
      let quarter = requestData.quarter;
      if (!quarter || !isQuarterPeriod(quarter)) {
        const now = new Date();
        const currentQuarter = Math.floor((now.getMonth()) / 3) + 1 as QuarterNumber;
        quarter = `Q${currentQuarter}-${now.getFullYear()}`;
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
          coverageAmount: requestData.caseObj?.coverageAmount ?? 10000.00,
          caseStatus: (requestData.caseObj?.caseStatus as CaseStatus) || CASE_STATUS_MAPPING.COMPENSATED,
          notificationDate: new Date().toISOString().split('T')[0],
          notifiedCurrency: 'CHF'
        },
        auditor: {
          userId: requestData.auditor?.userId !== undefined 
            ? safeParseInt(requestData.auditor.userId)
            : 2,
          role: requestData.auditor?.role ?? USER_ROLE_ENUM.SPECIALIST
        },
        isAkoReviewed: false
      };
      
      // Store the audit
      auditStore.set(auditId, newAudit);
      
      console.log(`[MSW] Created new audit with ID ${auditId}`);
      
      return HttpResponse.json(newAudit, { status: 201 });
    } catch (error) {
      console.error("[MSW] Error in /rest/kuk/v1/audits POST handler:", error);
      
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
          caseStatus: CASE_STATUS_MAPPING.COMPENSATED,
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
  http.put(`${API_BASE_PATH}/audits/:auditId`, async ({ params, request }) => {
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
        const now = new Date();
        const currentQuarter = Math.floor((now.getMonth()) / 3) + 1 as QuarterNumber;
        requestData.quarter = `Q${currentQuarter}-${now.getFullYear()}`;
      }
      
      // Get existing audit or create a placeholder
      let existingAudit = auditStore.get(numericAuditorId);
      
      if (!existingAudit) {
        // If not in our store, create a new one with this ID
        const now = new Date();
        const currentQuarter = Math.floor((now.getMonth()) / QUARTER_CALCULATIONS.MONTHS_PER_QUARTER) + QUARTER_CALCULATIONS.QUARTER_OFFSET as QuarterNumber;
        const quarterStr = `Q${currentQuarter}-${now.getFullYear()}`;
        
        existingAudit = {
          auditId: numericAuditorId,
          quarter: requestData.quarter as QuarterPeriod || quarterStr,
          caseObj: {
            caseNumber: createCaseId(Math.floor(DEFAULT_VALUE_ENUM.DEFAULT_CASE_NUMBER + Math.random() * DEFAULT_VALUE_ENUM.CASE_NUMBER_RANGE)),
            claimOwner: {
              userId: 1,
              role: USER_ROLE_ENUM.TEAM_LEADER
            },
            claimsStatus: CLAIMS_STATUS.FULL_COVER,
            coverageAmount: 10000.00,
            caseStatus: CASE_STATUS_MAPPING.COMPENSATED,
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
                notifiedCurrency: requestData.caseObj.notifiedCurrency
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
      
      console.log(`[MSW] Updated audit with ID ${numericAuditorId}`);
      
      return HttpResponse.json(updatedAudit, { status: 200 });
    } catch (error) {
      console.error("[MSW] Error in /rest/kuk/v1/audits/:auditId PUT handler:", error);
      
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
          claimsStatus: CLAIMS_STATUS.FULL_COVER,
          coverageAmount: 10000.00,
          caseStatus: CASE_STATUS_MAPPING.COMPENSATED,
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
  http.get(`${API_BASE_PATH}/audits/:auditId/findings`, ({ params }) => {
    try {
      const { auditId } = params;
      console.log(`[MSW] Getting findings for audit ${auditId}`);
      
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
      const { auditId } = params;
      
      let requestData: { type: string; description: string; } = {
        type: "DOCUMENTATION_ISSUE",
        description: "No description provided"
      };
      
      try {
        const jsonData = await request.json();
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
        findingId: Math.floor(Math.random() * 1000) + 1,
        type: requestData.type || "DOCUMENTATION_ISSUE",
        description: requestData.description || "No description provided"
      };
      
      console.log(`[MSW] Added finding to audit ${auditId}:`, newFinding);
      
      return HttpResponse.json(newFinding, { status: 201 });
    } catch (error) {
      console.error("[MSW] Error in /rest/kuk/v1/audits/:auditId/findings POST handler:", error);
      return HttpResponse.json({
        findingId: Math.floor(Math.random() * 1000) + 1,
        type: "DOCUMENTATION_ISSUE",
        description: "Error creating finding"
      }, { status: 201 });
    }
  }),

  // Select cases for audit
  http.get(`${API_BASE_PATH}/audits/select-cases/:quarter`, ({ params }) => {
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
          if (!caseItem.notificationDate) return false;
          const { quarterNum: caseQuarter, year: caseYear } = getQuarterFromDate(caseItem.notificationDate);
          return caseQuarter === prevQuarterNum && caseYear === prevYear;
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
            role: users[i % users.length].authorities
          },
          claimsStatus: i % 2 === 0 ? CLAIMS_STATUS.FULL_COVER : CLAIMS_STATUS.PARTIAL_COVER,
          coverageAmount: Math.floor(Math.random() * 100000) + 1000,
          caseStatus: CASE_STATUS_MAPPING.COMPENSATED,
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
            role: users[i % users.length].authorities
          },
          claimsStatus: i % 2 === 0 ? CLAIMS_STATUS.FULL_COVER : CLAIMS_STATUS.PARTIAL_COVER,
          coverageAmount: Math.floor(Math.random() * 100000) + 1000,
          caseStatus: CASE_STATUS_MAPPING.COMPENSATED,
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
      
      // Log the notification dates of all returned cases for auditing
      allCases.forEach((caseObj, index) => {
        const { quarterNum, year } = getQuarterFromDate(caseObj.notificationDate);
        console.log(`[MSW] Case ${index + 1}: notificationDate ${caseObj.notificationDate} → Q${quarterNum}-${year}, currency: ${caseObj.notifiedCurrency}`);
      });
      
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
      
      // Parse the quarter key (e.g., "Q1-2023")
      const [quarterStr, yearStr] = quarterPeriod.split('-');
      const quarterNum = parseInt(quarterStr.replace('Q', ''));
      const year = parseInt(yearStr);
      
      // Generate mock cases for audit selection
      const cases = users
        .filter(user => user.enabled)
        .slice(0, 10) // Limit to 10 cases
        .map((user, index) => {
          const caseNumber = parseInt(generateRealisticCaseNumber());
          return {
            caseNumber,
            claimOwner: {
              userId: user.id,
              displayName: user.displayName
            },
            coverageAmount: Math.floor(
              Math.random() * (user.authorities === USER_ROLE_ENUM.STAFF ? 30000 : 150000)
            ),
            claimsStatus: CLAIMS_STATUS.FULL_COVER,
            notificationDate: (() => {
              // Generate a realistic date within the quarter
              const startMonth = (quarterNum - 1) * 3; // 0-indexed month
              const randomDay = Math.floor(Math.random() * 28) + 1; // 1-28 to avoid month-end issues
              const randomMonth = startMonth + Math.floor(Math.random() * 3); // Random month within quarter
              
              const notificationDate = new Date(year, randomMonth, randomDay);
              return notificationDate.toISOString().split('T')[0]; // Return YYYY-MM-DD format
            })(),
            notifiedCurrency: index % 3 === 0 ? 'EUR' : index % 3 === 1 ? 'USD' : 'CHF' // Mix of currencies
          };
        });
      
      console.log(`[MSW] Generated ${cases.length} cases for quarter ${quarterPeriod}`);
      
      return HttpResponse.json(cases);
    } catch (error) {
      console.error('Error in quarterly case selection handler:', error);
      return HttpResponse.json([], { status: 500 });
    }
  }),

  // POST handler for selecting quarterly dossiers (legacy)
  http.post(`${API_BASE_PATH}/audit-completion/select-quarterly`, async ({ request }) => {
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
        .filter(user => user.enabled)
        .map(user => {
          const id = generateRealisticCaseNumber(); // Remove QUARTERLY prefix
          return {
            id,
            auditId: id,
            dossierId: id,
            userId: user.id,
            coverageAmount: Math.floor(
              Math.random() * (user.authorities === USER_ROLE_ENUM.STAFF ? 30000 : 150000)
            ),
            claimsStatus: CLAIMS_STATUS.FULL_COVER,
            isAkoReviewed: false,
            quarter: quarterKey, // Add current quarter
            year: year, // Add current year
            caseType: 'USER_QUARTERLY' // Add case type
          };
        });
      
      // Generate mock previous quarter audits for quality control
      const previousQuarterRandomAudits = Array.from({ length: 2 }).map((_, index) => {
        const id = generateRealisticCaseNumber(); // Remove PREV-QUARTER prefix
        // Assign to a random active user
        const activeUsers = users.filter(user => user.enabled && user.authorities !== USER_ROLE_ENUM.READER);
        const randomUser = activeUsers[index % activeUsers.length];
        
        return {
          id,
          dossierId: id,
          auditId: id,
          userId: randomUser.id, // Assign to actual user
          coverageAmount: Math.floor(Math.random() * 100000),
          claimsStatus: CLAIMS_STATUS.FULL_COVER,
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

  // Get audit completion data
  http.get(`${API_BASE_PATH}/audit-completion/:auditId`, async ({ params }) => {
    try {
      const { auditId } = params;
      const numericAuditId = safeParseInt(Array.isArray(auditId) ? auditId[0] : auditId);
      
      // For now, return a basic completion response
      
      const completionData = {
        auditId: numericAuditId,
        status: 'not_completed' as const,
        verifierId: 1,
        rating: '',
        comment: '',
        findings: []
      };
      
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
        console.warn("[MSW] Failed to parse request body for completion update");
      }
      
      console.log(`[MSW] Updating completion data for audit ${numericAuditId}:`, requestData);
      
      // In a real implementation, this would save to the database
      // For now, just return a success response with the data
      const completionResponse = {
        auditId: numericAuditId,
        status: requestData.status ?? 'not_completed',
        verifierId: requestData.verifierId ?? 1,
        rating: requestData.rating ?? '',
        comment: requestData.comment ?? '',
        completionDate: requestData.status === 'completed' ? new Date().toISOString() : undefined,
        findings: requestData.findings || []
      };
      
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
];