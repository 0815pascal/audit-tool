// @ts-nocheck
import { rest } from 'msw';
import { invoices, auditorCodes } from '../mockData';

export const handlers = [
  // Get audits by quarter (returns empty list or you can mock data here)
  rest.get('/api/audits/quarter/:quarter', (req, res, ctx) => {
    const { quarter } = req.params;
    // TODO: return filtered mock data based on quarter
    return res(ctx.status(200), ctx.json([]));
  }),

  // Get audits by auditor
  rest.get('/api/audits/auditor/:auditorId', (req, res, ctx) => {
    const { auditorId } = req.params;
    // TODO: return mock audits for given auditor
    return res(ctx.status(200), ctx.json([]));
  }),

  // Select cases for audit
  rest.get('/api/audits/select-cases/:quarter', (req, res, ctx) => {
    const { quarter } = req.params;
    // Return mock cases (reuse invoices)
    return res(ctx.status(200), ctx.json(invoices));
  }),

  // Export audit results (CSV)
  rest.get('/api/audit-reports/export/:quarter', (req, res, ctx) => {
    const csv = 'Case-ID,Claims Manager,Prüfergebnis,Prüfer\n';
    return res(
      ctx.status(200),
      ctx.set('Content-Type', 'text/csv'),
      ctx.body(csv)
    );
  }),

  // Get audit statistics
  rest.get('/api/audit-reports/statistics/:quarter', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ totalAudits: 0, averageScore: 0 }));
  }),

  // Fallback for unhandled requests
  rest.get('*', (req, res, ctx) => {
    return req.passthrough();
  })
]; 