import apiClient from './apiClient';

class UserService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes for user data
  }

  // Cache management
  getCacheKey(userId) {
    return `user_${userId}`;
  }

  getCachedUser(userId) {
    const key = this.getCacheKey(userId);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    // Remove expired cache entry
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }

  setCachedUser(userId, userData) {
    const key = this.getCacheKey(userId);
    this.cache.set(key, {
      data: userData,
      timestamp: Date.now()
    });
  }

  clearUserCache(userId = null) {
    if (userId) {
      const key = this.getCacheKey(userId);
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  // User operations
  async getUsers(params = {}) {
    try {
      const response = await apiClient.get('/api/users', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      
      if (error.code === 'FORBIDDEN') {
        error.message = 'You do not have permission to view users.';
      }
      
      throw error;
    }
  }

  async getUser(userId, useCache = true) {
    try {
      // Check cache first
      if (useCache) {
        const cached = this.getCachedUser(userId);
        if (cached) {
          return cached;
        }
      }

      const response = await apiClient.get(`/api/users/${userId}`);
      const user = response.data;

      // Cache the result
      this.setCachedUser(userId, user);

      return user;
    } catch (error) {
      console.error('Error fetching user:', error);
      
      if (error.code === 'NOT_FOUND') {
        error.message = 'User not found.';
      } else if (error.code === 'FORBIDDEN') {
        error.message = 'You do not have permission to view this user.';
      }
      
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const response = await apiClient.get('/api/users/me');
      return response.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  }

  async searchUsers(query, filters = {}) {
    try {
      const params = {
        search: query,
        ...filters
      };

      const response = await apiClient.get('/api/users', { params });
      return response.data;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  // User profile formatting and utilities
  formatUserName(user) {
    if (!user) return 'Unknown User';
    
    const { firstName, lastName } = user;
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    } else {
      return user.email || user.id || 'Unknown User';
    }
  }

  formatUserAddress(user) {
    if (!user?.address) return 'No address available';
    
    const { street, city, state, zipCode } = user.address;
    const parts = [];
    
    if (street) parts.push(street);
    if (city) parts.push(city);
    if (state) parts.push(state);
    if (zipCode) parts.push(zipCode);
    
    return parts.join(', ') || 'No address available';
  }

  formatUserEmployment(user) {
    if (!user?.employment) return 'No employment information';
    
    const { employer, position, annualIncome } = user.employment;
    const parts = [];
    
    if (position) parts.push(position);
    if (employer) parts.push(`at ${employer}`);
    
    let result = parts.join(' ') || 'No employment information';
    
    if (annualIncome) {
      const formattedIncome = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(annualIncome);
      result += ` (${formattedIncome}/year)`;
    }
    
    return result;
  }

  formatUserContact(user) {
    if (!user) return {};
    
    return {
      email: user.email || 'No email',
      phone: user.phone || 'No phone',
      formattedPhone: this.formatPhoneNumber(user.phone)
    };
  }

  formatPhoneNumber(phone) {
    if (!phone) return 'No phone';
    
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX for US numbers
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 11 && digits[0] === '1') {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    
    return phone; // Return original if not standard format
  }

  calculateAge(dateOfBirth) {
    if (!dateOfBirth) return null;
    
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  // Validation helpers
  validateUserId(userId) {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required');
    }
    return true;
  }

  validateSearchQuery(query) {
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters long');
    }
    return true;
  }

  // Admin operations
  async getUsersForAdmin(filters = {}) {
    try {
      const response = await apiClient.get('/api/admin/users', {
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching users for admin:', error);
      
      if (error.code === 'FORBIDDEN') {
        error.message = 'You do not have administrative permissions.';
      }
      
      throw error;
    }
  }

  // Batch operations
  async getBatchUsers(userIds) {
    try {
      const response = await apiClient.post('/api/users/batch', {
        userIds
      });
      
      // Cache individual results
      response.data.forEach(user => {
        if (user.id) {
          this.setCachedUser(user.id, user);
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching batch users:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
const userService = new UserService();
export default userService;