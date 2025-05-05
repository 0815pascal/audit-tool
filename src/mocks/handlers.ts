// @ts-nocheck
import { http } from 'msw';
import { invoices, auditorCodes } from '../mockData';

export const handlers = [
  // Get audits by quarter (returns empty list or you can mock data here)
  http.get('/api/audits/quarter/:quarter', ({ params }) => {
    const { quarter } = params;
    // TODO: return filtered mock data based on quarter
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }),

  // Get audits by auditor
  http.get('/api/audits/auditor/:auditorId', ({ params }) => {
    const { auditorId } = params;
    // TODO: return mock audits for given auditor
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }),

  // Select cases for audit
  http.get('/api/audits/select-cases/:quarter', ({ params }) => {
    const { quarter } = params;
    // Return mock cases (reuse invoices)
    return new Response(JSON.stringify(invoices), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }),

  // Export audit results (CSV)
  http.get('/api/audit-reports/export/:quarter', () => {
    const csv = 'Case-ID,Claims Manager,Prüfergebnis,Prüfer\n';
    return new Response(csv, {
      status: 200,
      headers: { 'Content-Type': 'text/csv' }
    });
  }),

  // Get audit statistics
  http.get('/api/audit-reports/statistics/:quarter', () => {
    return new Response(JSON.stringify({ totalAudits: 0, averageScore: 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }),

  // Fallback for unhandled requests
  http.get('*', ({ request }) => {
    return fetch(request);
  })
]; 