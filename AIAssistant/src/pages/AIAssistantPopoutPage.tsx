/**
 * Popout window page — renders the AI Assistant in full-page mode inside a
 * standalone browser window.  Opened by the ⊞ button in the chat header.
 */

import React from 'react';
import { createGlobalStyle } from 'styled-components';
import AIAssistant from '../components/AIAssistant';

const GlobalStyle = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; }
  html, body, #root {
    height: 100%;
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f0f2f5;
    overflow: hidden;
  }
`;

const AIAssistantPopoutPage: React.FC = () => (
  <>
    <GlobalStyle />
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AIAssistant fullPage onClose={() => window.close()} />
    </div>
  </>
);

export default AIAssistantPopoutPage;
