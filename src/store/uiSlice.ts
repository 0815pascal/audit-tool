import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UIState } from './uiSlice.types';

/**
 * Load UI state from localStorage
 */
const loadUIState = (): Partial<UIState> => {
  try {
    const savedState = localStorage.getItem('audit-tool-ui-state');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      return {
        isMswEnabled: parsed.isMswEnabled ?? true, // Default to enabled in development
        showDebugInfo: parsed.showDebugInfo ?? false,
        theme: parsed.theme ?? 'system'
      };
    }
  } catch (error) {
    console.warn('Failed to load UI state from localStorage:', error);
  }
  
  return {
    // Default to enabling MSW in development mode
    isMswEnabled: import.meta.env.MODE === 'development',
    showDebugInfo: false,
    theme: 'system'
  };
};

/**
 * Save UI state to localStorage
 */
const saveUIState = (state: UIState): void => {
  try {
    const stateToSave = {
      isMswEnabled: state.isMswEnabled,
      showDebugInfo: state.showDebugInfo,
      theme: state.theme
    };
    localStorage.setItem('audit-tool-ui-state', JSON.stringify(stateToSave));
  } catch (error) {
    console.warn('Failed to save UI state to localStorage:', error);
  }
};

// Load initial state
const persistedState = loadUIState();

const initialState: UIState = {
  isMswEnabled: persistedState.isMswEnabled ?? true,
  mswStatus: 'inactive',
  mswError: undefined,
  showDebugInfo: persistedState.showDebugInfo ?? false,
  theme: persistedState.theme ?? 'system'
};

/**
 * UI slice for managing application-wide UI state
 */
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // MSW Control Actions
    toggleMsw: (state) => {
      state.isMswEnabled = !state.isMswEnabled;
      // Reset status when toggling
      state.mswStatus = state.isMswEnabled ? 'starting' : 'inactive';
      state.mswError = undefined;
      saveUIState(state);
    },
    
    setMswEnabled: (state, action: PayloadAction<boolean>) => {
      state.isMswEnabled = action.payload;
      state.mswStatus = action.payload ? 'starting' : 'inactive';
      state.mswError = undefined;
      saveUIState(state);
    },
    
    setMswStatus: (state, action: PayloadAction<UIState['mswStatus']>) => {
      state.mswStatus = action.payload;
    },
    
    setMswError: (state, action: PayloadAction<string>) => {
      state.mswStatus = 'error';
      state.mswError = action.payload;
    },
    
    clearMswError: (state) => {
      state.mswError = undefined;
      if (state.mswStatus === 'error') {
        state.mswStatus = state.isMswEnabled ? 'starting' : 'inactive';
      }
    },
    
    // Debug Control Actions
    toggleDebugInfo: (state) => {
      state.showDebugInfo = !state.showDebugInfo;
      saveUIState(state);
    },
    
    setShowDebugInfo: (state, action: PayloadAction<boolean>) => {
      state.showDebugInfo = action.payload;
      saveUIState(state);
    },
    
    // Theme Control Actions
    setTheme: (state, action: PayloadAction<UIState['theme']>) => {
      state.theme = action.payload;
      saveUIState(state);
    },
    
    // Reset all UI settings
    resetUISettings: (state) => {
      state.isMswEnabled = import.meta.env.MODE === 'development';
      state.mswStatus = 'inactive';
      state.mswError = undefined;
      state.showDebugInfo = false;
      state.theme = 'system';
      saveUIState(state);
    }
  }
});

export const {
  toggleMsw,
  setMswEnabled,
  setMswStatus,
  setMswError,
  clearMswError,
  toggleDebugInfo,
  setShowDebugInfo,
  setTheme,
  resetUISettings
} = uiSlice.actions;

export default uiSlice.reducer; 