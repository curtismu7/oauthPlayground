import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from './Header';
import apiClient from '../services/apiClient';

const CreditAssessment = ({ user, onLogout }) => {
  const { userId } = useParams();
  const [userProfile, setUserProfile] = useState(null);
  const [creditScore, setCreditScore] = useState(null);
  const [creditLimit, setCreditLimit] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log('🔍 [CreditAssessment] Component initialized:', {
    userId,
    hasUser: !!user,
    userEmail: user?.email
  });

  useEffect(() => {
    console.log('🔍 [CreditAssessment] useEffect triggered:', { userId });
    if (userId) {
      console.log('🔍 [CreditAssessment] userId found, calling loadCreditAssessment');
      loadCreditAssessment();
    } else {
      console.log('⚠️ [CreditAssessment] No userId provided');
    }
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCreditAssessment = async () => {
    console.log('🔍 [CreditAssessment] Starting loadCreditAssessment for userId:', userId);
    
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 [CreditAssessment] Making API calls...');
      
      // Load user profile and credit data
      const [userResponse, scoreResponse, limitResponse, assessmentResponse] = await Promise.allSettled([
        apiClient.get(`/api/users/${userId}`),
        apiClient.get(`/api/credit/${userId}/score`),
        apiClient.get(`/api/credit/${userId}/limit`),
        apiClient.get(`/api/credit/${userId}/assessment`)
      ]);

      console.log('🔍 [CreditAssessment] API responses received:', {
        userResponse: userResponse.status,
        scoreResponse: scoreResponse.status,
        limitResponse: limitResponse.status,
        assessmentResponse: assessmentResponse.status
      });

      // Handle user profile
      if (userResponse.status === 'fulfilled') {
        console.log('✅ [CreditAssessment] User profile loaded:', userResponse.value.data);
        // Extract the actual user data from the nested response structure
        const userData = userResponse.value.data?.user || userResponse.value.data;
        console.log('🔍 [CreditAssessment] Extracted user data:', userData);
        setUserProfile(userData);
      } else {
        console.error('❌ [CreditAssessment] User profile failed:', userResponse.reason);
        throw new Error('Failed to load user profile');
      }

      // Handle credit score
      if (scoreResponse.status === 'fulfilled') {
        console.log('✅ [CreditAssessment] Credit score loaded:', scoreResponse.value.data);
        // Extract the actual data from the nested response structure
        const scoreData = scoreResponse.value.data?.data || scoreResponse.value.data;
        console.log('🔍 [CreditAssessment] Extracted credit score data:', scoreData);
        setCreditScore(scoreData);
      } else {
        console.error('❌ [CreditAssessment] Credit score failed:', scoreResponse.reason);
        console.warn('Failed to load credit score:', scoreResponse.reason);
      }

      // Handle credit limit
      if (limitResponse.status === 'fulfilled') {
        console.log('✅ [CreditAssessment] Credit limit loaded:', limitResponse.value.data);
        // Extract the actual data from the nested response structure
        const limitData = limitResponse.value.data?.data || limitResponse.value.data;
        console.log('🔍 [CreditAssessment] Extracted credit limit data:', limitData);
        setCreditLimit(limitData);
      } else {
        console.error('❌ [CreditAssessment] Credit limit failed:', limitResponse.reason);
        console.warn('Failed to load credit limit:', limitResponse.reason);
      }

      // Handle full assessment
      if (assessmentResponse.status === 'fulfilled') {
        console.log('✅ [CreditAssessment] Full assessment loaded:', assessmentResponse.value.data);
        // Extract the actual data from the nested response structure
        const assessmentData = assessmentResponse.value.data?.data || assessmentResponse.value.data;
        console.log('🔍 [CreditAssessment] Extracted assessment data:', assessmentData);
        setAssessment(assessmentData);
      } else {
        console.error('❌ [CreditAssessment] Full assessment failed:', assessmentResponse.reason);
        console.warn('Failed to load full assessment:', assessmentResponse.reason);
      }

    } catch (err) {
      console.error('❌ [CreditAssessment] Error loading credit assessment:', err);
      console.error('❌ [CreditAssessment] Error details:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        code: err.code
      });
      
      if (err.response?.status === 404) {
        setError('User not found.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view credit information for this user.');
      } else {
        setError('Failed to load credit assessment. Please try again.');
      }
    } finally {
      setLoading(false);
      console.log('🔍 [CreditAssessment] loadCreditAssessment completed');
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const getCreditScoreColor = (score) => {
    if (score >= 750) return '#059669'; // Excellent - Green
    if (score >= 700) return '#10b981'; // Good - Light Green
    if (score >= 650) return '#d97706'; // Fair - Orange
    if (score >= 600) return '#f59e0b'; // Poor - Yellow
    return '#dc2626'; // Very Poor - Red
  };

  const getCreditScoreLabel = (score) => {
    if (score >= 750) return 'Excellent';
    if (score >= 700) return 'Good';
    if (score >= 650) return 'Fair';
    if (score >= 600) return 'Poor';
    return 'Very Poor';
  };

  const getRiskLevelColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low': return '#059669';
      case 'medium': return '#d97706';
      case 'high': return '#dc2626';
      default: return '#6b7280';
    }
  };

  // Log current state for debugging
  console.log('🔍 [CreditAssessment] Current state:', {
    loading,
    error,
    hasUserProfile: !!userProfile,
    hasCreditScore: !!creditScore,
    hasCreditLimit: !!creditLimit,
    hasAssessment: !!assessment,
    userId
  });

  if (loading) {
    console.log('🔍 [CreditAssessment] Rendering loading state');
    return (
      <>
        <Header user={user} onLogout={onLogout} />
        <div className="loading">Loading credit assessment...</div>
      </>
    );
  }

  if (error) {
    console.log('🔍 [CreditAssessment] Rendering error state:', error);
    return (
      <>
        <Header user={user} onLogout={onLogout} />
        <div className="main-content">
          <div className="container">
            <div className="card">
              <div className="alert alert-error">
                {error}
              </div>
              <Link to="/users" className="btn btn-primary">
                Back to User Lookup
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header user={user} onLogout={onLogout} />
      <div className="main-content">
        <div className="container">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                Credit Assessment: {userProfile?.firstName} {userProfile?.lastName}
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary" onClick={loadCreditAssessment}>
                  Refresh Assessment
                </button>
                <Link to={`/users/${userId}`} className="btn btn-secondary">
                  View Profile
                </Link>
                <Link to="/users" className="btn btn-secondary">
                  Back to Lookup
                </Link>
              </div>
            </div>

            {/* Credit Score Section */}
            <div className="detail-section">
              <h3>Credit Score Information</h3>
              {creditScore ? (
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Current Score</label>
                    <span style={{ 
                      color: getCreditScoreColor(creditScore.score),
                      fontWeight: '700',
                      fontSize: '1.5rem'
                    }}>
                      {creditScore.score || 'N/A'}
                    </span>
                    {/* Debug info */}
                    {console.log('🔍 [CreditAssessment] Rendering credit score:', creditScore)}
                  </div>
                  <div className="detail-item">
                    <label>Score Rating</label>
                    <span style={{ 
                      color: getCreditScoreColor(creditScore.score),
                      fontWeight: '600'
                    }}>
                      {getCreditScoreLabel(creditScore.score)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Score Date</label>
                    <span>{formatDate(creditScore.scoreDate)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Source</label>
                    <span style={{ textTransform: 'capitalize' }}>
                      {creditScore.source || 'Calculated'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="alert alert-info">
                  Credit score information is not available for this user.
                </div>
              )}
            </div>

            {/* Credit Score Factors */}
            {creditScore?.factors && (
              <div className="detail-section">
                <h3>Credit Score Factors</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Payment History</label>
                    <span>{creditScore.factors.paymentHistory}%</span>
                  </div>
                  <div className="detail-item">
                    <label>Credit Utilization</label>
                    <span>{creditScore.factors.creditUtilization}%</span>
                  </div>
                  <div className="detail-item">
                    <label>Credit Length</label>
                    <span>{creditScore.factors.creditLength}%</span>
                  </div>
                  <div className="detail-item">
                    <label>Credit Mix</label>
                    <span>{creditScore.factors.creditMix}%</span>
                  </div>
                  <div className="detail-item">
                    <label>New Credit</label>
                    <span>{creditScore.factors.newCredit}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Credit Limit Section */}
            <div className="detail-section">
              <h3>Credit Limit Assessment</h3>
              {creditLimit ? (
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Calculated Limit</label>
                    <span style={{ 
                      fontWeight: '700',
                      fontSize: '1.25rem',
                      color: '#059669'
                    }}>
                      {formatCurrency(creditLimit.calculatedLimit)}
                    </span>
                    {/* Debug info */}
                    {console.log('🔍 [CreditAssessment] Rendering credit limit:', creditLimit)}
                  </div>
                  <div className="detail-item">
                    <label>Approved Limit</label>
                    <span style={{ 
                      fontWeight: '700',
                      fontSize: '1.25rem',
                      color: '#059669'
                    }}>
                      {formatCurrency(creditLimit.approvedLimit)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Risk Level</label>
                    <span style={{ 
                      color: getRiskLevelColor(creditLimit.riskLevel),
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {creditLimit.riskLevel || 'N/A'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Calculated At</label>
                    <span>{formatDate(creditLimit.calculatedAt)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Expires At</label>
                    <span>{formatDate(creditLimit.expiresAt)}</span>
                  </div>
                </div>
              ) : (
                <div className="alert alert-info">
                  Credit limit information is not available for this user.
                </div>
              )}
            </div>

            {/* Business Rules */}
            {creditLimit?.businessRules && (
              <div className="detail-section">
                <h3>Business Rules Applied</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Income Multiplier</label>
                    <span>{creditLimit.businessRules.incomeMultiplier}x</span>
                  </div>
                  <div className="detail-item">
                    <label>Debt-to-Income Ratio</label>
                    <span>{creditLimit.businessRules.debtToIncomeRatio}%</span>
                  </div>
                  <div className="detail-item">
                    <label>Minimum Score Required</label>
                    <span>{creditLimit.businessRules.minimumScore}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Full Assessment Summary */}
            {assessment && (
              <div className="detail-section">
                <h3>Assessment Summary</h3>
                <div className="card" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Overall Recommendation</label>
                      <span style={{ 
                        fontWeight: '700',
                        color: assessment.recommendation?.approved ? '#059669' : '#dc2626'
                      }}>
                        {assessment.recommendation?.approved ? 'APPROVED' : 'DECLINED'}
                      </span>
                      {/* Debug info */}
                      {console.log('🔍 [CreditAssessment] Rendering assessment:', assessment)}
                    </div>
                    <div className="detail-item">
                      <label>Assessment Date</label>
                      <span>{formatDate(assessment.assessmentDate)}</span>
                    </div>
                  </div>
                  {assessment.notes && (
                    <div style={{ marginTop: '1rem' }}>
                      <label className="form-label">Notes</label>
                      <p style={{ 
                        padding: '0.75rem',
                        backgroundColor: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        margin: 0
                      }}>
                        {assessment.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CreditAssessment;