// @ts-nocheck
import { http, HttpResponse } from 'msw';
import { User } from '../types';

// Mock data directly in the handlers file
export const users: User[] = [
  { id: '1', name: 'John Smith', department: '5', role: 'SPECIALIST', isActive: true, initials: 'JS' },
  { id: '2', name: 'Jane Doe', department: '5', role: 'REGULAR', isActive: true, initials: 'JD' },
  { id: '3', name: 'Robert Johnson', department: '5', role: 'REGULAR', isActive: true, initials: 'RJ' },
  { id: '4', name: 'Emily Davis', department: '5', role: 'TEAM_LEADER', isActive: true, initials: 'ED' },
  { id: '5', name: 'Michael Brown', department: '5', role: 'REGULAR', isActive: true, initials: 'MB' },
  { id: '6', name: 'Sarah Wilson', department: '5', role: 'SPECIALIST', isActive: true, initials: 'SW' },
  { id: '7', name: 'David Thompson', department: '5', role: 'REGULAR', isActive: true, initials: 'DT' },
  { id: '8', name: 'Lisa Garcia', department: '5', role: 'REGULAR', isActive: true, initials: 'LG' },
];

const mockCases = [
  {
    id: '1',
    userId: '1',
    date: '2025-04-10',
    clientName: 'Thomas Anderson',
    policyNumber: '12345',
    caseNumber: 10045,
    dossierRisk: 123456,
    dossierName: 'Matrix Incorporated',
    totalAmount: 525,
    isVerified: false,
    claimsStatus: 'FULL_COVER',
    coverageAmount: 525,
    verifier: '',
    comment: '',
    rating: '',
    specialFindings: {},
    detailedFindings: {},
    quarter: '1',
    year: 2025,
    isAkoReviewed: false,
    isSpecialist: true,
    caseType: 'USER_QUARTERLY'
  },
  {
    id: '2',
    userId: '2',
    date: '2025-04-16',
    clientName: 'Alice Johnson',
    policyNumber: '67890',
    caseNumber: 10046,
    dossierRisk: 234567,
    dossierName: 'Wonderland Holdings',
    totalAmount: 360,
    isVerified: false,
    claimsStatus: 'FULL_COVER',
    coverageAmount: 360,
    verifier: '',
    comment: '',
    rating: '',
    specialFindings: {},
    detailedFindings: {},
    quarter: '1',
    year: 2025,
    isAkoReviewed: false,
    isSpecialist: false,
    caseType: 'USER_QUARTERLY'
  },
  {
    id: '3',
    userId: '3',
    date: '2025-04-25',
    clientName: 'Mark Wilson',
    policyNumber: '34567',
    caseNumber: 10047,
    dossierRisk: 345678,
    dossierName: 'Wilson Family Trust',
    totalAmount: 440,
    isVerified: false,
    claimsStatus: 'PARTIAL_COVER',
    coverageAmount: 440,
    verifier: '',
    comment: '',
    rating: '',
    specialFindings: {},
    detailedFindings: {},
    quarter: '1',
    year: 2025,
    isAkoReviewed: false,
    isSpecialist: false,
    caseType: 'USER_QUARTERLY'
  },
  {
    id: '4',
    userId: '4',
    date: '2025-05-08',
    clientName: 'Sarah Miller',
    policyNumber: '89012',
    caseNumber: 10048,
    dossierRisk: 456789,
    dossierName: 'Miller Automotive Group',
    totalAmount: 875,
    isVerified: false,
    claimsStatus: 'FULL_COVER',
    coverageAmount: 875,
    verifier: '',
    comment: '',
    rating: '',
    specialFindings: {},
    detailedFindings: {},
    quarter: '2',
    year: 2025,
    isAkoReviewed: false,
    isSpecialist: true,
    caseType: 'USER_QUARTERLY'
  },
  {
    id: '5',
    userId: '5',
    date: '2025-05-19',
    clientName: 'David Brown',
    policyNumber: '45678',
    caseNumber: 10049,
    dossierRisk: 567890,
    dossierName: 'Brown Medical Associates',
    totalAmount: 970,
    isVerified: false,
    claimsStatus: 'FULL_COVER',
    coverageAmount: 970,
    verifier: '',
    comment: '',
    rating: '',
    specialFindings: {},
    detailedFindings: {},
    quarter: '2',
    year: 2025,
    isAkoReviewed: false,
    isSpecialist: false,
    caseType: 'USER_QUARTERLY'
  }
];

// Claims status options from API docs
const CLAIMS_STATUS = {
  FULL_COVER: "Full cover",
  PARTIAL_COVER: "Partial cover",
  NO_COVER: "No cover"
};

// Finding types from API docs
const FINDING_TYPES = {
  INCORRECT_FACT_ASSESSMENT: "Incorrect fact assessment",
  PROCEDURAL_ERROR: "Procedural error",
  DOCUMENTATION_ISSUE: "Documentation issue"
};

// Role types
const ROLES = {
  TEAM_LEADER: "TEAM_LEADER",
  SPECIALIST: "SPECIALIST",
  MANAGER: "MANAGER"
};

// Auditor codes for mock
const auditorCodes = ['PF', 'TF'];

// Safely parse string to integer with fallback
const safeParseInt = (value, fallback = 0) => {
  const parsed = parseInt(value);
  return isNaN(parsed) ? fallback : parsed;
};

// Safely extract numeric part from string ID
const getNumericId = (id) => {
  if (!id) return Math.floor(Math.random() * 1000) + 1;
  const matches = id.toString().match(/\d+/);
  return matches ? parseInt(matches[0]) : Math.floor(Math.random() * 1000) + 1;
};

// Parse quarter string (Q1-2023) to get quarter number and year
const parseQuarter = (quarterStr) => {
  if (!quarterStr) return null;
  
  try {
    // Handle both formats: "Q1-2023" and "Q1 2023"
    const match = quarterStr.match(/Q(\d+)[\s-](\d{4})/);
    if (!match) {
      // Try alternate format without Q prefix: "1-2023"
      const altMatch = quarterStr.match(/(\d+)[\s-](\d{4})/);
      if (!altMatch) return null;
      
      return {
        quarterNum: parseInt(altMatch[1]),
        year: parseInt(altMatch[2])
      };
    }
    
    return {
      quarterNum: parseInt(match[1]),
      year: parseInt(match[2])
    };
  } catch (error) {
    console.warn("Error parsing quarter string:", quarterStr, error);
    // Provide fallback values for current quarter
    const now = new Date();
    return {
      quarterNum: Math.floor(now.getMonth() / 3) + 1,
      year: now.getFullYear()
    };
  }
};

// Utility to convert our case data to the API case format
const caseToCaseObj = (caseData) => {
  if (!caseData) return null;
  
  return {
    caseNumber: caseData.caseNumber || 0,
    claimOwner: {
      userId: safeParseInt(caseData.userId, 1),
      role: ROLES.TEAM_LEADER
    },
    claimsStatus: caseData.claimsStatus || CLAIMS_STATUS.FULL_COVER,
    coverageAmount: caseData.coverageAmount || caseData.totalAmount || 0,
    caseStatus: "COMPENSATED"
  };
};

// Convert our case to API audit format
const caseToAudit = (caseData, quarter, auditorIndex = 0) => {
  if (!caseData) return null;
  
  // Cycle through auditor codes
  const auditorId = (getNumericId(caseData.id) % 2) + 1;
  
  return {
    auditId: getNumericId(caseData.id),
    quarter: quarter || "Q1-2023",
    caseObj: caseToCaseObj(caseData),
    auditor: {
      userId: auditorId,
      role: ROLES.SPECIALIST
    },
    isAkoReviewed: false
  };
};

// Generate findings for an audit
const generateFindings = (auditId) => {
  const numericId = safeParseInt(auditId, 1);
  const count = Math.floor(Math.random() * 3); // 0-2 findings per audit
  const findings = [];
  
  for (let i = 0; i < count; i++) {
    const findingTypes = Object.keys(FINDING_TYPES);
    const randomType = findingTypes[Math.floor(Math.random() * findingTypes.length)];
    
    findings.push({
      findingId: numericId * 10 + i + 1,
      type: randomType,
      description: `Sample finding ${i + 1} for audit ${numericId}: ${FINDING_TYPES[randomType]}`
    });
  }
  
  return findings;
};

// In-memory storage for created audits
const auditStore = new Map();

export const handlers = [
  // Get audits by quarter
  http.get('/api/audits/quarter/:quarter', ({ params }) => {
    try {
      const { quarter } = params;
      console.log(`[MSW] Handling request for quarter: ${quarter}`);
      
      const parsedQuarter = parseQuarter(quarter);
      
      if (!parsedQuarter) {
        console.warn(`[MSW] Could not parse quarter string: ${quarter}`);
        return HttpResponse.json([], { status: 200 });
      }
      
      console.log(`[MSW] Parsed quarter: ${parsedQuarter.quarterNum}, year: ${parsedQuarter.year}`);
      
      // Filter cases for the requested quarter
      const filteredCases = mockCases.filter(caseItem => {
        try {
          const caseDate = new Date(caseItem.date);
          const caseQuarter = Math.floor(caseDate.getMonth() / 3) + 1;
          const caseYear = caseDate.getFullYear();
          
          return caseQuarter === parsedQuarter.quarterNum && 
                caseYear === parsedQuarter.year;
        } catch (e) {
          console.warn(`[MSW] Error filtering case ${caseItem.id}:`, e);
          return false;
        }
      });
      
      console.log(`[MSW] Filtered ${filteredCases.length} cases`);
      
      // Convert to API format
      const audits = filteredCases
        .map(caseItem => {
          try {
            return caseToAudit(caseItem, quarter);
          } catch (e) {
            console.warn(`[MSW] Error converting case ${caseItem.id} to audit:`, e);
            return null;
          }
        })
        .filter(audit => audit !== null);
      
      // Add any audits from our store that match this quarter
      let storeAudits = 0;
      for (const [id, audit] of auditStore.entries()) {
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
      const numericAuditorId = safeParseInt(auditorId);
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
      for (const [id, audit] of auditStore.entries()) {
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
      let requestData = {};
      
      try {
        requestData = await request.json();
      } catch (e) {
        console.warn("[MSW] Failed to parse request body for /api/audits POST");
      }
      
      // Generate a new audit ID
      const auditId = Math.floor(Math.random() * 10000) + 1;
      
      // Create a new audit object
      const newAudit = {
        auditId,
        quarter: requestData.quarter || `Q${Math.floor((new Date().getMonth()) / 3) + 1}-${new Date().getFullYear()}`,
        caseObj: requestData.caseObj || {
          caseNumber: Math.floor(Math.random() * 100000) + 1,
          claimOwner: {
            userId: requestData.caseObj?.caseNumber ? safeParseInt(requestData.caseObj.caseNumber) : 1,
            role: ROLES.TEAM_LEADER
          },
          claimsStatus: CLAIMS_STATUS.FULL_COVER,
          coverageAmount: 10000.00,
          caseStatus: "COMPENSATED"
        },
        auditor: requestData.auditor || {
          userId: 2,
          role: ROLES.SPECIALIST
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
          caseNumber: Math.floor(Math.random() * 100000) + 1,
          claimOwner: {
            userId: 1,
            role: ROLES.TEAM_LEADER
          },
          claimsStatus: CLAIMS_STATUS.FULL_COVER,
          coverageAmount: 10000.00,
          caseStatus: "COMPENSATED"
        },
        auditor: {
          userId: 2,
          role: ROLES.SPECIALIST
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
      const numericAuditorId = safeParseInt(auditId);
      
      let requestData = {};
      try {
        requestData = await request.json();
      } catch (e) {
        console.warn("[MSW] Failed to parse request body for /api/audits PUT");
      }
      
      // Get existing audit or create a placeholder
      let existingAudit = auditStore.get(numericAuditorId);
      
      if (!existingAudit) {
        // If not in our store, create a new one with this ID
        existingAudit = {
          auditId: numericAuditorId,
          quarter: `Q${Math.floor((new Date().getMonth()) / 3) + 1}-${new Date().getFullYear()}`,
          caseObj: {
            caseNumber: Math.floor(Math.random() * 100000) + 1,
            claimOwner: {
              userId: 1,
              role: ROLES.TEAM_LEADER
            },
            claimsStatus: CLAIMS_STATUS.FULL_COVER,
            coverageAmount: 10000.00,
            caseStatus: "COMPENSATED"
          },
          auditor: {
            userId: 2,
            role: ROLES.SPECIALIST
          },
          isAkoReviewed: false
        };
      }
      
      // Update audit with new data
      const updatedAudit = {
        ...existingAudit,
        ...(requestData.quarter && { quarter: requestData.quarter }),
        ...(requestData.caseObj && { caseObj: {
          ...existingAudit.caseObj,
          ...requestData.caseObj
        }}),
        ...(requestData.auditor && { auditor: {
          ...existingAudit.auditor,
          ...requestData.auditor
        }})
      };
      
      // Store the updated audit
      auditStore.set(numericAuditorId, updatedAudit);
      
      console.log(`[MSW] Updated audit with ID ${numericAuditorId}`);
      
      return HttpResponse.json(updatedAudit, { status: 200 });
    } catch (error) {
      console.error("[MSW] Error in /api/audits/:auditId PUT handler:", error);
      
      // Return a fallback updated audit
      const fallbackAudit = {
        auditId: safeParseInt(params.auditId, 1),
        quarter: `Q${Math.floor((new Date().getMonth()) / 3) + 1}-${new Date().getFullYear()}`,
        caseObj: {
          caseNumber: Math.floor(Math.random() * 100000) + 1,
          claimOwner: {
            userId: 1,
            role: ROLES.TEAM_LEADER
          },
          claimsStatus: CLAIMS_STATUS.FULL_COVER,
          coverageAmount: 10000.00,
          caseStatus: "COMPENSATED"
        },
        auditor: {
          userId: 2,
          role: ROLES.SPECIALIST
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
      const findings = generateFindings(auditId);
      
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
      
      // Default finding if request parsing fails
      let requestData = {
        type: "DOCUMENTATION_ISSUE",
        description: "No description provided"
      };
      
      try {
        requestData = await request.json();
      } catch (e) {
        console.warn("[MSW] Failed to parse request body, using default data");
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
      
      // Always return some cases for audit selection regardless of quarter
      const cases = mockCases
        .slice(0, 5)
        .map(caseItem => caseToCaseObj(caseItem))
        .filter(caseObj => caseObj !== null);
      
      return HttpResponse.json(cases, { status: 200 });
    } catch (error) {
      console.error("[MSW] Error in /api/audits/select-cases/:quarter handler:", error);
      return HttpResponse.json([], { status: 200 });
    }
  }),

  // Get audit statistics
  http.get('/api/audit-reports/statistics/:quarter', ({ params }) => {
    try {
      const { quarter } = params;
      console.log(`[MSW] Getting statistics for quarter ${quarter}`);
      
      // Generate some mock statistics
      const stats = {
        totalAudits: Math.floor(Math.random() * 20) + 10, // 10-30 audits
        averageScore: Math.floor(Math.random() * 30) + 70 // 70-100 score
      };
      
      return HttpResponse.json(stats, { status: 200 });
    } catch (error) {
      console.error("[MSW] Error in /api/audit-reports/statistics/:quarter handler:", error);
      return HttpResponse.json({ totalAudits: 0, averageScore: 0 }, { status: 200 });
    }
  }),

  // Export audit results (CSV)
  http.get('/api/audit-reports/export/:quarter', ({ params }) => {
    try {
      const { quarter } = params;
      console.log(`[MSW] Exporting report for quarter ${quarter}`);
      
      // Create a mock CSV with header and some sample data
      let csv = 'Case-ID,Claims Manager,Finding Type,Finding Description,Auditor\n';
      
      // Add some sample data
      mockCases.slice(0, 5).forEach((caseItem, index) => {
        try {
          const findingType = Object.keys(FINDING_TYPES)[index % Object.keys(FINDING_TYPES).length];
          const userName = users.find(e => e.id === caseItem.userId)?.name || 'Unknown';
          const auditorCode = auditorCodes[index % auditorCodes.length];
          
          csv += `${caseItem.caseNumber},${userName},${findingType},"Sample finding description",${auditorCode}\n`;
        } catch (e) {
          csv += `${index+1000},Unknown,DOCUMENTATION_ISSUE,"Sample finding description",XX\n`;
        }
      });
      
      return new HttpResponse(csv, {
        status: 200,
        headers: { 
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-report-${quarter || 'export'}.csv"`
        }
      });
    } catch (error) {
      console.error("[MSW] Error in /api/audit-reports/export/:quarter handler:", error);
      return new HttpResponse('Case-ID,Claims Manager,Finding Type,Finding Description,Auditor\n', {
        status: 200,
        headers: { 'Content-Type': 'text/csv' }
      });
    }
  }),

  // Handle OPTIONS requests for CORS
  http.options('*', () => {
    return new HttpResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  })
]; 