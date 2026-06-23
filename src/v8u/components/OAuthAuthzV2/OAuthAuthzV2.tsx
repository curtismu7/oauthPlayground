import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './ThemeContext';
import { OAuthAuthzLayout } from './OAuthAuthzLayout';
import { AuthConfigProvider } from '../../../contexts/AuthConfigContext';
import './styles/layout.css';

/**
 * OAuthAuthzV2 — New unified OAuth authorization UI
 * Option D hybrid design: Config | Protocol | Inspector
 * Supports light/dark mode
 */
export const OAuthAuthzV2: React.FC = () => {
  return (
    <AuthConfigProvider>
      <ThemeProvider>
        <OAuthAuthzV2Inner />
      </ThemeProvider>
    </AuthConfigProvider>
  );
};

const OAuthAuthzV2Inner: React.FC = () => {
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
      <OAuthAuthzLayout />
    </div>
  );
};

export default OAuthAuthzV2;
