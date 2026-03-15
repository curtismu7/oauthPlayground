import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import GearIcon from './GearIcon';
import { fetchOAuthTokenData } from '../services/tokenUtils';

const Header = ({ user, onLogout }) => {
  const location = useLocation();
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [tokenData, setTokenData] = useState(null);
  const [isLoadingToken, setIsLoadingToken] = useState(false);
  const [tokenError, setTokenError] = useState(null);

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const openTokenModal = async () => {
    setIsTokenModalOpen(true);
    setIsLoadingToken(true);
    setTokenError(null);
    
    try {
      console.log('🔍 [Header] Fetching OAuth token data...');
      const data = await fetchOAuthTokenData();
      setTokenData(data);
      console.log('✅ [Header] Token data loaded successfully');
    } catch (error) {
      console.error('❌ [Header] Failed to fetch token data:', error);
      setTokenError(error.message);
    } finally {
      setIsLoadingToken(false);
    }
  };

  const closeTokenModal = () => {
    setIsTokenModalOpen(false);
    setTokenData(null);
    setTokenError(null);
  };

  return (
    <>
    <header className="header">
      <div className="container">
        <div className="header-content">
          <h1>Lending Platform</h1>
          
          <nav className="nav">
            <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') || isActive('/')}`}>
              Dashboard
            </Link>
            <Link to="/users" className={`nav-link ${isActive('/users')}`}>
              User Lookup
            </Link>
            {user?.role === 'admin' && (
              <Link to="/admin" className={`nav-link ${isActive('/admin')}`}>
                Admin
              </Link>
            )}
          </nav>

          <div className="user-info">
            <span>Welcome, {user?.name || user?.email || 'User'}</span>
            <button 
              className="gear-button" 
              onClick={openTokenModal}
              title="View OAuth Token Info"
              aria-label="View OAuth Token Info"
            >
              <GearIcon width={16} height={16} />
            </button>
            <button className="btn btn-secondary" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>

    {/* OAuth Token Modal */}
    {isTokenModalOpen && (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}
        onClick={closeTokenModal}
      >
        <div 
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div style={{
            padding: '20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.5rem' }}>
              OAuth Token Information
            </h2>
            <button 
              onClick={closeTokenModal}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#6b7280',
                padding: '0',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              aria-label="Close modal"
            >
              ×
            </button>
          </div>

          {/* Modal Content */}
          <div style={{ padding: '20px' }}>
            {isLoadingToken ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ 
                  display: 'inline-block',
                  width: '40px',
                  height: '40px',
                  border: '4px solid #f3f3f3',
                  borderTop: '4px solid #059669',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginBottom: '16px'
                }}></div>
                <p style={{ color: '#6b7280', margin: 0 }}>Loading token data...</p>
              </div>
            ) : tokenError ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#ef4444'
              }}>
                <p style={{ fontSize: '18px', marginBottom: '8px' }}>❌ Error</p>
                <p style={{ margin: 0 }}>{tokenError}</p>
              </div>
            ) : tokenData ? (
              <div>
                {/* Session Information */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ 
                    color: '#1e293b', 
                    marginBottom: '12px',
                    fontSize: '1.125rem',
                    borderBottom: '2px solid #059669',
                    paddingBottom: '4px',
                    display: 'inline-block'
                  }}>
                    Session Information
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    backgroundColor: '#f8fafc',
                    padding: '16px',
                    borderRadius: '6px'
                  }}>
                    <div>
                      <strong style={{ color: '#374151' }}>User:</strong>
                      <div style={{ color: '#6b7280' }}>
                        {tokenData.user?.name || tokenData.user?.email || 'Unknown'}
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: '#374151' }}>Role:</strong>
                      <div style={{ color: '#6b7280' }}>
                        {tokenData.user?.role || 'Unknown'}
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: '#374151' }}>Provider:</strong>
                      <div style={{ color: '#6b7280' }}>
                        {tokenData.oauthProvider || 'Unknown'}
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: '#374151' }}>Client Type:</strong>
                      <div style={{ color: '#6b7280' }}>
                        {tokenData.clientType || 'Unknown'}
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: '#374151' }}>Token Type:</strong>
                      <div style={{ color: '#6b7280' }}>
                        {tokenData.tokenType || 'Bearer'}
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: '#374151' }}>Expires At:</strong>
                      <div style={{ color: '#6b7280' }}>
                        {tokenData.expiresAt ? new Date(tokenData.expiresAt).toLocaleString() : 'Unknown'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Token Header */}
                {tokenData.accessToken?.header && (
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ 
                      color: '#1e293b', 
                      marginBottom: '12px',
                      fontSize: '1.125rem',
                      borderBottom: '2px solid #059669',
                      paddingBottom: '4px',
                      display: 'inline-block'
                    }}>
                      Token Header
                    </h3>
                    <pre style={{
                      backgroundColor: '#f8fafc',
                      padding: '16px',
                      borderRadius: '6px',
                      overflow: 'auto',
                      fontSize: '14px',
                      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                      border: '1px solid #e2e8f0',
                      margin: 0
                    }}>
                      {JSON.stringify(tokenData.accessToken.header, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Token Payload */}
                {tokenData.accessToken?.payload && (
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ 
                      color: '#1e293b', 
                      marginBottom: '12px',
                      fontSize: '1.125rem',
                      borderBottom: '2px solid #059669',
                      paddingBottom: '4px',
                      display: 'inline-block'
                    }}>
                      Token Payload
                    </h3>
                    <pre style={{
                      backgroundColor: '#f8fafc',
                      padding: '16px',
                      borderRadius: '6px',
                      overflow: 'auto',
                      fontSize: '14px',
                      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                      border: '1px solid #e2e8f0',
                      margin: 0
                    }}>
                      {JSON.stringify(tokenData.accessToken.payload, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Raw Token */}
                {tokenData.accessToken?.raw && (
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ 
                      color: '#1e293b', 
                      marginBottom: '12px',
                      fontSize: '1.125rem',
                      borderBottom: '2px solid #059669',
                      paddingBottom: '4px',
                      display: 'inline-block'
                    }}>
                      Raw Access Token
                    </h3>
                    <textarea
                      readOnly
                      value={tokenData.accessToken.raw}
                      style={{
                        width: '100%',
                        height: '120px',
                        backgroundColor: '#f8fafc',
                        padding: '16px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        fontSize: '14px',
                        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                        resize: 'vertical',
                        wordBreak: 'break-all'
                      }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <p>No OAuth token data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
  </>
  );
};

export default Header;