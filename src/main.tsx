// Import core React modules
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';

// Import styles
import './index.css';
import App from './App';

// Get root element
const rootElement = document.getElementById('root');

// First render the app regardless of MSW status
if (rootElement) {
  // Create root and render app
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
      }
    }, 500);
  }
} else {
  console.error('Root element not found');
  document.body.innerHTML = '<div style="color: red; padding: 20px;">Root element not found</div>';
}

// Initialize MSW in development environment (after app is rendered)
if (import.meta.env.DEV) {
  const initializeMSW = async () => {
    try {
      const { worker } = await import('./mocks/browser');
      
      // Launch MSW with more permissive options
      await worker.start({
        onUnhandledRequest: 'bypass',
        serviceWorker: {
          url: '/mockServiceWorker.js',
          options: {
            // More permissive scope for the service worker
            scope: '/'
          }
        }
      });
      
      console.log("[MSW] Mock Service Worker initialized successfully");
    } catch (error) {
      console.error("[MSW] Failed to initialize Mock Service Worker:", error);
      
      // App will continue to work without MSW
    }
  };
  
  // Start MSW initialization
  initializeMSW();
}
