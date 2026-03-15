import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import apiClient from '../services/apiClient';
import { LoadingContainer } from './LoadingComponents';
import { FallbackRouter, EmptyStateFallback } from './FallbackComponents';
import { useApiErrorHandling } from '../hooks/useErrorHandling';
const UserLookup = ({ user, onLogout }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  const { error, executeWithErrorHandling, clearError } = useApiErrorHandling({
    maxRetries: 2,
    onError: (error) => {
      console.error('User lookup error:', error);
    }
  });

  useEffect(() => {
    loadUsers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Filter users based on search term
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const loadUsers = async () => {
    await executeWithErrorHandling(async () => {
      setLoading(true);
      clearError();

      const response = await apiClient.get('/api/users');
      const users = response.data.users || [];
      setUsers(users);
      setFilteredUsers(users);
      
      setLoading(false);
    }, {
      customMessage: 'Failed to load users. Please check your permissions and try again.'
    });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <>
      <Header user={user} onLogout={onLogout} />
      <div className="main-content">
        <div className="container">
          <LoadingContainer
            isLoading={loading}
            error={error}
            loadingMessage="Loading users..."
            errorComponent={
              <FallbackRouter 
                error={error} 
                onRetry={loadUsers}
                className="user-lookup-error"
              />
            }
          >
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">User Lookup</h2>
                <button className="btn btn-primary" onClick={loadUsers}>
                  Refresh
                </button>
              </div>

            <div className="form-group">
              <label className="form-label">Search Users</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search by name, email, or ID..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                {searchTerm && (
                  <button className="btn btn-secondary" onClick={clearSearch}>
                    Clear
                  </button>
                )}
              </div>
            </div>

            {filteredUsers.length > 0 ? (
              <>
                <div style={{ marginBottom: '1rem', color: '#64748b' }}>
                  Showing {filteredUsers.length} of {users.length} users
                </div>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Credit Score</th>
                        <th>Credit Limit</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((userData) => (
                        <tr key={userData.id} className="clickable">
                          <td>{userData.id}</td>
                          <td>{userData.firstName} {userData.lastName}</td>
                          <td>{userData.email}</td>
                          <td>
                            <span style={{ 
                              color: userData.creditScore >= 700 ? '#059669' : 
                                     userData.creditScore >= 600 ? '#d97706' : '#dc2626'
                            }}>
                              {userData.creditScore || 'N/A'}
                            </span>
                          </td>
                          <td>
                            {userData.creditLimit ? 
                              new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                minimumFractionDigits: 0
                              }).format(userData.creditLimit) : 
                              'N/A'
                            }
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <Link 
                                to={`/users/${userData.id}`} 
                                className="btn btn-primary"
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                              >
                                View Profile
                              </Link>
                              <Link 
                                to={`/credit/${userData.id}`} 
                                className="btn btn-success"
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                              >
                                Credit Assessment
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <EmptyStateFallback
                title="No Users Found"
                message={
                  searchTerm ? 
                    `No users match "${searchTerm}". Try a different search term.` :
                    'No users available. Please check your permissions or contact your administrator.'
                }
                actionText={searchTerm ? "Show All Users" : null}
                onAction={searchTerm ? clearSearch : null}
                icon="👥"
              />
            )}
            </div>
          </LoadingContainer>
        </div>
      </div>
    </>
  );
};

export default UserLookup;