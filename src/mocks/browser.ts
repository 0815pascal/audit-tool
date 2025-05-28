import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Create MSW worker with all handlers
export const worker = setupWorker(...handlers);

// Configure worker options but don't start it yet - main.tsx will handle this
//  avoids the redundant worker.start() warning
export const setupMSW = async () => {
  console.log('[MSW] Setting up Mock Service Worker...');
  
  try {
    await worker.start({
      serviceWorker: {
        url: '/mockServiceWorker.js',
      },
      // Only log warnings and errors, not all requests
      onUnhandledRequest: 'bypass',
      // Suppress warnings about missing service worker
      quiet: false
    });
    
    console.log('[MSW] Mock Service Worker started successfully');
    return true;
  } catch (error) {
    console.warn('[MSW] Failed to start Mock Service Worker:', error);
    // Don't throw error - allow app to continue without MSW
    return false;
  }
}; 