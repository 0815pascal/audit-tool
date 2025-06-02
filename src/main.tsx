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
        <div style="color: red; text-align: center; margin: 20px;">
          <p>Error loading application:</p>
          <pre style="background: #f8f8f8; padding: 10px; text-align: left; max-width: 800px; margin: 0 auto; overflow: auto;">${event.message}</pre>
          <button onclick="window.location.reload()" style="margin-top: 10px; padding: 8px 16px;">Reload</button>
        </div>
      `;
    }
  }, 1000);
});

// Start the app
const startApp = async () => {
  if (import.meta.env.MODE === 'development') {
    const { worker } = await import('./mocks/browser');
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: {
        url: '/mockServiceWorker.js',
      },
    });
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
