import React, { createContext, useContext, useEffect, useState } from 'react';
import { tokens, type Theme } from '@/styles/oauth-authz-tokens';

interface ThemeContextType {
  mode: Theme;
  toggle: () => void;
  tokens: typeof tokens;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check localStorage first
    const savedMode = localStorage.getItem('oauth-authz-theme') as Theme | null;
    if (savedMode) {
      setMode(savedMode);
      applyTheme(savedMode);
      setMounted(true);
      return;
    }

    // Fall back to system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialMode: Theme = prefersDark ? 'dark' : 'light';
    setMode(initialMode);
    applyTheme(initialMode);
    setMounted(true);
  }, []);

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    const colors = tokens.colors[theme];

    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--oauth-authz-${key}`, value);
    });

    root.style.setProperty('--oauth-authz-current-theme', theme);
  };

  const toggle = () => {
    const newMode: Theme = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('oauth-authz-theme', newMode);
    applyTheme(newMode);
  };

  if (!mounted) return null;

  return (
    <ThemeContext.Provider value={{ mode, toggle, tokens }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};