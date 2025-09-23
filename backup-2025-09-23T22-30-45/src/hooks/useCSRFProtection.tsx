import React from 'react';
import { csrfProtection } from '../utils/csrfProtection';

// React hook for CSRF protection
export const useCSRFProtection = () => {
  const [token, setToken] = React.useState<string>('');

  React.useEffect(() => {
    const currentToken = csrfProtection.getToken();
    setToken(currentToken || '');

    // Set up token refresh listener
    const interval = setInterval(() => {
      const newToken = csrfProtection.getToken();
      if (newToken !== token) {
        setToken(newToken || '');
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [token]);

  return {
    token,
    getToken: csrfProtection.getToken.bind(csrfProtection),
    validateToken: csrfProtection.validateToken.bind(csrfProtection),
    generateToken: csrfProtection.generateToken.bind(csrfProtection)
  };
};

// Higher-order component for CSRF protection
export const withCSRFProtection = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  const WithCSRFProtection = (props: P) => {
    const { token } = useCSRFProtection();

    return (
      <div data-csrf-token={token}>
        <WrappedComponent {...props} />
      </div>
    );
  };

  WithCSRFProtection.displayName = `withCSRFProtection(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithCSRFProtection;
};

export default useCSRFProtection;
