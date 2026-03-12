/**
 * Standalone AI Assistant App
 * Full-page layout: AI chat on the left, OAuth Login Panel on the right.
 * Routes: / (Assistant + OAuth panel), /configuration (API keys), /callback (OAuth redirect)
 */

import React, { useCallback, useState } from 'react';
import {
	BrowserRouter,
	Route,
	Routes,
	useNavigate,
	useLocation,
} from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import AIAssistant from './components/AIAssistant';
import { ApiKeyConfiguration } from './components/ApiKeyConfiguration';
import { OAuthLoginPanel } from './components/OAuthLoginPanel';
import AIAssistantPopoutPage from './pages/AIAssistantPopoutPage';

// ─── Global Styles ────────────────────────────────────────────────────────────

const GlobalStyle = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; }
  html, body, #root {
    height: 100%;
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f0f2f5;
  }
`;

// ─── OAuth Callback Page ──────────────────────────────────────────────────────

const CallbackPage: React.FC = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const params = Object.fromEntries(new URLSearchParams(location.search));
	const hashParams: Record<string, string> = {};
	if (location.hash) {
		location.hash.slice(1).split('&').forEach((pair) => {
			const [k, v] = pair.split('=');
			if (k) hashParams[decodeURIComponent(k)] = decodeURIComponent(v ?? '');
		});
	}
	const all = { ...params, ...hashParams };

	return (
		<CallbackRoot>
			<CallbackCard>
				<CallbackIcon>✅</CallbackIcon>
				<CallbackTitle>OAuth Callback Received</CallbackTitle>
				<CallbackSubtitle>
					{all.code ? 'Authorization code received — you can now exchange it for tokens.' : all.access_token ? 'Access token received (implicit flow).' : 'Callback processed.'}
				</CallbackSubtitle>
				<CallbackTable>
					{Object.entries(all).map(([k, v]) => (
						<CallbackRow key={k}>
							<CallbackKey>{k}</CallbackKey>
							<CallbackVal>{v}</CallbackVal>
						</CallbackRow>
					))}
				</CallbackTable>
				<CallbackBack onClick={() => navigate('/')}>← Back to Assistant</CallbackBack>
			</CallbackCard>
		</CallbackRoot>
	);
};

// ─── Main App Layout ─────────────────────────────────────────────────────────

interface OAuthPrefill {
	authUrl: string;
	redirectUri: string;
}

const MainPage: React.FC = () => {
	const [oauthOpen, setOauthOpen] = useState(false);
	const [oauthPrefill, setOauthPrefill] = useState<OAuthPrefill | null>(null);
	const navigate = useNavigate();

	const handleStartOAuthFlow = useCallback((params: OAuthPrefill) => {
		setOauthPrefill(params);
		setOauthOpen(true);
	}, []);

	return (
		<AppShell>
			{/* Top nav bar */}
			<TopBar>
				<Logo>🤖 OAuth AI Assistant</Logo>
				<NavActions>
					<NavBtn onClick={() => setOauthOpen((v) => !v)} $active={oauthOpen}>
						🔐 OAuth Login
					</NavBtn>
					<NavBtn onClick={() => navigate('/configuration')} $active={false}>
						⚙️ Configuration
					</NavBtn>
				</NavActions>
			</TopBar>

			{/* Main pane */}
			<MainRow>
				{/* Left: AI Assistant — fills available height */}
				<AssistantPane>
					<AIAssistant fullPage onStartOAuthFlow={handleStartOAuthFlow} />
				</AssistantPane>

				{/* Right: OAuth Login Panel — slides in when open */}
				{oauthOpen && (
					<OAuthPane>
						<OAuthLoginPanel
							prefill={oauthPrefill ? {
								authorizationEndpoint: oauthPrefill.authUrl,
								redirectUri: oauthPrefill.redirectUri,
							} : undefined}
							onClose={() => setOauthOpen(false)}
						/>
					</OAuthPane>
				)}
			</MainRow>
		</AppShell>
	);
};

// ─── Configuration Page ───────────────────────────────────────────────────────

const ConfigPage: React.FC = () => {
	const navigate = useNavigate();
	return (
		<ConfigRoot>
			<ConfigHeader>
				<BackBtn onClick={() => navigate('/')}>← Back</BackBtn>
				<ConfigTitle>⚙️ API Key Configuration</ConfigTitle>
			</ConfigHeader>
			<ConfigBody>
				<ApiKeyConfiguration />
			</ConfigBody>
		</ConfigRoot>
	);
};

// ─── Router Root ─────────────────────────────────────────────────────────────

const App: React.FC = () => (
	<BrowserRouter>
		<GlobalStyle />
		<Routes>
			<Route path="/" element={<MainPage />} />
			<Route path="/configuration" element={<ConfigPage />} />
			<Route path="/callback" element={<CallbackPage />} />
			<Route path="/popout" element={<AIAssistantPopoutPage />} />
		</Routes>
	</BrowserRouter>
);

export default App;

// ─── Styled Components ────────────────────────────────────────────────────────

const AppShell = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
`;

const TopBar = styled.header`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  height: 52px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  z-index: 10;
`;

const Logo = styled.div`
  font-weight: 700;
  font-size: 16px;
  letter-spacing: -0.01em;
`;

const NavActions = styled.div`
  margin-left: auto;
  display: flex;
  gap: 8px;
`;

const NavBtn = styled.button<{ $active: boolean }>`
  padding: 6px 14px;
  border-radius: 20px;
  border: 1.5px solid rgba(255,255,255,0.4);
  background: ${(p) => p.$active ? 'rgba(255,255,255,0.25)' : 'transparent'};
  color: white;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { background: rgba(255,255,255,0.2); }
`;

const MainRow = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
  gap: 0;
`;

const AssistantPane = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const OAuthPane = styled.div`
  width: 380px;
  flex-shrink: 0;
  border-left: 1px solid #e0e0e0;
  overflow-y: auto;
  background: white;
  display: flex;
  flex-direction: column;

  @media (max-width: 900px) {
    position: fixed;
    right: 0;
    top: 52px;
    bottom: 0;
    z-index: 50;
    box-shadow: -4px 0 16px rgba(0,0,0,0.1);
  }
`;

// Callback page
const CallbackRoot = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
  padding: 24px;
`;

const CallbackCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
`;

const CallbackIcon = styled.div`
  font-size: 40px;
  margin-bottom: 12px;
`;

const CallbackTitle = styled.h2`
  margin: 0 0 6px;
  font-size: 20px;
  color: #1a1a2e;
`;

const CallbackSubtitle = styled.p`
  margin: 0 0 20px;
  color: #666;
  font-size: 14px;
`;

const CallbackTable = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 24px;
`;

const CallbackRow = styled.div`
  display: flex;
  gap: 12px;
  font-size: 13px;
  background: #f8f8fb;
  padding: 8px 12px;
  border-radius: 6px;
`;

const CallbackKey = styled.span`
  font-weight: 600;
  color: #5a45bd;
  min-width: 120px;
`;

const CallbackVal = styled.span`
  color: #333;
  word-break: break-all;
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 12px;
`;

const CallbackBack = styled.button`
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  &:hover { opacity: 0.9; }
`;

// Config page
const ConfigRoot = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
`;

const ConfigHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
`;

const BackBtn = styled.button`
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  &:hover { background: rgba(255,255,255,0.3); }
`;

const ConfigTitle = styled.div`
  font-weight: 700;
  font-size: 16px;
`;

const ConfigBody = styled.div`
  flex: 1;
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
`;
