// @ts-nocheck
import { setupWorker } from 'msw';
import { handlers } from './handlers';

// Initialize MSW worker with our request handlers
export const worker = setupWorker(...handlers); 