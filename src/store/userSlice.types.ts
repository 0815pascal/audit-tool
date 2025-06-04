import { UserId } from '../types/brandedTypes';

/**
 * Interface for user UI state management (selected user, etc.)
 */
export interface UserUIState {
  selectedUserId: UserId | null;
} 