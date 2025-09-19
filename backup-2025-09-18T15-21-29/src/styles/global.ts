 
import { createGlobalStyle } from 'styled-components';

export const theme = {
  colors: {
    primary: '#003087',
    primaryLight: '#334d99',
    primaryDark: '#001a4d',
    secondary: '#ff4d4d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40',
    gray100: '#f8f9fa',
    gray200: '#e9ecef',
    gray300: '#dee2e6',
    gray400: '#ced4da',
    gray500: '#adb5bd',
    gray600: '#6c757d',
    gray700: '#495057',
    gray800: '#343a40',
    gray900: '#212529',
  },
  fonts: {
    body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    heading: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    monospace: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  shadows: {
    sm: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
    md: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
    lg: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
};

export const GlobalStyle = createGlobalStyle`
  :root {
    /* Design Tokens for Spec Cards */
    --card-bg: #ffffff;
    --card-fg: #111111;
    --card-border: #E5E7EB;
    --card-muted: #525252;
    --code-bg: #f6f8fa;
    --code-fg: #0f172a;
    --card-radius: 12px;
    --card-padding: 16px;
    --card-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  }

  /* Dark mode - Keep accessible contrast */
  .dark :root {
    --card-bg: #ffffff;
    --card-fg: #111111;
    --card-border: #E5E7EB;
    --card-muted: #404040;
    --code-bg: #f6f8fa;
    --code-fg: #0f172a;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    font-size: 16px;
    height: 100%;
  }

  body {
    font-family: ${({ theme }) => theme.fonts.body};
    line-height: 1.5;
    color: ${({ theme }) => theme.colors.gray900};
    background-color: ${({ theme }) => theme.colors.gray100};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    height: 100%;
  }

  #root {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  h1, h2, h3, h4, h5, h6 {
    margin-bottom: 0.5rem;
    font-weight: 600;
    line-height: 1.2;
    color: ${({ theme }) => theme.colors.gray900};
  }

  h1 { font-size: 2.5rem; }
  h2 { font-size: 2rem; }
  h3 { font-size: 1.75rem; }
  h4 { font-size: 1.5rem; }
  h5 { font-size: 1.25rem; }
  h6 { font-size: 1rem; }

  a {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: none;
    transition: color 0.2s ease-in-out;

    &:hover {
      color: ${({ theme }) => theme.colors.primaryLight};
      text-decoration: underline;
    }
  }

  button, input, select, textarea {
    font-family: inherit;
    font-size: 1rem;
  }

  code {
    font-family: ${({ theme }) => theme.fonts.monospace};
    background-color: ${({ theme }) => theme.colors.gray200};
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-size: 0.9em;
  }

  pre {
    background-color: ${({ theme }) => theme.colors.gray900};
    color: ${({ theme }) => theme.colors.gray100};
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
    font-family: ${({ theme }) => theme.fonts.monospace};
    font-size: 0.9rem;
    line-height: 1.5;
    margin: 1rem 0;

    code {
      background-color: transparent;
      padding: 0;
      border-radius: 0;
      font-size: inherit;
    }
  }

  /* JWT Token Display - Clean and readable styling */
  pre[class*="TokenValue"] {
    background-color: rgba(255, 255, 255, 0.95) !important;
    color: #000000 !important;
  }

  /* Ensure token containers have proper text contrast */
  div[class*="TokenContainer"] pre,
  div[class*="TokenSection"] pre {
    background-color: rgba(255, 255, 255, 0.95) !important;
    color: #000000 !important;
  }

  /* Spinner animation */
  .animate-spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;
