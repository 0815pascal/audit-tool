/**
 * UI slice types for managing application-wide UI state
 */

export interface UIState {
  /** Whether MSW (Mock Service Worker) is enabled */
  isMswEnabled: boolean;
  /** Whether MSW is currently active/running */
  mswStatus: 'inactive' | 'starting' | 'active' | 'error';
  /** Error message if MSW failed to start */
  mswError?: string;
  /** Whether to show debug information in the UI */
  showDebugInfo: boolean;
  /** Theme preference (for future expansion) */
  theme: 'light' | 'dark' | 'system';
} 