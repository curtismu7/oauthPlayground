import { Outlet } from 'react-router-dom';

const Flows = () => {
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>OAuth 2.0 Flows</h1>
      <p>Select an OAuth 2.0 flow to learn how it works and test it with your PingOne environment.</p>

      <div style={{ marginTop: '2rem' }}>
        <h2>Available Flows</h2>
        <ul>
          <li>Authorization Code Flow</li>
          <li>Implicit Flow</li>
          <li>Client Credentials Flow</li>
          <li>PKCE Flow</li>
          <li>Device Code Flow</li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default Flows;
