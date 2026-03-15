import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import apiClient from '../services/apiClient';
import { LoadingContainer, SectionLoader } from './LoadingComponents';
import { FallbackRouter } from './FallbackComponents';
import { useApiErrorHandling } from '../hooks/useErrorHandling';
const Dashboard = ({ user, onLogout }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    averageCreditScore: 0,
    totalCreditLimits: 0,
    recentAssessments: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { error, executeWithErrorHandling, clearError } = useApiErrorHandling({
    maxRetries: 2,
    onError: (error) => {
      console.error('Dashboard error:', error);
    }
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    await executeWithErrorHandling(async () => {
      setLoading(true);
      clearError();

      // Load dashboard statistics
      const usersResponse = await apiClient.get('/api/users');

      const users = usersResponse.data.users || [];
      
      // Calculate basic statistics
      const totalUsers = users.length;
      const averageCreditScore = totalUsers > 0 ? users.reduce((sum, user) => sum + (user.creditScore || 600), 0) / totalUsers : 0;
      const totalCreditLimits = users.reduce((sum, user) => sum + (user.creditLimit || 5000), 0);

      setStats({
        totalUsers,
        averageCreditScore: Math.round(averageCreditScore),
        totalCreditLimits,
        recentAssessments: Math.floor(totalUsers * 0.3) // Simulate recent assessments
      });

      // Simulate recent activity (in a real app, this would come from an activity log API)
      setRecentActivity([
        {
          id: 1,
          type: 'Credit Assessment',
          user: 'John Doe',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          result: 'Approved - $15,000 limit'
        },
        {
          id: 2,
          type: 'User Lookup',
          user: 'Jane Smith',
          timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
          result: 'Profile viewed'
        },
        {
          id: 3,
          type: 'Credit Score Update',
          user: 'Bob Johnson',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          result: 'Score: 720 (+15)'
        }
      ]);

      setLoading(false);
    }, {
      customMessage: 'Failed to load dashboard data'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <>
      <Header user={user} onLogout={onLogout} />
      <div className="main-content">
        <div className="container">
          <LoadingContainer
            isLoading={loading}
            error={error}
            loadingMessage="Loading dashboard data..."
            errorComponent={
              <FallbackRouter 
                error={error} 
                onRetry={loadDashboardData}
                className="dashboard-error"
              />
            }
          >
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Lending Dashboard</h2>
                <button className="btn btn-primary" onClick={loadDashboardData}>
                  Refresh
                </button>
              </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{stats.totalUsers}</div>
                <div className="stat-label">Total Users</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.averageCreditScore}</div>
                <div className="stat-label">Average Credit Score</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{formatCurrency(stats.totalCreditLimits)}</div>
                <div className="stat-label">Total Credit Limits</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.recentAssessments}</div>
                <div className="stat-label">Recent Assessments</div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Quick Actions</h3>
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Link to="/users" className="btn btn-primary">
                  Look Up User
                </Link>
                <Link to="/users" className="btn btn-secondary">
                  Browse All Users
                </Link>
                {user?.role === 'admin' && (
                  <Link to="/admin" className="btn btn-success">
                    Admin Panel
                  </Link>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Recent Activity</h3>
              </div>
              {recentActivity.length > 0 ? (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>User</th>
                        <th>Time</th>
                        <th>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentActivity.map((activity) => (
                        <tr key={activity.id}>
                          <td>{activity.type}</td>
                          <td>{activity.user}</td>
                          <td>{formatDate(activity.timestamp)}</td>
                          <td>{activity.result}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <h3>No Recent Activity</h3>
                  <p>Start by looking up a user or performing a credit assessment.</p>
                </div>
              )}
            </div>
            </div>
          </LoadingContainer>
        </div>
      </div>
    </>
  );
};

export default Dashboard;