import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from './Header';
import apiClient from '../services/apiClient';

const UserProfile = ({ user, onLogout }) => {
  const { userId } = useParams();
  const [userProfile, setUserProfile] = useState(null);
  const [creditInfo, setCreditInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log('🔍 [UserProfile] Component initialized:', { userId });

  useEffect(() => {
    if (userId) {
      loadUserProfile();
    }
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUserProfile = async () => {
    console.log('🔍 [UserProfile] Loading user profile for userId:', userId);
    
    try {
      setLoading(true);
      setError(null);

      // Load user profile and credit summary in parallel
      const [userResponse, summaryResponse] = await Promise.allSettled([
        apiClient.get(`/api/users/${userId}`),
        apiClient.get(`/api/users/${userId}/summary`)
      ]);

      console.log('🔍 [UserProfile] API responses:', {
        userResponse: userResponse.status,
        summaryResponse: summaryResponse.status
      });

      // Handle user profile
      if (userResponse.status === 'fulfilled') {
        const userData = userResponse.value.data?.user || userResponse.value.data;
        console.log('✅ [UserProfile] User profile loaded:', userData);
        setUserProfile(userData);
      } else {
        console.error('❌ [UserProfile] User profile failed:', userResponse.reason);
        throw new Error('Failed to load user profile');
      }

      // Handle credit summary (optional - don't fail if this doesn't work)
      if (summaryResponse.status === 'fulfilled') {
        const summaryData = summaryResponse.value.data?.summary || summaryResponse.value.data;
        console.log('✅ [UserProfile] Credit summary loaded:', summaryData);
        setCreditInfo(summaryData?.creditInfo);
      } else {
        console.warn('⚠️ [UserProfile] Credit summary failed:', summaryResponse.reason);
        // Don't set error - credit info is optional for user profile
      }

    } catch (err) {
      console.error('❌ [UserProfile] Error loading user profile:', err);
      if (err.response?.status === 404) {
        setError('User not found.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view this user profile.');
      } else {
        setError('Failed to load user profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(dateString));
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const maskSSN = (ssn) => {
    if (!ssn) return 'N/A';
    return `***-**-${ssn.slice(-4)}`;
  };

  if (loading) {
    return (
      <>
        <Header user={user} onLogout={onLogout} />
        <div className="loading">Loading user profile...</div>
      </>
    );
  }

  if (error) {
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

  if (!userProfile) {
    return (
      <>
        <Header user={user} onLogout={onLogout} />
        <div className="main-content">
          <div className="container">
            <div className="empty-state">
              <h3>User Not Found</h3>
              <p>The requested user profile could not be found.</p>
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
                User Profile: {userProfile.firstName} {userProfile.lastName}
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link 
                  to={`/credit/${userId}`} 
                  className="btn btn-success"
                >
                  Credit Assessment
                </Link>
                <Link to="/users" className="btn btn-secondary">
                  Back to Lookup
                </Link>
              </div>
            </div>

            <div className="detail-section">
              <h3>Personal Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>User ID</label>
                  <span>{userProfile.id}</span>
                </div>
                <div className="detail-item">
                  <label>First Name</label>
                  <span>{userProfile.firstName || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Last Name</label>
                  <span>{userProfile.lastName || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Email</label>
                  <span>{userProfile.email || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Phone</label>
                  <span>{userProfile.phone || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Date of Birth</label>
                  <span>{formatDate(userProfile.dateOfBirth)}</span>
                </div>
                <div className="detail-item">
                  <label>SSN</label>
                  <span>{maskSSN(userProfile.ssn)}</span>
                </div>
                <div className="detail-item">
                  <label>Status</label>
                  <span style={{ 
                    color: userProfile.isActive ? '#059669' : '#dc2626',
                    fontWeight: '500'
                  }}>
                    {userProfile.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {userProfile.address && (
              <div className="detail-section">
                <h3>Address Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Street</label>
                    <span>{userProfile.address.street || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>City</label>
                    <span>{userProfile.address.city || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>State</label>
                    <span>{userProfile.address.state || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>ZIP Code</label>
                    <span>{userProfile.address.zipCode || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}

            {userProfile.employment && (
              <div className="detail-section">
                <h3>Employment Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Employer</label>
                    <span>{userProfile.employment.employer || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Position</label>
                    <span>{userProfile.employment.position || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Annual Income</label>
                    <span>{formatCurrency(userProfile.employment.annualIncome)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Employment Length</label>
                    <span>
                      {userProfile.employment.employmentLength ? 
                        `${userProfile.employment.employmentLength} months` : 
                        'N/A'
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="detail-section">
              <h3>Account Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Created</label>
                  <span>{formatDate(userProfile.createdAt)}</span>
                </div>
                <div className="detail-item">
                  <label>Last Updated</label>
                  <span>{formatDate(userProfile.updatedAt)}</span>
                </div>
                <div className="detail-item">
                  <label>Current Credit Score</label>
                  <span style={{ 
                    color: creditInfo?.score >= 700 ? '#059669' : 
                           creditInfo?.score >= 600 ? '#d97706' : '#dc2626',
                    fontWeight: '600',
                    fontSize: '1.1rem'
                  }}>
                    {creditInfo?.score || 'Not Available'}
                  </span>
                  {console.log('🔍 [UserProfile] Rendering credit score:', creditInfo?.score)}
                </div>
                <div className="detail-item">
                  <label>Current Credit Limit</label>
                  <span style={{ 
                    fontWeight: '600',
                    fontSize: '1.1rem',
                    color: '#059669'
                  }}>
                    {formatCurrency(creditInfo?.approvedLimit)}
                  </span>
                  {console.log('🔍 [UserProfile] Rendering credit limit:', creditInfo?.approvedLimit)}
                </div>
                {creditInfo?.riskLevel && (
                  <div className="detail-item">
                    <label>Risk Level</label>
                    <span style={{ 
                      color: creditInfo.riskLevel === 'low' ? '#059669' : 
                             creditInfo.riskLevel === 'medium' ? '#d97706' : '#dc2626',
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {creditInfo.riskLevel}
                    </span>
                  </div>
                )}
                {creditInfo?.scoreDate && (
                  <div className="detail-item">
                    <label>Score Date</label>
                    <span>{formatDate(creditInfo.scoreDate)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserProfile;