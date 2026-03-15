import { useState, useCallback } from 'react';
import { creditService } from '../services';
import { useLoading } from './useLoading';

/**
 * Custom hook for credit operations
 */
export function useCredit() {
  const [creditData, setCreditData] = useState({
    score: null,
    limit: null,
    assessment: null
  });
  
  const { isLoading, error, executeAsync, clearError } = useLoading();

  // Credit Score Operations
  const fetchCreditScore = useCallback(async (userId, useCache = true) => {
    return executeAsync(async () => {
      const score = await creditService.getCreditScore(userId, useCache);
      setCreditData(prev => ({ ...prev, score }));
      return score;
    });
  }, [executeAsync]);

  const fetchCreditLimit = useCallback(async (userId, useCache = true) => {
    return executeAsync(async () => {
      const limit = await creditService.getCreditLimit(userId, useCache);
      setCreditData(prev => ({ ...prev, limit }));
      return limit;
    });
  }, [executeAsync]);

  const fetchCreditAssessment = useCallback(async (userId, useCache = true) => {
    return executeAsync(async () => {
      const assessment = await creditService.getCreditAssessment(userId, useCache);
      setCreditData(prev => ({ ...prev, assessment }));
      return assessment;
    });
  }, [executeAsync]);

  // Fetch all credit data for a user
  const fetchAllCreditData = useCallback(async (userId, useCache = true) => {
    return executeAsync(async () => {
      const [score, limit, assessment] = await Promise.all([
        creditService.getCreditScore(userId, useCache).catch(err => {
          console.warn('Failed to fetch credit score:', err);
          return null;
        }),
        creditService.getCreditLimit(userId, useCache).catch(err => {
          console.warn('Failed to fetch credit limit:', err);
          return null;
        }),
        creditService.getCreditAssessment(userId, useCache).catch(err => {
          console.warn('Failed to fetch credit assessment:', err);
          return null;
        })
      ]);

      const allData = { score, limit, assessment };
      setCreditData(allData);
      return allData;
    });
  }, [executeAsync]);

  // Batch Operations
  const fetchBatchCreditScores = useCallback(async (userIds) => {
    return executeAsync(async () => {
      return await creditService.getBatchCreditScores(userIds);
    });
  }, [executeAsync]);

  const fetchBatchCreditLimits = useCallback(async (userIds) => {
    return executeAsync(async () => {
      return await creditService.getBatchCreditLimits(userIds);
    });
  }, [executeAsync]);

  // Admin Operations
  const recalculateCreditScore = useCallback(async (userId) => {
    return executeAsync(async () => {
      const result = await creditService.recalculateCreditScore(userId);
      // Clear local data to force refresh
      setCreditData(prev => ({ ...prev, score: null, assessment: null }));
      return result;
    });
  }, [executeAsync]);

  const recalculateCreditLimit = useCallback(async (userId) => {
    return executeAsync(async () => {
      const result = await creditService.recalculateCreditLimit(userId);
      // Clear local data to force refresh
      setCreditData(prev => ({ ...prev, limit: null, assessment: null }));
      return result;
    });
  }, [executeAsync]);

  const fetchCreditReport = useCallback(async (filters = {}) => {
    return executeAsync(async () => {
      return await creditService.getCreditReport(filters);
    });
  }, [executeAsync]);

  // Cache Management
  const clearCreditCache = useCallback((userId = null, type = null) => {
    creditService.clearCache(userId, type);
    
    // Clear local state if applicable
    if (!userId || !type) {
      setCreditData({ score: null, limit: null, assessment: null });
    } else {
      setCreditData(prev => ({ ...prev, [type]: null }));
    }
  }, []);

  // Utility Functions
  const formatCreditScore = useCallback((score) => {
    return creditService.formatCreditScore(score);
  }, []);

  const formatCreditLimit = useCallback((limit) => {
    return creditService.formatCreditLimit(limit);
  }, []);

  const getCreditScoreRating = useCallback((score) => {
    return creditService.getCreditScoreRating(score);
  }, []);

  const getRiskLevel = useCallback((score) => {
    return creditService.getRiskLevel(score);
  }, []);

  // Reset state
  const resetCreditData = useCallback(() => {
    setCreditData({ score: null, limit: null, assessment: null });
    clearError();
  }, [clearError]);

  return {
    // State
    creditData,
    isLoading,
    error,
    
    // Credit operations
    fetchCreditScore,
    fetchCreditLimit,
    fetchCreditAssessment,
    fetchAllCreditData,
    
    // Batch operations
    fetchBatchCreditScores,
    fetchBatchCreditLimits,
    
    // Admin operations
    recalculateCreditScore,
    recalculateCreditLimit,
    fetchCreditReport,
    
    // Cache management
    clearCreditCache,
    
    // Utility functions
    formatCreditScore,
    formatCreditLimit,
    getCreditScoreRating,
    getRiskLevel,
    
    // State management
    resetCreditData,
    clearError
  };
}

export default useCredit;