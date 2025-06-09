import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import uiReducer, { 
  toggleMsw, 
  setMswEnabled, 
  setMswStatus, 
  setMswError, 
  clearMswError,
  toggleDebugInfo,
  resetUISettings 
} from '../store/uiSlice';

// Create a test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      ui: uiReducer
    }
  });
};

describe('UI Store - MSW Control', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should have correct initial state', () => {
    const state = store.getState().ui;
    
    // In test environment, MSW defaults to false since it's not development mode
    expect(state.isMswEnabled).toBe(false);
    expect(state.mswStatus).toBe('inactive');
    expect(state.mswError).toBeUndefined();
    expect(state.showDebugInfo).toBe(false);
    expect(state.theme).toBe('system');
  });

  it('should toggle MSW state', () => {
    // Initial state (false in test environment)
    expect(store.getState().ui.isMswEnabled).toBe(false);
    
    // Toggle on
    store.dispatch(toggleMsw());
    expect(store.getState().ui.isMswEnabled).toBe(true);
    expect(store.getState().ui.mswStatus).toBe('starting');
    
    // Toggle back off
    store.dispatch(toggleMsw());
    expect(store.getState().ui.isMswEnabled).toBe(false);
    expect(store.getState().ui.mswStatus).toBe('inactive');
  });

  it('should set MSW enabled state', () => {
    store.dispatch(setMswEnabled(false));
    expect(store.getState().ui.isMswEnabled).toBe(false);
    expect(store.getState().ui.mswStatus).toBe('inactive');
    
    store.dispatch(setMswEnabled(true));
    expect(store.getState().ui.isMswEnabled).toBe(true);
    expect(store.getState().ui.mswStatus).toBe('starting');
  });

  it('should handle MSW status changes', () => {
    store.dispatch(setMswStatus('active'));
    expect(store.getState().ui.mswStatus).toBe('active');
    
    store.dispatch(setMswStatus('error'));
    expect(store.getState().ui.mswStatus).toBe('error');
  });

  it('should handle MSW errors', () => {
    const errorMessage = 'Failed to start MSW';
    
    store.dispatch(setMswError(errorMessage));
    expect(store.getState().ui.mswStatus).toBe('error');
    expect(store.getState().ui.mswError).toBe(errorMessage);
    
    store.dispatch(clearMswError());
    expect(store.getState().ui.mswError).toBeUndefined();
  });

  it('should toggle debug info', () => {
    expect(store.getState().ui.showDebugInfo).toBe(false);
    
    store.dispatch(toggleDebugInfo());
    expect(store.getState().ui.showDebugInfo).toBe(true);
    
    store.dispatch(toggleDebugInfo());
    expect(store.getState().ui.showDebugInfo).toBe(false);
  });

  it('should reset UI settings to defaults', () => {
    // Modify state
    store.dispatch(setMswEnabled(false));
    store.dispatch(toggleDebugInfo());
    store.dispatch(setMswError('Test error'));
    
    // Reset
    store.dispatch(resetUISettings());
    
    const state = store.getState().ui;
    // In test environment, reset defaults to false since it's not development mode
    expect(state.isMswEnabled).toBe(false);
    expect(state.mswStatus).toBe('inactive');
    expect(state.mswError).toBeUndefined();
    expect(state.showDebugInfo).toBe(false);
    expect(state.theme).toBe('system');
  });

  it('should persist state to localStorage', () => {
    // Modify state
    store.dispatch(setMswEnabled(false));
    store.dispatch(toggleDebugInfo());
    
    // Check localStorage was updated
    const savedState = JSON.parse(localStorage.getItem('audit-tool-ui-state') || '{}');
    expect(savedState.isMswEnabled).toBe(false);
    expect(savedState.showDebugInfo).toBe(true);
    expect(savedState.theme).toBe('system');
  });
}); 