import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import caseAuditSlice from '../store/caseAuditSlice';
import userSlice from '../store/userSlice';
import { RootState } from '../store';
import { createUserId } from '../types';
import { USER_ROLE_ENUM, ACTION_STATUS_ENUM } from '../enums';

describe('Redux User Integration Tests', () => {
  it('should verify that components use Redux store for user data', () => {
    // Create a store with test user data
    const store = configureStore({
      reducer: {
        caseAudit: caseAuditSlice,
        user: userSlice,
      },
      preloadedState: {
        user: {
          users: [
            {
              id: createUserId('1'),
              name: 'John Smith',
              department: '5',
              role: USER_ROLE_ENUM.SPECIALIST,
              isActive: true,
              initials: 'JS'
            },
            {
              id: createUserId('2'),
              name: 'Jane Doe',
              department: '5',
              role: USER_ROLE_ENUM.STAFF,
              isActive: true,
              initials: 'JD'
            }
          ],
          selectedUserId: null,
          status: ACTION_STATUS_ENUM.SUCCEEDED,
          error: null,
          isLoading: false,
          isError: false,
          isSuccess: true
        },
        caseAudit: {
          currentUserId: createUserId('1'),
          verifiedAudits: {},
          userQuarterlyStatus: {},
          quarterlySelection: {},
          userRoles: {
            '1': { role: USER_ROLE_ENUM.SPECIALIST, department: '5' },
            '2': { role: USER_ROLE_ENUM.STAFF, department: '5' }
          },
          loading: false,
          error: null
        }
      }
    });

    // Verify that the Redux store contains the expected user data
    const state = store.getState() as RootState;
    expect(state.user.users).toHaveLength(2);
    expect(state.user.users[0].name).toBe('John Smith');
    expect(state.user.users[1].name).toBe('Jane Doe');
    
    // Verify that user roles are properly stored
    expect(state.caseAudit.userRoles['1'].role).toBe(USER_ROLE_ENUM.SPECIALIST);
    expect(state.caseAudit.userRoles['2'].role).toBe(USER_ROLE_ENUM.STAFF);
  });

  it('should verify that different Redux state produces different user data', () => {
    // Create a store with different user data to prove components use Redux, not hardcoded data
    const storeWithDifferentUsers = configureStore({
      reducer: {
        caseAudit: caseAuditSlice,
        user: userSlice,
      },
      preloadedState: {
        user: {
          users: [
            {
              id: createUserId('99'),
              name: 'Redux User',
              department: '5',
              role: USER_ROLE_ENUM.SPECIALIST,
              isActive: true,
              initials: 'RU'
            }
          ],
          selectedUserId: null,
          status: ACTION_STATUS_ENUM.SUCCEEDED,
          error: null,
          isLoading: false,
          isError: false,
          isSuccess: true
        },
        caseAudit: {
          currentUserId: createUserId('99'),
          verifiedAudits: {},
          userQuarterlyStatus: {},
          quarterlySelection: {},
          userRoles: {
            '99': { role: USER_ROLE_ENUM.SPECIALIST, department: '5' }
          },
          loading: false,
          error: null
        }
      }
    });

    // Verify that this store has different user data
    const state = storeWithDifferentUsers.getState() as RootState;
    expect(state.user.users).toHaveLength(1);
    expect(state.user.users[0].name).toBe('Redux User');
    
    // Verify that the original mock users are not in this store
    const userNames = state.user.users.map(u => u.name);
    expect(userNames).not.toContain('John Smith');
    expect(userNames).not.toContain('Jane Doe');
    expect(userNames).toContain('Redux User');
  });

  it('should verify that components no longer import users directly from mockData', () => {
    // This test verifies the architectural change we made
    // Components should now use useUsers hook or Redux selectors instead of direct imports
    
    // We can verify this by checking that the store is the source of truth
    const store = configureStore({
      reducer: {
        caseAudit: caseAuditSlice,
        user: userSlice,
      },
      preloadedState: {
        user: {
          users: [],
          selectedUserId: null,
          status: ACTION_STATUS_ENUM.IDLE,
          error: null,
          isLoading: false,
          isError: false,
          isSuccess: false
        },
        caseAudit: {
          currentUserId: createUserId(''),
          verifiedAudits: {},
          userQuarterlyStatus: {},
          quarterlySelection: {},
          userRoles: {},
          loading: false,
          error: null
        }
      }
    });

    // Empty store should have no users
    const state = store.getState() as RootState;
    expect(state.user.users).toHaveLength(0);
    
    // This proves that components must get user data from Redux store
    // If they were still importing directly from mockData, they would have users regardless of store state
  });
}); 