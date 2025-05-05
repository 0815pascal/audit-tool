// @ts-nocheck
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Initialize MSW worker with our request handlers
export const worker = setupWorker(...handlers); 