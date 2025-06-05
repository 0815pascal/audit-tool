import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ApiResponse, User, UserRole } from '../types/types';
import { UserId } from '../types/brandedTypes';
import { RootState } from './index';
import { Department, USER_ROLE_ENUM, HTTP_METHOD } from '../enums';
import type { UserUIState } from './userSlice.types';
import api from './api';

// Inject user endpoints into the main API slice
export const userApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch all users
    getUsers: builder.query<User[], void>({
      query: () => '/users',
      transformResponse: (response: ApiResponse<User[]>) => {
        if (!response.success) {
          throw new Error((response as ApiResponse<User[]> & { error?: string }).error ?? 'Failed to fetch users');
        }
        return response.data;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'User' as const, id })),
              { type: 'User', id: 'LIST' },
            ]
          : [{ type: 'User', id: 'LIST' }],
    }),

    // Get user by ID
    getUserById: builder.query<User, UserId>({
      query: (id) => `/users/${id}`,
      transformResponse: (response: ApiResponse<User>) => {
        if (!response.success) {
          throw new Error((response as ApiResponse<User> & { error?: string }).error ?? 'Failed to fetch user');
        }
        return response.data;
      },
      providesTags: (_, __, id) => [{ type: 'User', id }],
    }),

    // Create new user
    createUser: builder.mutation<User, Omit<User, 'id'>>({
      query: (newUser) => ({
        url: '/users',
        method: HTTP_METHOD.POST,
        body: newUser,
      }),
      transformResponse: (response: ApiResponse<User>) => {
        if (!response.success) {
          throw new Error((response as ApiResponse<User> & { error?: string }).error ?? 'Failed to create user');
        }
        return response.data;
      },
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    // Update existing user
    updateUser: builder.mutation<User, User>({
      query: ({ id, ...patch }) => ({
        url: `/users/${id}`,
        method: HTTP_METHOD.PUT,
        body: patch,
      }),
      transformResponse: (response: ApiResponse<User>) => {
        if (!response.success) {
          throw new Error((response as ApiResponse<User> & { error?: string }).error ?? 'Failed to update user');
        }
        return response.data;
      },
      invalidatesTags: (_, __, { id }) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
      ],
    }),

    // Delete user
    deleteUser: builder.mutation<{ success: boolean; id: UserId }, UserId>({
      query: (id) => ({
        url: `/users/${id}`,
        method: HTTP_METHOD.DELETE,
      }),
      transformResponse: (response: ApiResponse<{ success: boolean }>, _, id) => {
        if (!response.success) {
          throw new Error((response as ApiResponse<{ success: boolean }> & { error?: string }).error ?? 'Failed to delete user');
        }
        return { success: true, id };
      },
      invalidatesTags: (_, __, id) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
      ],
    }),

    // Update user active status
    updateUserStatus: builder.mutation<User, { userId: UserId; isActive: boolean }>({
      query: ({ userId, isActive }) => ({
        url: `/users/${userId}/status`,
        method: HTTP_METHOD.PATCH,
        body: { enabled: isActive },
      }),
      transformResponse: (response: ApiResponse<User>) => {
        if (!response.success) {
          throw new Error((response as ApiResponse<User> & { error?: string }).error ?? 'Failed to update user status');
        }
        return response.data;
      },
      invalidatesTags: (_, __, { userId }) => [
        { type: 'User', id: userId },
        { type: 'User', id: 'LIST' },
      ],
    }),

    // Update user role
    updateUserRole: builder.mutation<User, { userId: UserId; role: UserRole }>({
      query: ({ userId, role }) => ({
        url: `/users/${userId}/role`,
        method: HTTP_METHOD.PATCH,
        body: { authorities: role },
      }),
      transformResponse: (response: ApiResponse<User>) => {
        if (!response.success) {
          throw new Error((response as ApiResponse<User> & { error?: string }).error ?? 'Failed to update user role');
        }
        return response.data;
      },
      invalidatesTags: (_, __, { userId }) => [
        { type: 'User', id: userId },
        { type: 'User', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

// Export hooks for use in components
export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useUpdateUserStatusMutation,
  useUpdateUserRoleMutation,
} = userApi;

// Separate slice for UI state (like selected user)
const initialUIState: UserUIState = {
  selectedUserId: null,
};

const userUISlice = createSlice({
  name: 'userUI',
  initialState: initialUIState,
  reducers: {
    selectUser(state, action: PayloadAction<UserId | null>) {
      state.selectedUserId = action.payload;
    },
    clearSelectedUser(state) {
      state.selectedUserId = null;
    },
  },
});

// Export UI actions
export const { selectUser, clearSelectedUser } = userUISlice.actions;

// Enhanced selectors that work with RTK Query cache
// Use RTK Query's built-in memoized selectors directly to avoid reference issues
const getUsersQuerySelector = userApi.endpoints.getUsers.select();

export const selectAllUsers = createSelector(
  [getUsersQuerySelector],
  (usersResult) => usersResult.data ?? []
);

export const selectActiveUsers = createSelector(
  [selectAllUsers],
  (users) => users.filter(user => user.enabled)
);

export const selectUsersByRole = createSelector(
  [selectAllUsers, (_state: RootState, role: UserRole) => role],
  (users, role) => users.filter(user => user.authorities === role)
);

export const selectSelectedUserId = (state: RootState) => state.userUI.selectedUserId;

export const selectSelectedUser = createSelector(
  [selectAllUsers, selectSelectedUserId],
  (users, selectedId) => selectedId ? users.find(user => user.id === selectedId) ?? null : null
);

// Loading and error selectors for the users query
export const selectUsersLoading = createSelector(
  [getUsersQuerySelector],
  (usersResult) => usersResult.isLoading
);

export const selectUsersError = createSelector(
  [getUsersQuerySelector],
  (usersResult) => usersResult.error ?? null
);

export const selectUsersFetching = createSelector(
  [getUsersQuerySelector],
  (usersResult) => usersResult.isLoading
);

// Role-specific selectors
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

// Count selectors
export const selectUserCount = createSelector(
  [selectAllUsers],
  (users) => users.length
);

export const selectUserCountByRole = createSelector(
  [selectAllUsers, (_state: RootState, role: UserRole) => role],
  (users, role) => users.filter(user => user.authorities === role).length
);

export const selectUserCountByDepartment = createSelector(
  [selectAllUsers, (_state: RootState, department: Department) => department],
  (users, department) => users.filter(user => user.department === department).length
);

// Utility selector to get user by ID from cache
export const selectUserById = createSelector(
  [selectAllUsers, (_state: RootState, userId: UserId) => userId],
  (users, userId) => users.find(user => user.id === userId)
);

// Export the UI reducer
export default userUISlice.reducer; 