import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { toggleMsw, clearMswError } from '../../store/uiSlice';
import { mswService } from '../../services/mswService';
import './MSWToggle.css';

/**
 * MSW Toggle Component - Allows users to enable/disable Mock Service Worker
 */
export const MSWToggle: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isMswEnabled, mswStatus, mswError } = useAppSelector((state) => state.ui);

  const handleToggle = async () => {
    dispatch(toggleMsw());
    
    // Start or stop MSW based on new state
    if (!isMswEnabled) {
      // Currently disabled, so we're enabling it
      await mswService.start();
    } else {
      // Currently enabled, so we're disabling it
      await mswService.stop();
    }
  };

  const handleRetry = async () => {
    dispatch(clearMswError());
    if (isMswEnabled) {
      await mswService.restart();
    }
  };

  const getStatusIcon = () => {
    switch (mswStatus) {
      case 'active': return '🟢';
      case 'starting': return '🟡';
      case 'error': return '🔴';
      case 'inactive': return '⚪';
      default: return '⚪';
    }
  };

  const getStatusText = () => {
    switch (mswStatus) {
      case 'active': return 'Active';
      case 'starting': return 'Starting...';
      case 'error': return 'Error';
      case 'inactive': return 'Inactive';
      default: return 'Unknown';
    }
  };

  return (
    <div className="msw-toggle">
      <div className="msw-toggle__header">
        <label className="msw-toggle__label">
          <input
            type="checkbox"
            checked={isMswEnabled}
            onChange={handleToggle}
            disabled={mswStatus === 'starting'}
            className="msw-toggle__checkbox"
          />
          <span className="msw-toggle__slider"></span>
          <span className="msw-toggle__text">
            Mock Service Worker
          </span>
        </label>
        
        <div className="msw-toggle__status">
          <span className="msw-toggle__status-icon">{getStatusIcon()}</span>
          <span className="msw-toggle__status-text">{getStatusText()}</span>
        </div>
      </div>

      {mswError && (
        <div className="msw-toggle__error">
          <div className="msw-toggle__error-message">
            <strong>Error:</strong> {mswError}
          </div>
          <button 
            onClick={handleRetry}
            className="msw-toggle__retry-button"
            disabled={mswStatus === 'starting'}
          >
            Retry
          </button>
        </div>
      )}

      <div className="msw-toggle__debug">
        <div className="msw-toggle__debug-title">Debug Info:</div>
        <div className="msw-toggle__debug-info">
          <div>Enabled: {isMswEnabled ? 'Yes' : 'No'}</div>
          <div>Status: {mswStatus}</div>
          <div>Worker Active: {mswService.isActive() ? 'Yes' : 'No'}</div>
        </div>
      </div>

      {isMswEnabled && mswStatus === 'active' && (
        <div className="msw-toggle__info">
          <small>
            API requests are being intercepted by mock handlers. 
            Disable this to use real backend services.
          </small>
        </div>
      )}
    </div>
  );
}; 