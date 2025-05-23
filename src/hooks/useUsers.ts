import { useCallback, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { 
  selectAllUsers, 
  selectActiveUsers, 
  selectSelectedUser,
  selectUser,
  addUser,
  updateUser,
  deleteUser,
  setUserActiveStatus,
  updateUserRole,
  selectStatus,
  selectIsSuccess,
  selectIsError,
  selectIsLoading,
  resetStatus,
  fetchUsers
} from '../store/userSlice';
import { User, UserId, UserRole, createUserId } from '../types';

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
 * Hook to interact with the user store
 */
export const useUsers = () => {
  const dispatch = useAppDispatch();
  
  // Selectors
  const allUsers = useAppSelector(selectAllUsers);
  const activeUsers = useAppSelector(selectActiveUsers);
  const selectedUser = useAppSelector(selectSelectedUser);
  const status = useAppSelector(selectStatus);
  const isSuccess = useAppSelector(selectIsSuccess);
  const isError = useAppSelector(selectIsError);
  const isLoading = useAppSelector(selectIsLoading);
  
  // Fetch users when the hook is initialized or if the user list is empty
  useEffect(() => {
    if (status === 'idle' && allUsers.length === 0) {
      dispatch(fetchUsers());
    }
  }, [dispatch, status, allUsers.length]);
  
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
      return allUsers.filter(user => user.role === role);
    },
    [allUsers]
  );
  
  // Create a valid user ID that doesn't conflict with existing IDs
  const generateUniqueUserId = useCallback(
    (baseId: string = Date.now().toString()): UserId => {
      // Check if the ID already exists
      const exists = allUsers.some(user => user.id.toString() === baseId);
      if (!exists) {
        return createUserId(baseId);
      }
      
      // If it exists, append a unique suffix
      return createUserId(`${baseId}_${Math.floor(Math.random() * 1000)}`);
    },
    [allUsers]
  );
  
  // Dispatch actions
  const setSelectedUser = useCallback(
    (userId: UserId) => dispatch(selectUser(userId)),
    [dispatch]
  );
  
  const createUser = useCallback(
    (user: NewUser) => {
      // Generate initials if not provided
      const initials = user.initials || generateInitials(user.name);
      
      // Create a new User with a generated ID if none provided
      const newUser: User = {
        id: user.id || generateUniqueUserId(),
        ...user,
        initials
      };
      
      dispatch(addUser(newUser));
    },
    [dispatch, generateUniqueUserId]
  );
  
  const modifyUser = useCallback(
    (user: User) => dispatch(updateUser(user)),
    [dispatch]
  );
  
  const removeUser = useCallback(
    (userId: UserId) => dispatch(deleteUser(userId)),
    [dispatch]
  );
  
  const toggleUserActive = useCallback(
    (userId: UserId, isActive: boolean) => dispatch(setUserActiveStatus({ userId, isActive })),
    [dispatch]
  );
  
  const changeUserRole = useCallback(
    (userId: UserId, role: UserRole) => dispatch(updateUserRole({ userId, role })),
    [dispatch]
  );
  
  const clearStatus = useCallback(
    () => dispatch(resetStatus()),
    [dispatch]
  );
  
  // Function to manually refresh users
  const refreshUsers = useCallback(
    () => dispatch(fetchUsers()),
    [dispatch]
  );
  
  return {
    // Data
    allUsers,
    activeUsers,
    selectedUser,
    getUserById,
    getUsersByRole,
    
    // Status
    status,
    isSuccess,
    isError,
    isLoading,
    
    // Actions
    setSelectedUser,
    createUser,
    modifyUser,
    removeUser,
    toggleUserActive,
    changeUserRole,
    clearStatus,
    refreshUsers
  };
}; 