import React from 'react';
import { Theme } from '@/styles/oauth-authz-tokens';

interface HeaderProps {
  mode: Theme;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ mode, onToggleTheme }) => {
  return (
    <div className="oauth-authz-header">
      <h1>OAuth Made Visible + Inspector</h1>
      <label className="oauth-authz-theme-toggle">
        <span>Theme</span>
        <input type="checkbox" checked={mode === 'dark'} onChange={onToggleTheme} />
      </label>
    </div>
  );
};
