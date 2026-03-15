import { useState, useCallback } from 'react';
import { userService } from '../services';
import { useLoading } from './useLoading';

/**
 * Custom hook for user operations
 */
export function useUsers() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  
  const { isLoading, error, executeAsync, clearError } = useLoading();

  // User fetching operations
  const fetchUsers = useCallback(async (params = {}) => {
    return executeAsync(async () => {
      const fetchedUsers = await userService.getUsers(params);
      setUsers(fetchedUsers);
      return fetchedUsers;
    });
  }, [executeAsync]);

  const fetchUser = useCallback(async (userId, useCache = true) => {
    return executeAsync(async () => {
      const user = await userService.getUser(userId, useCache);
      return user;
    });
  }, [executeAsync]);

  const fetchCurrentUser = useCallback(async () => {
    return executeAsync(async () => {
      const user = await userService.getCurrentUser();
      return user;
    });
  }, [executeAsync]);

  // Search operations
  const searchUsers = useCallback(async (query, filters = {}) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return [];
    }

    return executeAsync(async () => {
      const results = await userService.searchUsers(query, filters);
      setSearchResults(results);
      return results;
    });
  }, [executeAsync]);

  // User selection
  const selectUser = useCallback(async (userId) => {
    if (!userId) {
      setSelectedUser(null);
      return null;
    }

    return executeAsync(async () => {
      const user = await userService.getUser(userId);
      setSelectedUser(user);
      return user;
    });
  }, [executeAsync]);

  const clearSelectedUser = useCallback(() => {
    setSelectedUser(null);
  }, []);

  // Admin operations
  const fetchUsersForAdmin = useCallback(async (filters = {}) => {
    return executeAsync(async () => {
      const adminUsers = await userService.getUsersForAdmin(filters);
      return adminUsers;
    });
  }, [executeAsync]);

  // Batch operations
  const fetchBatchUsers = useCallback(async (userIds) => {
    return executeAsync(async () => {
      const batchUsers = await userService.getBatchUsers(userIds);
      return batchUsers;
    });
  }, [executeAsync]);

  // Utility functions
  const formatUserName = useCallback((user) => {
    return userService.formatUserName(user);
  }, []);

  const formatUserAddress = useCallback((user) => {
    return userService.formatUserAddress(user);
  }, []);

  const formatUserEmployment = useCallback((user) => {
    return userService.formatUserEmployment(user);
  }, []);

  const formatUserContact = useCallback((user) => {
    return userService.formatUserContact(user);
  }, []);

  const calculateAge = useCallback((dateOfBirth) => {
    return userService.calculateAge(dateOfBirth);
  }, []);

  // Cache management
  const clearUserCache = useCallback((userId = null) => {
    userService.clearUserCache(userId);
    
    if (!userId) {
      // Clear all local state
      setUsers([]);
      setSelectedUser(null);
      setSearchResults([]);
    } else if (selectedUser?.id === userId) {
      // Clear selected user if it matches
      setSelectedUser(null);
    }
  }, [selectedUser]);

  // Search helpers
  const clearSearchResults = useCallback(() => {
    setSearchResults([]);
  }, []);

  // Validation
  const validateUserId = useCallback((userId) => {
    try {
      return userService.validateUserId(userId);
    } catch (error) {
      throw error;
    }
  }, []);

  const validateSearchQuery = useCallback((query) => {
    try {
      return userService.validateSearchQuery(query);
    } catch (error) {
      throw error;
    }
  }, []);

  // Reset state
  const resetUserData = useCallback(() => {
    setUsers([]);
    setSelectedUser(null);
    setSearchResults([]);
    clearError();
  }, [clearError]);

  // Find user in current data
  const findUserById = useCallback((userId) => {
    return users.find(user => user.id === userId) || 
           searchResults.find(user => user.id === userId) ||
           (selectedUser?.id === userId ? selectedUser : null);
  }, [users, searchResults, selectedUser]);

  return {
    // State
    users,
    selectedUser,
    searchResults,
    isLoading,
    error,
    
    // User operations
    fetchUsers,
    fetchUser,
    fetchCurrentUser,
    
    // Search operations
    searchUsers,
    clearSearchResults,
    
    // User selection
    selectUser,
    clearSelectedUser,
    
    // Admin operations
    fetchUsersForAdmin,
    
    // Batch operations
    fetchBatchUsers,
    
    // Utility functions
    formatUserName,
    formatUserAddress,
    formatUserEmployment,
    formatUserContact,
    calculateAge,
    
    // Cache management
    clearUserCache,
    
    // Validation
    validateUserId,
    validateSearchQuery,
    
    // State management
    resetUserData,
    findUserById,
    clearError
  };
}

export default useUsers;