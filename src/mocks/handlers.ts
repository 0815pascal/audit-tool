// @ts-nocheck
import { http } from 'msw';
import { invoices, employees, auditorCodes } from '../mockData';

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
  
  // Handle both formats: "Q1-2023" and "Q1 2023"
  const match = quarterStr.match(/Q(\d+)[\s-](\d{4})/);
  if (!match) return null;
  
  return {
    quarterNum: parseInt(match[1]),
    year: parseInt(match[2])
  };
};

// Utility to convert our invoice data to the API case format
const invoiceToCaseObj = (invoice) => {
  if (!invoice) return null;
  
  return {
    caseNumber: invoice.caseNumber || 0,
    claimOwner: {
      userId: safeParseInt(invoice.employeeId, 1),
      role: ROLES.TEAM_LEADER
    },
    claimsStatus: invoice.claimsStatus || CLAIMS_STATUS.FULL_COVER,
    coverageAmount: invoice.coverageAmount || invoice.totalAmount || 0,
    caseStatus: "COMPENSATED"
  };
};

// Convert our invoice to API audit format
const invoiceToAudit = (invoice, quarter, auditorIndex = 0) => {
  if (!invoice) return null;
  
  // Cycle through auditor codes
  const auditorId = (getNumericId(invoice.id) % 2) + 1;
  
  return {
    auditId: getNumericId(invoice.id),
    quarter: quarter || "Q1-2023",
    caseObj: invoiceToCaseObj(invoice),
    auditor: {
      userId: auditorId,
      role: ROLES.SPECIALIST
    }
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
  // Special catch-all handler for all API requests
  http.all('/api/*', ({ request }) => {
    try {
      const url = new URL(request.url);
      console.log(`[MSW] Catch-all handler intercepted: ${request.method} ${url.pathname}`);
      
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    } catch (error) {
      console.error(`[MSW] Error in catch-all handler:`, error);
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }),

  // Get audits by quarter
  http.get('/api/audits/quarter/:quarter', ({ params }) => {
    try {
      const { quarter } = params;
      console.log(`[MSW] Processing request for quarter: ${quarter}`);
      
      const parsedQuarter = parseQuarter(quarter);
      
      if (!parsedQuarter) {
        console.warn(`[MSW] Invalid quarter format: ${quarter}`);
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Filter invoices for the requested quarter
      const filteredInvoices = invoices.filter(invoice => {
        try {
          const invoiceDate = new Date(invoice.date);
          const invoiceQuarter = Math.floor(invoiceDate.getMonth() / 3) + 1;
          const invoiceYear = invoiceDate.getFullYear();
          
          return invoiceQuarter === parsedQuarter.quarterNum && 
                invoiceYear === parsedQuarter.year;
        } catch (e) {
          console.error(`[MSW] Error filtering invoice:`, e);
          return false;
        }
      });
      
      console.log(`[MSW] Found ${filteredInvoices.length} invoices for quarter ${quarter}`);
      
      // Convert to API format
      const audits = filteredInvoices
        .map(invoice => invoiceToAudit(invoice, quarter))
        .filter(audit => audit !== null);
      
      // Add any audits from our store that match this quarter
      let storeAudits = 0;
      for (const [id, audit] of auditStore.entries()) {
        if (audit.quarter === quarter) {
          audits.push(audit);
          storeAudits++;
        }
      }
      
      if (storeAudits > 0) {
        console.log(`[MSW] Added ${storeAudits} audits from store for quarter ${quarter}`);
      }
      
      console.log(`[MSW] Returning ${audits.length} total audits for quarter ${quarter}`);
      
      // Ensure we're returning valid JSON with the correct headers
      return new Response(JSON.stringify(audits), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          // Add CORS headers to ensure proper handling
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    } catch (error) {
      console.error("[MSW] Error in /api/audits/quarter/:quarter handler:", error);
      
      // Always return a valid JSON array, even on error
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }
  }),

  // Get audits by auditor
  http.get('/api/audits/auditor/:auditorId', ({ params }) => {
    try {
      const { auditorId } = params;
      const numericAuditorId = safeParseInt(auditorId);
      
      // Filter invoices to create mock audits for the given auditor
      // In this mock, we'll use modulo operation to assign audits to auditors
      const filteredInvoices = invoices.filter(invoice => 
        (getNumericId(invoice.id) % 2) + 1 === numericAuditorId
      );
      
      // Convert to API format - use a recent quarter for these
      const currentQuarter = `Q${Math.floor((new Date().getMonth()) / 3) + 1}-${new Date().getFullYear()}`;
      const audits = filteredInvoices
        .map(invoice => invoiceToAudit(invoice, currentQuarter))
        .filter(audit => audit !== null);
      
      // Add any audits from our store that match this auditor
      for (const [id, audit] of auditStore.entries()) {
        if (audit.auditor && audit.auditor.userId === numericAuditorId) {
          audits.push(audit);
        }
      }
      
      return new Response(JSON.stringify(audits), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error("Error in /api/audits/auditor/:auditorId handler:", error);
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }),

  // Create Audit
  http.post('/api/audits', async ({ request }) => {
    try {
      let requestData = {};
      
      try {
        requestData = await request.json();
      } catch (e) {
        console.warn("Failed to parse request body for /api/audits POST");
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
        }
      };
      
      // Store the audit
      auditStore.set(auditId, newAudit);
      
      console.log(`Created new audit with ID ${auditId}:`, newAudit);
      
      return new Response(JSON.stringify(newAudit), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error("Error in /api/audits POST handler:", error);
      
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
        }
      };
      
      return new Response(JSON.stringify(fallbackAudit), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }),

  // Update Audit
  http.put('/api/audits/:auditId', async ({ params, request }) => {
    try {
      const { auditId } = params;
      const numericAuditId = safeParseInt(auditId);
      
      let requestData = {};
      try {
        requestData = await request.json();
      } catch (e) {
        console.warn("Failed to parse request body for /api/audits PUT");
      }
      
      // Get existing audit or create a placeholder
      let existingAudit = auditStore.get(numericAuditId);
      
      if (!existingAudit) {
        // If not in our store, create a new one with this ID
        existingAudit = {
          auditId: numericAuditId,
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
          }
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
      auditStore.set(numericAuditId, updatedAudit);
      
      console.log(`Updated audit with ID ${numericAuditId}:`, updatedAudit);
      
      return new Response(JSON.stringify(updatedAudit), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error("Error in /api/audits/:auditId PUT handler:", error);
      
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
        }
      };
      
      return new Response(JSON.stringify(fallbackAudit), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }),

  // Select cases for audit
  http.get('/api/audits/select-cases/:quarter', ({ params }) => {
    try {
      const { quarter } = params;
      
      // Always return some cases for audit selection regardless of quarter
      const cases = invoices
        .slice(0, 5)
        .map(invoice => invoiceToCaseObj(invoice))
        .filter(caseObj => caseObj !== null);
      
      return new Response(JSON.stringify(cases), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error("Error in /api/audits/select-cases/:quarter handler:", error);
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }),

  // Get findings by audit
  http.get('/api/audits/:auditId/findings', ({ params }) => {
    try {
      const { auditId } = params;
      
      // Generate mock findings for this audit
      const findings = generateFindings(auditId);
      
      return new Response(JSON.stringify(findings), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error("Error in /api/audits/:auditId/findings GET handler:", error);
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
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
        console.warn("Failed to parse request body, using default data");
      }
      
      // Create a new finding with an ID
      const newFinding = {
        findingId: Math.floor(Math.random() * 1000) + 1,
        type: requestData.type || "DOCUMENTATION_ISSUE",
        description: requestData.description || "No description provided"
      };
      
      return new Response(JSON.stringify(newFinding), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error("Error in /api/audits/:auditId/findings POST handler:", error);
      return new Response(JSON.stringify({
        findingId: Math.floor(Math.random() * 1000) + 1,
        type: "DOCUMENTATION_ISSUE",
        description: "Error creating finding"
      }), {
        status: 201, // Return success status to not block the app
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }),

  // Export audit results (CSV)
  http.get('/api/audit-reports/export/:quarter', ({ params }) => {
    try {
      const { quarter } = params;
      
      // Create a mock CSV with header and some sample data
      let csv = 'Case-ID,Claims Manager,Finding Type,Finding Description,Auditor\n';
      
      // Add some sample data
      invoices.slice(0, 5).forEach((invoice, index) => {
        try {
          const findingType = Object.keys(FINDING_TYPES)[index % Object.keys(FINDING_TYPES).length];
          const employeeName = employees.find(e => e.id === invoice.employeeId)?.name || 'Unknown';
          const auditorCode = auditorCodes[index % auditorCodes.length];
          
          csv += `${invoice.caseNumber},${employeeName},${findingType},"Sample finding description",${auditorCode}\n`;
        } catch (e) {
          csv += `${index+1000},Unknown,DOCUMENTATION_ISSUE,"Sample finding description",XX\n`;
        }
      });
      
      return new Response(csv, {
        status: 200,
        headers: { 
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-report-${quarter || 'export'}.csv"`
        }
      });
    } catch (error) {
      console.error("Error in /api/audit-reports/export/:quarter handler:", error);
      return new Response('Case-ID,Claims Manager,Finding Type,Finding Description,Auditor\n', {
        status: 200,
        headers: { 'Content-Type': 'text/csv' }
      });
    }
  }),

  // Get audit statistics
  http.get('/api/audit-reports/statistics/:quarter', ({ params }) => {
    try {
      // Generate some mock statistics
      const stats = {
        totalAudits: Math.floor(Math.random() * 20) + 10, // 10-30 audits
        averageScore: Math.floor(Math.random() * 30) + 70 // 70-100 score
      };
      
      return new Response(JSON.stringify(stats), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error("Error in /api/audit-reports/statistics/:quarter handler:", error);
      return new Response(JSON.stringify({ totalAudits: 0, averageScore: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }),

  // Fallback for unhandled requests
  http.get('*', ({ request }) => {
    const url = new URL(request.url);
    
    // Only intercept API requests
    if (url.pathname.startsWith('/api')) {
      console.log('Unhandled API GET request:', request.url);
      return new Response(JSON.stringify({ message: "Endpoint not implemented" }), {
        status: 200, // Return 200 to not break the app
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Pass through all other requests to actual server
    return request;
  }),
  
  // Fallback for unhandled POST requests
  http.post('*', ({ request }) => {
    const url = new URL(request.url);
    
    // Only intercept API requests
    if (url.pathname.startsWith('/api')) {
      console.log('Unhandled API POST request:', request.url);
      return new Response(JSON.stringify({ message: "Endpoint not implemented" }), {
        status: 200, // Return 200 to not break the app
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Pass through all other requests
    return request;
  }),
  
  // Fallback for unhandled PUT requests
  http.put('*', ({ request }) => {
    const url = new URL(request.url);
    
    // Only intercept API requests
    if (url.pathname.startsWith('/api')) {
      console.log('Unhandled API PUT request:', request.url);
      return new Response(JSON.stringify({ message: "Endpoint not implemented" }), {
        status: 200, // Return 200 to not break the app
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Pass through all other requests
    return request;
  }),
  
  // Fallback for unhandled DELETE requests
  http.delete('*', ({ request }) => {
    const url = new URL(request.url);
    
    // Only intercept API requests
    if (url.pathname.startsWith('/api')) {
      console.log('Unhandled API DELETE request:', request.url);
      return new Response(JSON.stringify({ message: "Endpoint not implemented" }), {
        status: 200, // Return 200 to not break the app
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Pass through all other requests
    return request;
  })
]; 