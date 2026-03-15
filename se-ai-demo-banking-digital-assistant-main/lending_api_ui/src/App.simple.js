import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [apiStatus, setApiStatus] = useState('checking');
  const [apiData, setApiData] = useState(null);

  useEffect(() => {
    checkApiConnection();
  }, []);

  const checkApiConnection = async () => {
    try {
      console.log('🔍 Checking API connection...');
      const response = await fetch('/health');
      const data = await response.json();
      
      console.log('✅ API Response:', data);
      setApiData(data);
      setApiStatus(response.ok ? 'connected' : 'error');
    } catch (error) {
      console.error('❌ API Connection Error:', error);
      setApiStatus('error');
    }
  };

  const handleLogin = () => {
    console.log('🔐 Starting OAuth login...');
    window.location.href = '/api/auth/oauth/login';
  };

  return (
    <div className="App">
      <header style={{ 
        background: '#1f2937', 
        color: 'white', 
        padding: '1rem',
        textAlign: 'center'
      }}>
        <h1>🏦 Consumer Lending Service</h1>
        <p>Secure Credit Assessment Platform</p>
      </header>

      <main style={{ 
        padding: '2rem',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <div style={{
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h2>🔌 API Connection Status</h2>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <span style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: apiStatus === 'connected' ? '#10b981' : 
                             apiStatus === 'error' ? '#ef4444' : '#f59e0b'
            }}></span>
            <span style={{ fontWeight: 'bold' }}>
              {apiStatus === 'connected' ? 'Connected' : 
               apiStatus === 'error' ? 'Connection Error' : 'Checking...'}
            </span>
          </div>
          
          {apiData && (
            <div style={{ 
              background: 'white',
              padding: '1rem',
              borderRadius: '4px',
              border: '1px solid #d1d5db'
            }}>
              <h3>API Health Status</h3>
              <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                <li>Status: <strong>{apiData.status}</strong></li>
                <li>Service: <strong>{apiData.service}</strong></li>
                <li>Uptime: <strong>{Math.floor(apiData.uptime / 60)} minutes</strong></li>
                <li>Checks: <strong>{apiData.checks?.length || 0} components</strong></li>
              </ul>
            </div>
          )}
          
          <button 
            onClick={checkApiConnection}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔄 Refresh Status
          </button>
        </div>

        <div style={{
          background: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '8px',
          padding: '1.5rem'
        }}>
          <h2>🔐 Authentication</h2>
          <p>
            Access the lending platform using secure OAuth authentication.
            This ensures your data is protected with enterprise-grade security.
          </p>
          
          <button 
            onClick={handleLogin}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🚀 Sign In with OAuth
          </button>
        </div>

        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: '#fffbeb',
          border: '1px solid #f59e0b',
          borderRadius: '8px'
        }}>
          <h3>🧪 Testing Information</h3>
          <p><strong>API Server:</strong> http://localhost:3002</p>
          <p><strong>UI Application:</strong> http://localhost:3003</p>
          <p><strong>Health Check:</strong> <a href="/health" target="_blank">/health</a></p>
          <p><strong>API Documentation:</strong> <a href="/api/docs" target="_blank">/api/docs</a></p>
        </div>
      </main>

      <footer style={{
        background: '#f3f4f6',
        padding: '1rem',
        textAlign: 'center',
        marginTop: '2rem',
        borderTop: '1px solid #e5e7eb'
      }}>
        <p>
          Consumer Lending Service v1.0.0 | 
          Powered by OAuth 2.0 & React
        </p>
      </footer>
    </div>
  );
}

export default App;