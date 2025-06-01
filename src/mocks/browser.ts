import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Setup MSW browser worker for development
export const worker = setupWorker(...handlers);

// Export setup function for main.tsx
export const setupMSW = async (): Promise<boolean> => {
  try {
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: {
        url: '/mockServiceWorker.js',
      },
    });
    
    return true;
  } catch (error) {
    console.error('[MSW] Setup failed:', error);
    return false;
  }
}; 