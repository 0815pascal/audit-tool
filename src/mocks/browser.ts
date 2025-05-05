// @ts-nocheck
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

console.log(`[MSW] Registering ${handlers.length} request handlers`);
handlers.forEach((handler, index) => {
  // Extract method and path for logging
  const method = handler.info.method;
  const path = handler.info.path;
  console.log(`[MSW] ${index + 1}. ${method} ${path}`);
});

// Initialize MSW worker with our request handlers
export const worker = setupWorker(...handlers); 