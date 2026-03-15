import React, { useState, useEffect } from 'react';
import Header from './Header';
import apiClient from '../services/apiClient';

const AdminPanel = ({ user, onLogout }) => {
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load admin data
      const [usersResponse, healthResponse] = await Promise.allSettled([
        apiClient.get('/api/admin/users'),
        apiClient.get('/api/health')
      ]);

      // Handle users data
      if (usersResponse.status === 'fulfilled') {
        const usersData = usersResponse.value.data;
        setUsers(usersData);
        
        // Calculate statistics
        const totalUsers = usersData.length;
        const activeUsers = usersData.filter(u => u.isActive).length;
        const avgCreditScore = usersData.reduce((sum, u) => sum + (u.creditScore || 600), 0) / totalUsers || 0;
        const totalCreditLimits = usersData.reduce((sum, u) => sum + (u.creditLimit || 0), 0);
        
        setStats({
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          avgCreditScore: Math.round(avgCreditScore),
          totalCreditLimits,
          highRiskUsers: usersData.filter(u => (u.creditScore || 600) < 600).length
        });
      } else {
        console.warn('Failed to load users:', usersResponse.reason);
      }

      // Handle health data
      if (healthResponse.status === 'fulfilled') {
        setSystemHealth(healthResponse.value.data);
      } else {
        console.warn('Failed to load health data:', healthResponse.reason);
      }

    } catch (err) {
      console.error('Error loading admin data:', err);
      if (err.response?.status === 403) {
        setError('You do not have admin permissions to access this panel.');
      } else {
        setError('Failed to load admin data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateCredit = async (userId) => {
    try {
      await apiClient.post(`/api/admin/credit/recalculate`, { userId });
      // Reload data to show updated values
      await loadAdminData();
      alert('Credit recalculation completed successfully.');
    } catch (err) {
      console.error('Error recalculating credit:', err);
      alert('Failed to recalculate credit. Please try again.');
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0';
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  if (loading) {
    return (
      <>
        <Header user={user} onLogout={onLogout} />
        <div className="loading">Loading admin panel...</div>
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
              <h2 className="card-title">Admin Panel</h2>
              <button className="btn btn-primary" onClick={loadAdminData}>
                Refresh Data
              </button>
            </div>

            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}

            {/* Tab Navigation */}
            <div style={{ 
              display: 'flex', 
              borderBottom: '1px solid #e2e8f0',
              marginBottom: '1.5rem'
            }}>
              <button
                className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('overview')}
                style={{ borderRadius: '0', borderBottom: 'none' }}
              >
                Overview
              </button>
              <button
                className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('users')}
                style={{ borderRadius: '0', borderBottom: 'none' }}
              >
                User Management
              </button>
              <button
                className={`btn ${activeTab === 'system' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('system')}
                style={{ borderRadius: '0', borderBottom: 'none' }}
              >
                System Health
              </button>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-value">{stats.totalUsers || 0}</div>
                    <div className="stat-label">Total Users</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{stats.activeUsers || 0}</div>
                    <div className="stat-label">Active Users</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{stats.avgCreditScore || 0}</div>
                    <div className="stat-label">Avg Credit Score</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{formatCurrency(stats.totalCreditLimits)}</div>
                    <div className="stat-label">Total Credit Limits</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value" style={{ color: '#dc2626' }}>
                      {stats.highRiskUsers || 0}
                    </div>
                    <div className="stat-label">High Risk Users</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value" style={{ color: '#6b7280' }}>
                      {stats.inactiveUsers || 0}
                    </div>
                    <div className="stat-label">Inactive Users</div>
                  </div>
                </div>
              </>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="detail-section">
                <h3>User Management</h3>
                {users.length > 0 ? (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Status</th>
                          <th>Credit Score</th>
                          <th>Credit Limit</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((userData) => (
                          <tr key={userData.id}>
                            <td>{userData.id}</td>
                            <td>{userData.firstName} {userData.lastName}</td>
                            <td>{userData.email}</td>
                            <td>
                              <span style={{ 
                                color: userData.isActive ? '#059669' : '#dc2626',
                                fontWeight: '500'
                              }}>
                                {userData.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              <span style={{ 
                                color: userData.creditScore >= 700 ? '#059669' : 
                                       userData.creditScore >= 600 ? '#d97706' : '#dc2626'
                              }}>
                                {userData.creditScore || 'N/A'}
                              </span>
                            </td>
                            <td>{formatCurrency(userData.creditLimit)}</td>
                            <td>{formatDate(userData.createdAt)}</td>
                            <td>
                              <button
                                className="btn btn-success"
                                onClick={() => handleRecalculateCredit(userData.id)}
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                              >
                                Recalculate
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state">
                    <h3>No Users Found</h3>
                    <p>No user data available.</p>
                  </div>
                )}
              </div>
            )}

            {/* System Health Tab */}
            {activeTab === 'system' && (
              <div className="detail-section">
                <h3>System Health</h3>
                {systemHealth ? (
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Status</label>
                      <span style={{ 
                        color: systemHealth.status === 'healthy' ? '#059669' : '#dc2626',
                        fontWeight: '600'
                      }}>
                        {systemHealth.status?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>Uptime</label>
                      <span>{systemHealth.uptime || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Version</label>
                      <span>{systemHealth.version || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Environment</label>
                      <span style={{ textTransform: 'capitalize' }}>
                        {systemHealth.environment || 'N/A'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>Database</label>
                      <span style={{ 
                        color: systemHealth.database?.status === 'connected' ? '#059669' : '#dc2626'
                      }}>
                        {systemHealth.database?.status?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>OAuth Provider</label>
                      <span style={{ 
                        color: systemHealth.oauth?.status === 'connected' ? '#059669' : '#dc2626'
                      }}>
                        {systemHealth.oauth?.status?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-info">
                    System health information is not available.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminPanel;