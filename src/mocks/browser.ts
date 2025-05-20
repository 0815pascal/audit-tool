import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Create MSW worker with all handlers
export const worker = setupWorker(...handlers);

// Configure worker options but don't start it yet - main.tsx will handle this
// This avoids the redundant worker.start() warning
export const setupMSW = () => {
  console.log('[MSW] Setting up Mock Service Worker...');
  
  return worker.start({
    serviceWorker: {
      url: '/mockServiceWorker.js',
    },
    // Only log warnings and errors, not all requests
    onUnhandledRequest: 'bypass'
  });
}; 