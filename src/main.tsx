// Import core React modules
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App.tsx';
import './index.css';
import store from './store';

// Add global error handling
window.addEventListener('error', (event) => {
  console.error('GLOBAL ERROR:', event.message, event.filename, event.lineno);
  
  // Show error to user
  setTimeout(() => {
    const rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.innerHTML = `
        <div class="global-error">
          <p>Error loading application:</p>
          <pre class="global-error__message">${event.message}</pre>
          <button onclick="window.location.reload()" class="global-error__reload-button">Reload</button>
        </div>
      `;
    }
  }, 1000);
});

// Start the app
const startApp = async () => {
  if (import.meta.env.MODE === 'development') {
    try {
      const { worker } = await import('./mocks/browser');
      
      // Simplified MSW initialization
      await worker.start({
        onUnhandledRequest: 'bypass'
      });
      
      console.log('[MSW] Browser service worker started successfully');
    } catch (error) {
      console.error('[MSW] Failed to start service worker:', error);
      console.warn('[MSW] App will continue without mocking - some features may not work');
    }
  }
  
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Provider store={store}>
          <App />
      </Provider>
    </React.StrictMode>,
  );
};

startApp();
