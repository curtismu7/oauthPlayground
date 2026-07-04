import React from 'react';
import { ThemeProvider, useTheme } from '../OAuthAuthzV2/ThemeContext';
import { AuthCodeFlowLayout } from './AuthCodeFlowLayout';
import '../OAuthAuthzV2/styles/layout.css';

export const AuthCodeFlowV2: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthCodeFlowV2Inner />
    </ThemeProvider>
  );
};

const AuthCodeFlowV2Inner: React.FC = () => {
  const { mode } = useTheme();

  return (
    <div
      data-theme={mode}
      style={{
        height: '100%',
        background: `var(--oauth-authz-bgPrimary)`,
        color: `var(--oauth-authz-textPrimary)`,
      }}
    >
      <AuthCodeFlowLayout />
    </div>
  );
};

export default AuthCodeFlowV2;
