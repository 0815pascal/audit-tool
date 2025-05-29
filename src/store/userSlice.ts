import { createSlice, PayloadAction, createSelector, createAsyncThunk } from '@reduxjs/toolkit';
import { User, UserRole, AsyncState, ApiResponse, ApiSuccessResponse } from '../types/types';
import { UserId } from '../types/brandedTypes';
import { RootState } from './index';
import { ACTION_STATUS_ENUM, USER_ROLE_ENUM } from '../enums';

// User state structure using AsyncState pattern
export interface UserState extends Omit<AsyncState<User[]>, 'data'> {
  users: User[];
  selectedUserId: UserId | null;
}

// Create async thunk for fetching users
export const fetchUsers = createAsyncThunk<
  User[],
  void,
  { rejectValue: string }
>(
  'user/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json() as ApiResponse<User[]>;
      
      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to fetch users');
      }
      
      return (data as ApiSuccessResponse<User[]>).data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch users');
    }
  }
);

const initialState: UserState = {
  users: [],
  selectedUserId: null,
  status: ACTION_STATUS_ENUM.IDLE,
  error: null,
  isLoading: false,
  isError: false,
  isSuccess: false
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Select a user
    selectUser(state, action: PayloadAction<UserId>) {
      state.selectedUserId = action.payload;
    },
    
    // Add a new user
    addUser(state, action: PayloadAction<User>) {
      state.users.push(action.payload);
      state.status = ACTION_STATUS_ENUM.SUCCEEDED;
      state.isSuccess = true;
    },
    
    // Update an existing user
    updateUser(state, action: PayloadAction<User>) {
      const index = state.users.findIndex(user => user.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = action.payload;
        state.status = ACTION_STATUS_ENUM.SUCCEEDED;
        state.isSuccess = true;
      }
    },
    
    // Delete a user
    deleteUser(state, action: PayloadAction<UserId>) {
      state.users = state.users.filter(user => user.id !== action.payload);
      
      // If the selected user is deleted, clear the selection
      if (state.selectedUserId === action.payload) {
        state.selectedUserId = null;
      }
      
      state.status = ACTION_STATUS_ENUM.SUCCEEDED;
      state.isSuccess = true;
    },
    
    // Set user active status
    setUserActiveStatus(state, action: PayloadAction<{ userId: UserId, isActive: boolean }>) {
      const { userId, isActive } = action.payload;
      const user = state.users.find(user => user.id === userId);
      if (user) {
        user.enabled = isActive;
        state.status = ACTION_STATUS_ENUM.SUCCEEDED;
        state.isSuccess = true;
      }
    },
    
    // Update user role
    updateUserRole(state, action: PayloadAction<{ userId: UserId, role: UserRole }>) {
      const { userId, role } = action.payload;
      const user = state.users.find(user => user.id === userId);
      if (user) {
        user.authorities = role;
        state.status = ACTION_STATUS_ENUM.SUCCEEDED;
        state.isSuccess = true;
      }
    },
    
    // Loading state handlers
    setLoadingState(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
      state.status = action.payload ? ACTION_STATUS_ENUM.LOADING : state.status;
    },
    
    // Error state handlers
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.status = action.payload ? ACTION_STATUS_ENUM.FAILED : state.status;
      state.isError = !!action.payload;
    },
    
    // Reset state handler
    resetStatus(state) {
      state.status = ACTION_STATUS_ENUM.IDLE;
      state.isSuccess = false;
      state.isError = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchUsers lifecycle
      .addCase(fetchUsers.pending, (state) => {
        state.status = ACTION_STATUS_ENUM.LOADING;
        state.isLoading = true;
        state.error = null;
        state.isError = false;
      })
      .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.status = ACTION_STATUS_ENUM.SUCCEEDED;
        state.isLoading = false;
        state.isSuccess = true;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = ACTION_STATUS_ENUM.FAILED;
        state.isLoading = false;
        state.isError = true;
        state.error = action.payload || 'Failed to fetch users';
      });
  }
});

// Export actions
export const { 
  selectUser,
  addUser,
  updateUser,
  deleteUser,
  setUserActiveStatus,
  updateUserRole,
  setLoadingState,
  setError,
  resetStatus
} = userSlice.actions;

// Selectors
export const selectAllUsers = (state: RootState) => state.user.users;


// Memoized selectors to prevent unnecessary rerenders
export const selectActiveUsers = createSelector(
  [selectAllUsers],
  (users) => users.filter(user => user.enabled)
);

export const selectUserById = (state: RootState, userId: UserId) => 
  state.user.users.find(user => user.id === userId);

export const selectUsersByRole = createSelector(
  [selectAllUsers, (_state: RootState, role: UserRole) => role],
  (users, role) => users.filter(user => user.authorities === role)
);

export const selectSelectedUser = (state: RootState) => {
  const selectedId = state.user.selectedUserId;
  return selectedId ? state.user.users.find(user => user.id === selectedId) : null;
};
export const selectIsLoading = (state: RootState) => state.user.isLoading;
export const selectError = (state: RootState) => state.user.error;
export const selectStatus = (state: RootState) => state.user.status;
export const selectIsSuccess = (state: RootState) => state.user.isSuccess;
export const selectIsError = (state: RootState) => state.user.isError;

// Role-specific memoized selectors
export const selectTeamLeaders = createSelector(
  [selectAllUsers],
  (users) => users.filter(user => user.authorities === USER_ROLE_ENUM.TEAM_LEADER)
);

export const selectSpecialists = createSelector(
  [selectAllUsers],
  (users) => users.filter(user => user.authorities === USER_ROLE_ENUM.SPECIALIST)
);

export const selectStaffUsers = createSelector(
  [selectAllUsers],
  (users) => users.filter(user => user.authorities === USER_ROLE_ENUM.STAFF)
);

export const selectReaderUsers = createSelector(
  [selectAllUsers],
  (users) => users.filter(user => user.authorities === USER_ROLE_ENUM.READER)
);

// Memoized selectors
export const selectUserCount = createSelector(
  [selectAllUsers],
  (users) => users.length
);

export const selectUserCountByRole = createSelector(
  [selectAllUsers, (_state: RootState, role: UserRole) => role],
  (users, role) => users.filter(user => user.authorities === role).length
);

export const selectUserCountByDepartment = createSelector(
  [selectAllUsers, (_state: RootState, department: string) => department],
  (users, department) => users.filter(user => user.department === department).length
);

// Export reducer
export default userSlice.reducer; 