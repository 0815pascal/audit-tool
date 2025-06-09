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
  // Initialize MSW service with Redux dispatch
  const { mswService } = await import('./services/mswService');
  mswService.initialize(store.dispatch);
  
  // Make MSW service globally accessible in development for debugging
  if (import.meta.env.MODE === 'development') {
    (window as any).__MSW_SERVICE__ = mswService;
    (window as any).__REDUX_STORE__ = store;
    console.log('🛠️ Debug: MSW Service and Redux Store available on window.__MSW_SERVICE__ and window.__REDUX_STORE__');
  }
  
  // Check initial MSW state from Redux and start if enabled
  const state = store.getState();
  if (state.ui.isMswEnabled) {
    console.log('[App] Starting MSW based on Redux state...');
    await mswService.start();
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
