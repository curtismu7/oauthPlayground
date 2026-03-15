/**
 * Consumer Lending API Usage Examples
 * 
 * This file contains practical examples of how to use the Consumer Lending API
 * for common operations and workflows.
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3002';
const ACCESS_TOKEN = process.env.ACCESS_TOKEN || 'your_access_token_here';

// Create API client
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Example 1: Basic User Profile Retrieval
 */
async function getUserProfile(userId) {
  try {
    console.log(`\n=== Getting User Profile for ${userId} ===`);
    
    const response = await apiClient.get(`/api/users/${userId}`);
    const user = response.data.data;
    
    console.log(`Name: ${user.firstName} ${user.lastName}`);
    console.log(`Email: ${user.email}`);
    console.log(`Phone: ${user.phone}`);
    console.log(`Annual Income: $${user.employment.annualIncome.toLocaleString()}`);
    console.log(`Employment: ${user.employment.position} at ${user.employment.employer}`);
    
    return user;
  } catch (error) {
    console.error('Error getting user profile:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 2: Credit Score Retrieval
 */
async function getCreditScore(userId) {
  try {
    console.log(`\n=== Getting Credit Score for ${userId} ===`);
    
    const response = await apiClient.get(`/api/credit/${userId}/score`);
    const creditScore = response.data.data;
    
    console.log(`Credit Score: ${creditScore.score}`);
    console.log(`Score Date: ${new Date(creditScore.scoreDate).toLocaleDateString()}`);
    console.log(`Payment History: ${creditScore.factors.paymentHistory}%`);
    console.log(`Credit Utilization: ${creditScore.factors.creditUtilization}%`);
    console.log(`Credit Length: ${creditScore.factors.creditLength}%`);
    console.log(`Credit Mix: ${creditScore.factors.creditMix}%`);
    console.log(`New Credit: ${creditScore.factors.newCredit}%`);
    
    return creditScore;
  } catch (error) {
    console.error('Error getting credit score:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 3: Credit Limit Calculation
 */
async function getCreditLimit(userId) {
  try {
    console.log(`\n=== Getting Credit Limit for ${userId} ===`);
    
    const response = await apiClient.get(`/api/credit/${userId}/limit`);
    const creditLimit = response.data.data;
    
    console.log(`Calculated Limit: $${creditLimit.calculatedLimit.toLocaleString()}`);
    console.log(`Approved Limit: $${creditLimit.approvedLimit.toLocaleString()}`);
    console.log(`Risk Level: ${creditLimit.riskLevel.toUpperCase()}`);
    console.log(`Income Multiplier: ${creditLimit.businessRules.incomeMultiplier}`);
    console.log(`Debt-to-Income Ratio: ${creditLimit.businessRules.debtToIncomeRatio}`);
    console.log(`Expires: ${new Date(creditLimit.expiresAt).toLocaleDateString()}`);
    
    return creditLimit;
  } catch (error) {
    console.error('Error getting credit limit:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 4: Complete Credit Assessment
 */
async function getFullCreditAssessment(userId) {
  try {
    console.log(`\n=== Complete Credit Assessment for ${userId} ===`);
    
    const response = await apiClient.get(`/api/credit/${userId}/assessment`);
    const assessment = response.data.data;
    
    console.log(`\nUser Information:`);
    console.log(`  Name: ${assessment.user.firstName} ${assessment.user.lastName}`);
    console.log(`  Email: ${assessment.user.email}`);
    
    console.log(`\nCredit Score:`);
    console.log(`  Score: ${assessment.creditScore.score}`);
    console.log(`  Date: ${new Date(assessment.creditScore.scoreDate).toLocaleDateString()}`);
    
    console.log(`\nCredit Limit:`);
    console.log(`  Calculated: $${assessment.creditLimit.calculatedLimit.toLocaleString()}`);
    console.log(`  Approved: $${assessment.creditLimit.approvedLimit.toLocaleString()}`);
    console.log(`  Risk Level: ${assessment.creditLimit.riskLevel.toUpperCase()}`);
    
    console.log(`\nRecommendation:`);
    console.log(`  Approved: ${assessment.recommendation.approved ? 'YES' : 'NO'}`);
    console.log(`  Max Amount: $${assessment.recommendation.maxAmount.toLocaleString()}`);
    console.log(`  Interest Rate: ${assessment.recommendation.interestRate}%`);
    console.log(`  Terms: ${assessment.recommendation.terms}`);
    
    return assessment;
  } catch (error) {
    console.error('Error getting credit assessment:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 5: User Search (Admin Function)
 */
async function searchUsers(searchTerm, limit = 10) {
  try {
    console.log(`\n=== Searching Users: "${searchTerm}" ===`);
    
    const response = await apiClient.get('/api/users', {
      params: {
        search: searchTerm,
        limit: limit
      }
    });
    
    const result = response.data.data;
    
    console.log(`Found ${result.users.length} users (Total: ${result.pagination.total})`);
    
    result.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email}) - ${user.isActive ? 'Active' : 'Inactive'}`);
    });
    
    return result;
  } catch (error) {
    console.error('Error searching users:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 6: Health Check
 */
async function checkHealth() {
  try {
    console.log(`\n=== Health Check ===`);
    
    const response = await apiClient.get('/api/health');
    const health = response.data;
    
    console.log(`Status: ${health.status.toUpperCase()}`);
    console.log(`Uptime: ${Math.floor(health.uptime / 60)} minutes`);
    console.log(`Timestamp: ${new Date(health.timestamp).toLocaleString()}`);
    
    return health;
  } catch (error) {
    console.error('Error checking health:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 7: Detailed Health Check (Admin)
 */
async function checkDetailedHealth() {
  try {
    console.log(`\n=== Detailed Health Check ===`);
    
    const response = await apiClient.get('/api/health/detailed');
    const health = response.data;
    
    console.log(`Overall Status: ${health.status.toUpperCase()}`);
    console.log(`Uptime: ${Math.floor(health.uptime / 60)} minutes`);
    
    console.log(`\nService Status:`);
    Object.entries(health.services).forEach(([service, status]) => {
      console.log(`  ${service}: ${status.toUpperCase()}`);
    });
    
    console.log(`\nMetrics:`);
    console.log(`  Requests/min: ${health.metrics.requestsPerMinute}`);
    console.log(`  Avg Response Time: ${health.metrics.averageResponseTime}ms`);
    console.log(`  Error Rate: ${(health.metrics.errorRate * 100).toFixed(2)}%`);
    
    return health;
  } catch (error) {
    console.error('Error checking detailed health:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 8: Admin Credit Recalculation
 */
async function recalculateCreditScores(userIds, force = false) {
  try {
    console.log(`\n=== Recalculating Credit Scores ===`);
    console.log(`Users: ${userIds.join(', ')}`);
    console.log(`Force: ${force}`);
    
    const response = await apiClient.post('/api/admin/credit/recalculate', {
      userIds: userIds,
      force: force
    });
    
    const result = response.data.data;
    
    console.log(`Job ID: ${result.jobId}`);
    console.log(`Status: ${result.status.toUpperCase()}`);
    console.log(`Users Queued: ${result.usersQueued}`);
    console.log(`Estimated Completion: ${new Date(result.estimatedCompletion).toLocaleString()}`);
    
    return result;
  } catch (error) {
    console.error('Error recalculating credit scores:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 9: Complete Lending Workflow
 */
async function completeLendingWorkflow(userId) {
  try {
    console.log(`\n=== Complete Lending Workflow for ${userId} ===`);
    
    // Step 1: Get user profile
    const user = await getUserProfile(userId);
    
    // Step 2: Get credit score
    const creditScore = await getCreditScore(userId);
    
    // Step 3: Get credit limit
    const creditLimit = await getCreditLimit(userId);
    
    // Step 4: Make lending decision
    const decision = makeLendingDecision(user, creditScore, creditLimit);
    
    console.log(`\n=== LENDING DECISION ===`);
    console.log(`Applicant: ${user.firstName} ${user.lastName}`);
    console.log(`Decision: ${decision.approved ? 'APPROVED' : 'DENIED'}`);
    console.log(`Reason: ${decision.reason}`);
    
    if (decision.approved) {
      console.log(`Approved Amount: $${decision.approvedAmount.toLocaleString()}`);
      console.log(`Interest Rate: ${decision.interestRate}%`);
      console.log(`Term: ${decision.term} months`);
    }
    
    return decision;
  } catch (error) {
    console.error('Error in lending workflow:', error.message);
    throw error;
  }
}

/**
 * Helper function: Make lending decision based on data
 */
function makeLendingDecision(user, creditScore, creditLimit) {
  const minScore = 600;
  const minIncome = 30000;
  
  // Basic approval criteria
  if (creditScore.score < minScore) {
    return {
      approved: false,
      reason: `Credit score ${creditScore.score} below minimum ${minScore}`,
      approvedAmount: 0,
      interestRate: 0,
      term: 0
    };
  }
  
  if (user.employment.annualIncome < minIncome) {
    return {
      approved: false,
      reason: `Annual income $${user.employment.annualIncome.toLocaleString()} below minimum $${minIncome.toLocaleString()}`,
      approvedAmount: 0,
      interestRate: 0,
      term: 0
    };
  }
  
  // Calculate terms based on risk
  let interestRate;
  let term = 36; // Default 3 years
  
  if (creditScore.score >= 750) {
    interestRate = 8.5; // Excellent credit
  } else if (creditScore.score >= 700) {
    interestRate = 12.5; // Good credit
  } else if (creditScore.score >= 650) {
    interestRate = 16.5; // Fair credit
  } else {
    interestRate = 22.5; // Poor credit
  }
  
  return {
    approved: true,
    reason: 'Meets all approval criteria',
    approvedAmount: creditLimit.approvedLimit,
    interestRate: interestRate,
    term: term
  };
}

/**
 * Example 10: Batch Processing
 */
async function processBatchAssessments(userIds) {
  console.log(`\n=== Batch Processing ${userIds.length} Users ===`);
  
  const results = [];
  
  for (const userId of userIds) {
    try {
      console.log(`\nProcessing user ${userId}...`);
      const assessment = await getFullCreditAssessment(userId);
      results.push({
        userId: userId,
        success: true,
        assessment: assessment
      });
    } catch (error) {
      console.error(`Failed to process user ${userId}:`, error.message);
      results.push({
        userId: userId,
        success: false,
        error: error.message
      });
    }
  }
  
  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\n=== Batch Processing Summary ===`);
  console.log(`Total: ${results.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  
  return results;
}

// Main execution function
async function main() {
  try {
    // Check if API is healthy
    await checkHealth();
    
    // Example user IDs (replace with actual IDs from your system)
    const sampleUserIds = ['user123', 'user456', 'user789'];
    
    // Run examples
    console.log('\n' + '='.repeat(50));
    console.log('CONSUMER LENDING API EXAMPLES');
    console.log('='.repeat(50));
    
    // Example 1: Single user workflow
    if (sampleUserIds.length > 0) {
      await completeLendingWorkflow(sampleUserIds[0]);
    }
    
    // Example 2: Search users
    await searchUsers('john', 5);
    
    // Example 3: Batch processing
    await processBatchAssessments(sampleUserIds.slice(0, 2));
    
    // Example 4: Health checks
    await checkDetailedHealth();
    
    console.log('\n' + '='.repeat(50));
    console.log('ALL EXAMPLES COMPLETED SUCCESSFULLY');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\nExample execution failed:', error.message);
    process.exit(1);
  }
}

// Export functions for use in other modules
module.exports = {
  getUserProfile,
  getCreditScore,
  getCreditLimit,
  getFullCreditAssessment,
  searchUsers,
  checkHealth,
  checkDetailedHealth,
  recalculateCreditScores,
  completeLendingWorkflow,
  processBatchAssessments,
  makeLendingDecision
};

// Run examples if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}