import { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { 
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useUpdateUserStatusMutation,
  useUpdateUserRoleMutation,
  selectAllUsers, 
  selectActiveUsers, 
  selectSelectedUser,
  selectUser,
} from '../store/userSlice';
import { User, UserRole } from '../types/types';
import { UserId } from '../types/brandedTypes';

/**
 * Type for user creation without requiring an ID
 */
export type NewUser = Omit<User, 'id'> & { id?: UserId };

/**
 * Generate initials from a user's name
 */
export function generateInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 3);
}

/**
 * Hook to interact with the user store using RTK Query
 */
export const useUsers = () => {
  const dispatch = useAppDispatch();
  
  // RTK Query hooks
  const { error, isLoading, isFetching, refetch } = useGetUsersQuery();
  const [createUserMutation] = useCreateUserMutation();
  const [updateUserMutation] = useUpdateUserMutation();
  const [deleteUserMutation] = useDeleteUserMutation();
  const [updateUserStatusMutation] = useUpdateUserStatusMutation();
  const [updateUserRoleMutation] = useUpdateUserRoleMutation();
  
  // Selectors for derived data
  const allUsers = useAppSelector(selectAllUsers);
  const activeUsers = useAppSelector(selectActiveUsers);
  const selectedUser = useAppSelector(selectSelectedUser);
  
  // Get a user by ID
  const getUserById = useCallback(
    (userId: UserId) => {
      return allUsers.find(user => user.id === userId);
    },
    [allUsers]
  );
  
  // Get users by role
  const getUsersByRole = useCallback(
    (role: UserRole) => {
      return allUsers.filter(user => user.authorities === role);
    },
    [allUsers]
  );
  
  // Dispatch actions
  const setSelectedUser = useCallback(
    (userId: UserId) => dispatch(selectUser(userId)),
    [dispatch]
  );
  
  const createUser = useCallback(
    async (user: NewUser) => {
      try {
        // Generate initials if not provided
        const initials = user.initials ?? generateInitials(user.displayName);
        
        // Create a new User with a generated ID if none provided
        const newUser: Omit<User, 'id'> = {
          ...user,
          initials
        };
        
        await createUserMutation(newUser).unwrap();
      } catch (error) {
        console.error('Failed to create user:', error);
        throw error;
      }
    },
    [createUserMutation]
  );
  
  const modifyUser = useCallback(
    async (user: User) => {
      try {
        await updateUserMutation(user).unwrap();
      } catch (error) {
        console.error('Failed to update user:', error);
        throw error;
      }
    },
    [updateUserMutation]
  );
  
  const removeUser = useCallback(
    async (userId: UserId) => {
      try {
        await deleteUserMutation(userId).unwrap();
      } catch (error) {
        console.error('Failed to delete user:', error);
        throw error;
      }
    },
    [deleteUserMutation]
  );
  
  const toggleUserActive = useCallback(
    async (userId: UserId, isActive: boolean) => {
      try {
        await updateUserStatusMutation({ userId, isActive }).unwrap();
      } catch (error) {
        console.error('Failed to update user status:', error);
        throw error;
      }
    },
    [updateUserStatusMutation]
  );
  
  const changeUserRole = useCallback(
    async (userId: UserId, role: UserRole) => {
      try {
        await updateUserRoleMutation({ userId, role }).unwrap();
      } catch (error) {
        console.error('Failed to update user role:', error);
        throw error;
      }
    },
    [updateUserRoleMutation]
  );
  
  // Function to manually refresh users
  const refreshUsers = useCallback(
    () => {
      refetch();
    },
    [refetch]
  );
  
  return {
    // Data
    allUsers,
    activeUsers,
    selectedUser,
    getUserById,
    getUsersByRole,
    
    // Status
    isLoading,
    isFetching,
    error,
    
    // Actions
    setSelectedUser,
    createUser,
    modifyUser,
    removeUser,
    toggleUserActive,
    changeUserRole,
    refreshUsers
  };
}; 