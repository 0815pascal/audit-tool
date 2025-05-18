// Import core React modules
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';

// Import styles
import './index.css';
import App from './App';

// Add global error handling
window.addEventListener('error', (event) => {
  console.error('GLOBAL ERROR:', event.message, event.filename, event.lineno);
  
  // Show error to user
  setTimeout(() => {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
      loadingEl.innerHTML = `
        <div style="color: red; text-align: center; margin: 20px;">
          <p>Error loading application:</p>
          <pre style="background: #f8f8f8; padding: 10px; text-align: left; max-width: 800px; margin: 0 auto; overflow: auto;">${event.message}</pre>
          <button onclick="window.location.reload()" style="margin-top: 10px; padding: 8px 16px;">Reload</button>
        </div>
      `;
    }
  }, 1000);
});

// Initialize MSW in development environment BEFORE React rendering
const setupMocks = async () => {
  // Only run in development environment
  if (import.meta.env.DEV) {
    try {
      const { worker } = await import('./mocks/browser');
      
      await worker.start({
        serviceWorker: {
          url: '/mockServiceWorker.js',
        },
        onUnhandledRequest: 'bypass',
      });
      
      return true;
    } catch (error) {
      console.error('[MSW] Failed to start Mock Service Worker:', error);
      return false;
    }
  }
  return false;
};

// Function to render the app
const renderApp = () => {
  try {
    const rootElement = document.getElementById('root');
    
    if (rootElement) {
      const root = createRoot(rootElement);
      
      root.render(
        <StrictMode>
          <Provider store={store}>
            <App />
          </Provider>
        </StrictMode>
      );
      
      // Hide loading message when rendered
      const loadingElement = document.getElementById('loading');
      if (loadingElement) {
        setTimeout(() => {
          if (rootElement.children.length > 0) {
            loadingElement.style.display = 'none';
          } else {
            loadingElement.innerHTML = `
              <div style="color: red; text-align: center; margin: 20px;">
                <p>Application did not render properly</p>
                <button onclick="window.location.reload()" style="margin-top: 10px; padding: 8px 16px;">Reload</button>
              </div>
            `;
          }
        }, 3000);
      }
    } else {
      document.body.innerHTML = '<div style="color: red; padding: 20px;">Root element not found</div>';
    }
  } catch (error) {
    console.error('ERROR IN RENDER:', error);
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
      loadingEl.innerHTML = `
        <div style="color: red; text-align: center; margin: 20px;">
          <p>Error rendering application:</p>
          <pre style="background: #f8f8f8; padding: 10px; text-align: left; max-width: 800px; margin: 0 auto; overflow: auto;">${error instanceof Error ? error.message : String(error)}</pre>
          <button onclick="window.location.reload()" style="margin-top: 10px; padding: 8px 16px;">Reload</button>
        </div>
      `;
    }
  }
};

// Initialize the app with proper setup
const startApp = async () => {
  try {
    await setupMocks();
    renderApp();
  } catch (error) {
    console.error('Fatal error in app startup:', error);
    try {
      renderApp();
    } catch (renderError) {
      console.error('Failed to render app after startup error:', renderError);
      const loadingEl = document.getElementById('loading');
      if (loadingEl) {
        loadingEl.innerHTML = `
          <div style="color: red; text-align: center; margin: 20px;">
            <p>Fatal application error:</p>
            <pre style="background: #f8f8f8; padding: 10px; text-align: left; max-width: 800px; margin: 0 auto; overflow: auto;">${error instanceof Error ? error.message : String(error)}</pre>
            <button onclick="window.location.reload()" style="margin-top: 10px; padding: 8px 16px;">Reload</button>
          </div>
        `;
      }
    }
  }
};

// Start the application
startApp();
