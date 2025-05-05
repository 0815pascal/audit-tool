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

// Initialize MSW in development environment
if (import.meta.env.DEV) {
  import('./mocks/browser')
    .then(({ worker }) => worker.start({ onUnhandledRequest: 'bypass' }))
    .catch(error => console.error('MSW initialization failed:', error));
}
