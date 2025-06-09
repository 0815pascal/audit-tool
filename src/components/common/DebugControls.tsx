import React from 'react';
import { MSWToggle } from './MSWToggle';
import './DebugControls.css';

/**
 * Debug Controls Component - Container for MSW toggle and other debug features
 */
export const DebugControls: React.FC = () => {
  return (
    <div className="debug-controls">
      <div className="debug-controls__content">
        <MSWToggle />
        
        <div className="debug-controls__info">
          <div className="debug-controls__info-section">
            <h4>Environment Info</h4>
            <div className="debug-controls__info-grid">
              <div>Mode: {import.meta.env.MODE}</div>
              <div>Dev: {import.meta.env.DEV ? 'Yes' : 'No'}</div>
              <div>Prod: {import.meta.env.PROD ? 'Yes' : 'No'}</div>
              <div>Base URL: {import.meta.env.BASE_URL}</div>
            </div>
          </div>

          <div className="debug-controls__info-section">
            <h4>Browser Info</h4>
            <div className="debug-controls__info-grid">
              <div>User Agent: {navigator.userAgent.split(' ')[0]}</div>
              <div>Language: {navigator.language}</div>
              <div>Online: {navigator.onLine ? 'Yes' : 'No'}</div>
              <div>Cookies: {navigator.cookieEnabled ? 'Enabled' : 'Disabled'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 