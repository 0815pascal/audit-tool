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

export const handlers = [
  // Get audits by quarter
  http.get('/api/audits/quarter/:quarter', ({ params }) => {
    try {
      const { quarter } = params;
      const parsedQuarter = parseQuarter(quarter);
      
      if (!parsedQuarter) {
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
          return false;
        }
      });
      
      // Convert to API format
      const audits = filteredInvoices
        .map(invoice => invoiceToAudit(invoice, quarter))
        .filter(audit => audit !== null);
      
      return new Response(JSON.stringify(audits), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error("Error in /api/audits/quarter/:quarter handler:", error);
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
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
    console.log('Unhandled request:', request.url);
    return fetch(request);
  })
]; 