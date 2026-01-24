import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SidebarProvider } from './contexts/SidebarContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Sidebar from './components/Sidebar';
import MainLayout from './components/MainLayout';

// AI Pages
import PingAIResources from './pages/PingAIResources';
import AIGlossary from './pages/AIGlossary';
import AIIdentityArchitectures from './pages/AIIdentityArchitectures';
import AIAgentOverview from './pages/AIAgentOverview';

// AI Documentation
import OAuthAndOIDCForAI from './pages/docs/OAuthAndOIDCForAI';
import OAuthForAI from './pages/docs/OAuthForAI';
import OIDCForAI from './pages/docs/OIDCForAI';
import PingViewOnAI from './pages/docs/PingViewOnAI';

function App() {
	return (
		<ThemeProvider>
			<SidebarProvider>
				<Router>
					<div style={{ display: 'flex', minHeight: '100vh' }}>
						<Sidebar />
						<MainLayout>
							<Routes>
								{/* Default redirect to Ping AI Resources */}
								<Route path="/" element={<Navigate to="/ping-ai-resources" replace />} />
								
								{/* Main AI Pages */}
								<Route path="/ping-ai-resources" element={<PingAIResources />} />
								<Route path="/ai-glossary" element={<AIGlossary />} />
								<Route path="/ai-identity-architectures" element={<AIIdentityArchitectures />} />
								<Route path="/ai-agent-overview" element={<AIAgentOverview />} />
								
								{/* AI Documentation */}
								<Route path="/docs/oauth-and-oidc-for-ai" element={<OAuthAndOIDCForAI />} />
								<Route path="/docs/oauth-for-ai" element={<OAuthForAI />} />
								<Route path="/docs/oidc-for-ai" element={<OIDCForAI />} />
								<Route path="/docs/ping-view-on-ai" element={<PingViewOnAI />} />
								
								{/* Catch all */}
								<Route path="*" element={<Navigate to="/ping-ai-resources" replace />} />
							</Routes>
						</MainLayout>
					</div>
				</Router>
			</SidebarProvider>
		</ThemeProvider>
	);
}

export default App;
