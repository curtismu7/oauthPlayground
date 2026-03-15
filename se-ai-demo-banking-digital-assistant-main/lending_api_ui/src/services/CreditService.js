import apiClient from './apiClient';

class CreditService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Cache management
  getCacheKey(userId, type) {
    return `${type}_${userId}`;
  }

  getCachedData(userId, type) {
    const key = this.getCacheKey(userId, type);
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

  setCachedData(userId, type, data) {
    const key = this.getCacheKey(userId, type);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache(userId = null, type = null) {
    if (userId && type) {
      // Clear specific cache entry
      const key = this.getCacheKey(userId, type);
      this.cache.delete(key);
    } else if (userId) {
      // Clear all cache entries for user
      const keysToDelete = [];
      for (const key of this.cache.keys()) {
        if (key.endsWith(`_${userId}`)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }

  // Credit Score Operations
  async getCreditScore(userId, useCache = true) {
    try {
      // Check cache first
      if (useCache) {
        const cached = this.getCachedData(userId, 'score');
        if (cached) {
          return cached;
        }
      }

      const response = await apiClient.get(`/api/credit/${userId}/score`);
      const creditScore = response.data;

      // Cache the result
      this.setCachedData(userId, 'score', creditScore);

      return creditScore;
    } catch (error) {
      console.error('Error fetching credit score:', error);
      
      // Enhance error with context
      if (error.code === 'FORBIDDEN') {
        error.message = 'You do not have permission to view credit scores. Please contact your administrator.';
      } else if (error.code === 'NOT_FOUND') {
        error.message = 'Credit score not found for this user.';
      }
      
      throw error;
    }
  }

  // Credit Limit Operations
  async getCreditLimit(userId, useCache = true) {
    try {
      // Check cache first
      if (useCache) {
        const cached = this.getCachedData(userId, 'limit');
        if (cached) {
          return cached;
        }
      }

      const response = await apiClient.get(`/api/credit/${userId}/limit`);
      const creditLimit = response.data;

      // Cache the result
      this.setCachedData(userId, 'limit', creditLimit);

      return creditLimit;
    } catch (error) {
      console.error('Error fetching credit limit:', error);
      
      // Enhance error with context
      if (error.code === 'FORBIDDEN') {
        error.message = 'You do not have permission to view credit limits. Please contact your administrator.';
      } else if (error.code === 'NOT_FOUND') {
        error.message = 'Credit limit not found for this user.';
      }
      
      throw error;
    }
  }

  // Comprehensive Credit Assessment
  async getCreditAssessment(userId, useCache = true) {
    try {
      // Check cache first
      if (useCache) {
        const cached = this.getCachedData(userId, 'assessment');
        if (cached) {
          return cached;
        }
      }

      const response = await apiClient.get(`/api/credit/${userId}/assessment`);
      const assessment = response.data;

      // Cache the result
      this.setCachedData(userId, 'assessment', assessment);

      return assessment;
    } catch (error) {
      console.error('Error fetching credit assessment:', error);
      
      // Enhance error with context
      if (error.code === 'FORBIDDEN') {
        error.message = 'You do not have permission to view credit assessments. Please contact your administrator.';
      } else if (error.code === 'NOT_FOUND') {
        error.message = 'Credit assessment not available for this user.';
      }
      
      throw error;
    }
  }

  // Batch operations for multiple users
  async getBatchCreditScores(userIds) {
    try {
      const response = await apiClient.post('/api/credit/batch/scores', {
        userIds
      });
      
      // Cache individual results
      response.data.forEach(score => {
        if (score.userId) {
          this.setCachedData(score.userId, 'score', score);
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching batch credit scores:', error);
      throw error;
    }
  }

  async getBatchCreditLimits(userIds) {
    try {
      const response = await apiClient.post('/api/credit/batch/limits', {
        userIds
      });
      
      // Cache individual results
      response.data.forEach(limit => {
        if (limit.userId) {
          this.setCachedData(limit.userId, 'limit', limit);
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching batch credit limits:', error);
      throw error;
    }
  }

  // Credit recalculation (admin only)
  async recalculateCreditScore(userId) {
    try {
      const response = await apiClient.post(`/api/admin/credit/${userId}/recalculate-score`);
      
      // Clear cache for this user
      this.clearCache(userId, 'score');
      this.clearCache(userId, 'assessment');
      
      return response.data;
    } catch (error) {
      console.error('Error recalculating credit score:', error);
      
      if (error.code === 'FORBIDDEN') {
        error.message = 'You do not have permission to recalculate credit scores.';
      }
      
      throw error;
    }
  }

  async recalculateCreditLimit(userId) {
    try {
      const response = await apiClient.post(`/api/admin/credit/${userId}/recalculate-limit`);
      
      // Clear cache for this user
      this.clearCache(userId, 'limit');
      this.clearCache(userId, 'assessment');
      
      return response.data;
    } catch (error) {
      console.error('Error recalculating credit limit:', error);
      
      if (error.code === 'FORBIDDEN') {
        error.message = 'You do not have permission to recalculate credit limits.';
      }
      
      throw error;
    }
  }

  // Credit reporting (admin only)
  async getCreditReport(filters = {}) {
    try {
      const response = await apiClient.get('/api/admin/credit/report', {
        params: filters
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching credit report:', error);
      
      if (error.code === 'FORBIDDEN') {
        error.message = 'You do not have permission to view credit reports.';
      }
      
      throw error;
    }
  }

  // User search and lookup
  async searchUsers(query, filters = {}) {
    try {
      const response = await apiClient.get('/api/users', {
        params: {
          search: query,
          ...filters
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  async getUserProfile(userId) {
    try {
      // Check cache first
      const cached = this.getCachedData(userId, 'profile');
      if (cached) {
        return cached;
      }

      const response = await apiClient.get(`/api/users/${userId}`);
      const profile = response.data;

      // Cache the result
      this.setCachedData(userId, 'profile', profile);

      return profile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      
      if (error.code === 'NOT_FOUND') {
        error.message = 'User not found.';
      }
      
      throw error;
    }
  }

  // Utility methods
  formatCreditScore(score) {
    if (typeof score !== 'number') return 'N/A';
    return score.toString();
  }

  formatCreditLimit(limit) {
    if (typeof limit !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(limit);
  }

  getCreditScoreRating(score) {
    if (typeof score !== 'number') return 'Unknown';
    
    if (score >= 800) return 'Excellent';
    if (score >= 740) return 'Very Good';
    if (score >= 670) return 'Good';
    if (score >= 580) return 'Fair';
    return 'Poor';
  }

  getRiskLevel(score) {
    if (typeof score !== 'number') return 'Unknown';
    
    if (score >= 740) return 'Low';
    if (score >= 670) return 'Medium';
    return 'High';
  }

  // Health check
  async healthCheck() {
    try {
      const response = await apiClient.get('/api/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
const creditService = new CreditService();
export default creditService;