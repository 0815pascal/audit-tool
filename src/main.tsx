// Import core React modules
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import './index.css';
import { store } from './store';
import { ToastProvider } from './context/ToastContext';

// Initialize MSW in development environment BEFORE React rendering
const setupMocks = async () => {
  // Only run in development environment
  if (import.meta.env.DEV) {
    try {
      const { setupMSW } = await import('./mocks/browser');
      
      // Start the MSW worker
      const success = await setupMSW();
      if (success) {
        console.log('[MSW] Mock Service Worker initialized successfully');
      } else {
        console.warn('[MSW] Mock Service Worker failed to initialize, continuing without mocks');
      }
      return success;
    } catch (error) {
      console.error('[MSW] Failed to initialize Mock Service Worker:', error);
      console.warn('[MSW] Continuing without mocks - API calls will fail unless backend is available');
      return false;
    }
  }
  return false;
};

// Add global error handling
window.addEventListener('error', (event) => {
  console.error('GLOBAL ERROR:', event.message, event.filename, event.lineno);
  
  // Show error to user
  setTimeout(() => {
    const rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.innerHTML = `
        <div style="color: red; text-align: center; margin: 20px;">
          <p>Error loading application:</p>
          <pre style="background: #f8f8f8; padding: 10px; text-align: left; max-width: 800px; margin: 0 auto; overflow: auto;">${event.message}</pre>
          <button onclick="window.location.reload()" style="margin-top: 10px; padding: 8px 16px;">Reload</button>
        </div>
      `;
    }
  }, 1000);
});

// Start MSW first, then render app
setupMocks().then(() => {
  // The main rendering function
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Provider store={store}>
        <ToastProvider>
          <App />
        </ToastProvider>
      </Provider>
    </React.StrictMode>
  );
});
