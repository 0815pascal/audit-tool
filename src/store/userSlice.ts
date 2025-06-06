import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ApiResponse, User, UserRole } from '../types/types';
import { UserId } from '../types/brandedTypes';
import { RootState } from './index';
import { HTTP_METHOD } from '../enums';
import { API_ENDPOINTS } from '../constants';
import type { UserUIState } from './userSlice.types';
import api from './api';

// Type for error response data
interface ErrorResponseData {
  error?: string;
  message?: string;
  code?: number;
}

// Inject user endpoints into the main API slice
export const userApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch all users
    getUsers: builder.query<User[], void>({
      query: () => API_ENDPOINTS.USERS.BASE,
      transformResponse: (response: ApiResponse<User[]>) => {
        if (!response.success) {
          throw new Error(response.error ?? 'Failed to fetch users');
        }
        return response.data;
      },
      transformErrorResponse: (response: { status: number; data: ErrorResponseData }) => ({
        status: response.status,
        message: response.data?.error ?? 'Failed to fetch users',
        code: response.data?.code,
      }),
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
      query: (id) => API_ENDPOINTS.USERS.BY_ID(id),
      transformResponse: (response: ApiResponse<User>) => {
        if (!response.success) {
          throw new Error(response.error ?? 'Failed to fetch user');
        }
        return response.data;
      },
      transformErrorResponse: (response: { status: number; data: ErrorResponseData }) => ({
        status: response.status,
        message: response.data?.error ?? 'Failed to fetch user',
        code: response.data?.code,
      }),
      providesTags: (_, __, id) => [{ type: 'User', id }],
    }),

    // Create new user
    createUser: builder.mutation<User, Omit<User, 'id'>>({
      query: (newUser) => ({
        url: API_ENDPOINTS.USERS.BASE,
        method: HTTP_METHOD.POST,
        body: newUser,
      }),
      transformResponse: (response: ApiResponse<User>) => {
        if (!response.success) {
          throw new Error(response.error ?? 'Failed to create user');
        }
        return response.data;
      },
      transformErrorResponse: (response: { status: number; data: ErrorResponseData }) => ({
        status: response.status,
        message: response.data?.error ?? 'Failed to create user',
        code: response.data?.code,
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
      // RTK Query best practice: Optimistic updates for better UX
      async onQueryStarted(newUser, { dispatch, queryFulfilled }) {
        // Optimistically add the user to the cache
        const patchResult = dispatch(
          userApi.util.updateQueryData('getUsers', undefined, (draft: User[]) => {
            const tempUser: User = {
              ...newUser,
              id: `temp-${Date.now()}` as UserId, // Temporary ID
            };
            draft.push(tempUser);
          })
        );
        try {
          const { data: createdUser } = await queryFulfilled;
          // Replace the temporary user with the real one
          dispatch(
            userApi.util.updateQueryData('getUsers', undefined, (draft: User[]) => {
              const tempIndex = draft.findIndex(u => u.id.startsWith('temp-'));
              if (tempIndex !== -1) {
                draft[tempIndex] = createdUser;
              }
            })
          );
        } catch {
          // Undo the optimistic update if the request fails
          patchResult.undo();
        }
      },
    }),

    // Update existing user with optimistic updates
    updateUser: builder.mutation<User, User>({
      query: ({ id, ...patch }) => ({
        url: API_ENDPOINTS.USERS.BY_ID(id),
        method: HTTP_METHOD.PUT,
        body: patch,
      }),
      transformResponse: (response: ApiResponse<User>) => {
        if (!response.success) {
          throw new Error(response.error ?? 'Failed to update user');
        }
        return response.data;
      },
      transformErrorResponse: (response: { status: number; data: ErrorResponseData }) => ({
        status: response.status,
        message: response.data?.error ?? 'Failed to update user',
        code: response.data?.code,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
      ],
      // RTK Query best practice: Optimistic updates for better UX
      async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled }) {
        // Optimistically update the cache
        const patchResult = dispatch(
          userApi.util.updateQueryData('getUsers', undefined, (draft: User[]) => {
            const user = draft.find((u: User) => u.id === id);
            if (user) {
              Object.assign(user, patch);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          // Undo the optimistic update if the request fails
          patchResult.undo();
        }
      },
    }),

    // Delete user
    deleteUser: builder.mutation<{ success: boolean; id: UserId }, UserId>({
      query: (id) => ({
        url: API_ENDPOINTS.USERS.BY_ID(id),
        method: HTTP_METHOD.DELETE,
      }),
      transformResponse: (response: ApiResponse<{ success: boolean }>, _, id) => {
        if (!response.success) {
          throw new Error(response.error ?? 'Failed to delete user');
        }
        return { success: true, id };
      },
      transformErrorResponse: (response: { status: number; data: ErrorResponseData }) => ({
        status: response.status,
        message: response.data?.error ?? 'Failed to delete user',
        code: response.data?.code,
      }),
      invalidatesTags: (_, __, id) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
      ],
      // RTK Query best practice: Optimistic updates for delete
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        // Optimistically remove the user from the cache
        const patchResult = dispatch(
          userApi.util.updateQueryData('getUsers', undefined, (draft: User[]) => {
            const index = draft.findIndex(user => user.id === id);
            if (index !== -1) {
              draft.splice(index, 1);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          // Undo the optimistic update if the request fails
          patchResult.undo();
        }
      },
    }),

    // Update user active status
    updateUserStatus: builder.mutation<User, { userId: UserId; isActive: boolean }>({
      query: ({ userId, isActive }) => ({
        url: API_ENDPOINTS.USERS.STATUS(userId),
        method: HTTP_METHOD.PATCH,
        body: { enabled: isActive },
      }),
      transformResponse: (response: ApiResponse<User>) => {
        if (!response.success) {
          throw new Error(response.error ?? 'Failed to update user status');
        }
        return response.data;
      },
      transformErrorResponse: (response: { status: number; data: ErrorResponseData }) => ({
        status: response.status,
        message: response.data?.error ?? 'Failed to update user status',
        code: response.data?.code,
      }),
      invalidatesTags: (_, __, { userId }) => [
        { type: 'User', id: userId },
        { type: 'User', id: 'LIST' },
      ],
    }),

    // Update user role
    updateUserRole: builder.mutation<User, { userId: UserId; role: UserRole }>({
      query: ({ userId, role }) => ({
        url: API_ENDPOINTS.USERS.ROLE(userId),
        method: HTTP_METHOD.PATCH,
        body: { authorities: role },
      }),
      transformResponse: (response: ApiResponse<User>) => {
        if (!response.success) {
          throw new Error(response.error ?? 'Failed to update user role');
        }
        return response.data;
      },
      transformErrorResponse: (response: { status: number; data: ErrorResponseData }) => ({
        status: response.status,
        message: response.data?.error ?? 'Failed to update user role',
        code: response.data?.code,
      }),
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
  [selectAllUsers, (_: RootState, role: UserRole) => role],
  (users, role) => users.filter(user => user.authorities === role)
);

// Selector for getting a specific user by ID
export const selectUserById = createSelector(
  [selectAllUsers, (_: RootState, userId: UserId) => userId],
  (users, userId) => users.find(user => user.id === userId)
);

// Selected user selector
const selectSelectedUserId = (state: RootState) => state.userUI.selectedUserId;

export const selectSelectedUser = createSelector(
  [selectAllUsers, selectSelectedUserId],
  (users, selectedUserId) => 
    selectedUserId ? users.find(user => user.id === selectedUserId) : null
);

// Export the UI reducer
export default userUISlice.reducer; 