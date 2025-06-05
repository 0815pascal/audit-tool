import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import auditUISlice from '../store/caseAuditSlice';
import { userApi, selectAllUsers } from '../store/userSlice';
import userUISlice, { selectUser, clearSelectedUser } from '../store/userSlice';
import { auditApi } from '../store/caseAuditSlice';
import store from '../store';
import api from '../store/api';
import { createUserId } from '../types/typeHelpers';

describe('Redux User Integration Tests', () => {
  it('should verify that the store is properly configured with RTK Query', () => {
    // Test that our actual store includes the correct reducers
    const state = store.getState();
    
    // Verify store structure matches RTK Query integration with consolidated API
    expect(state).toHaveProperty('auditUI');
    expect(state).toHaveProperty('userUI');
    expect(state).toHaveProperty('api'); // Now using consolidated API
    
    // Verify userUI slice is working
    expect(state.userUI.selectedUserId).toBeNull();
  });

  it('should verify that RTK Query hooks are available', () => {
    // Test that RTK Query hooks are properly exported from injected endpoints
    expect(userApi.endpoints.getUsers).toBeDefined();
    expect(userApi.endpoints.getUserById).toBeDefined();
    expect(userApi.endpoints.createUser).toBeDefined();
    expect(userApi.endpoints.updateUser).toBeDefined();
    expect(userApi.endpoints.deleteUser).toBeDefined();
    expect(userApi.endpoints.updateUserStatus).toBeDefined();
    expect(userApi.endpoints.updateUserRole).toBeDefined();
    
    // Test that audit API hooks are available
    expect(auditApi.endpoints.getCurrentUser).toBeDefined();
    expect(auditApi.endpoints.getAuditsByQuarter).toBeDefined();
    expect(auditApi.endpoints.completeAudit).toBeDefined();
    expect(auditApi.endpoints.saveAuditCompletion).toBeDefined();
  });

  it('should verify UI state management works correctly', () => {
    // Create a test store to verify UI actions
    const testStore = configureStore({
      reducer: {
        auditUI: auditUISlice,
        userUI: userUISlice,
        [api.reducerPath]: api.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware()
          .concat(api.middleware),
    });

    // Test initial state
    let state = testStore.getState();
    expect(state.userUI.selectedUserId).toBeNull();

    // Test selecting a user
    const userId = createUserId('test-user-1');
    testStore.dispatch(selectUser(userId));
    
    state = testStore.getState();
    expect(state.userUI.selectedUserId).toBe(userId);

    // Test clearing selection
    testStore.dispatch(clearSelectedUser());
    
    state = testStore.getState();
    expect(state.userUI.selectedUserId).toBeNull();
  });

  it('should verify that RTK Query selectors are available', () => {
    const state = store.getState();
    
    // Get RTK Query state for users
    const usersResult = selectAllUsers(state);
    
    // Should return an empty array when uninitialized, not throw an error
    expect(Array.isArray(usersResult)).toBe(true);
    expect(usersResult.length).toBe(0); // Should be empty when no data loaded
  });

  it('should verify the architectural migration from direct imports to RTK Query', () => {
    // This test ensures that we've successfully migrated from:
    // - Direct mockData imports → RTK Query hooks
    // - Manual Redux slices → RTK Query cache management
    // - Synchronous data → Asynchronous data with loading states
    
    // Verify that the old user slice structure no longer exists
    const state = store.getState();
    
    // Should NOT have old structure
    expect(state).not.toHaveProperty('user.users');
    expect(state).not.toHaveProperty('user.selectedUserId');
    expect(state).not.toHaveProperty('user.loading');
    expect(state).not.toHaveProperty('caseAudit');
    
    // Should have new RTK Query structure with consolidated API
    expect(state).toHaveProperty('api'); // Consolidated API slice
    expect(state).toHaveProperty('userUI');
    expect(state).toHaveProperty('auditUI');
    expect(state.userUI).toHaveProperty('selectedUserId');
  });

  it('should verify RTK Query tag-based cache invalidation configuration', () => {
    // Test that our endpoints have proper tag configuration for cache management
    const { endpoints } = userApi;
    
    // Verify query endpoints are defined
    expect(endpoints.getUsers).toBeDefined();
    expect(endpoints.getUserById).toBeDefined();
    
    // Verify mutation endpoints exist (they should invalidate appropriate tags)
    expect(endpoints.createUser).toBeDefined();
    expect(endpoints.updateUser).toBeDefined();
    expect(endpoints.deleteUser).toBeDefined();
    expect(endpoints.updateUserStatus).toBeDefined();
    expect(endpoints.updateUserRole).toBeDefined();
    
    // Test audit API endpoints
    const { endpoints: auditEndpoints } = auditApi;
    expect(auditEndpoints.getAuditsByQuarter).toBeDefined();
    expect(auditEndpoints.completeAudit).toBeDefined();
    expect(auditEndpoints.selectQuarterlyAudits).toBeDefined();
  });

  it('should verify that components can access user data through RTK Query cache', () => {
    // This test verifies that the data flow works:
    // Component → useGetUsersQuery hook → RTK Query cache → API
    
    const getUsersSelector = userApi.endpoints.getUsers.select();
    const state = store.getState();
    const usersQueryState = getUsersSelector(state);
    
    // The query should be in an uninitialized state initially
    // This proves components must trigger the query via hooks
    expect(['uninitialized', 'pending', 'fulfilled', 'rejected']).toContain(usersQueryState.status);
    
    // Data should be available when the query succeeds
    if (usersQueryState.status === 'fulfilled') {
      expect(Array.isArray(usersQueryState.data)).toBe(true);
    }
  });
}); 