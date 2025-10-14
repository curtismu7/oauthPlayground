import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import styled, { ThemeProvider } from 'styled-components';
import { AuthProvider } from './contexts/AuthContext';
import { GlobalStyle, theme } from './styles/global';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Flows from './pages/Flows';
import Configuration from './pages/Configuration';
import Documentation from './pages/Documentation';
import Login from './pages/Login';
import Callback from './pages/Callback';
import { useAuth } from './contexts/AuthContext';

const AppContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.gray100};
`;

const MainContent = styled.main`
  flex: 1;
  padding: 1.5rem;
  margin-left: 250px;
  margin-top: 60px;
  overflow-y: auto;
  transition: margin 0.3s ease;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    margin-left: 0;
    padding: 1rem;
    margin-top: 60px;
  }
`;

const ProtectedRoute = ({ children }) => {
	const { isAuthenticated, isLoading } = useAuth();
	const location = useLocation();

	if (isLoading) {
		return <div>Loading...</div>; // Or a loading spinner
	}

	if (!isAuthenticated) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	return children;
};

const AppRoutes = () => {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const location = useLocation();

	// Close sidebar when route changes
	useEffect(() => {
		setSidebarOpen(false);
	}, [location]);

	const toggleSidebar = () => {
		setSidebarOpen(!sidebarOpen);
	};

	return (
		<AppContainer>
			<Navbar toggleSidebar={toggleSidebar} />
			<Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
			<MainContent>
				<Routes>
					<Route path="/login" element={<Login />} />
					<Route path="/callback" element={<Callback />} />

					<Route path="/" element={<Navigate to="/dashboard" replace />} />

					<Route
						path="/dashboard"
						element={
							<ProtectedRoute>
								<Dashboard />
							</ProtectedRoute>
						}
					/>

					<Route
						path="/flows"
						element={
							<ProtectedRoute>
								<Flows />
							</ProtectedRoute>
						}
					>
						<Route path="authorization-code" element={<div>Authorization Code Flow</div>} />
						<Route path="implicit" element={<div>Implicit Flow</div>} />
						<Route path="client-credentials" element={<div>Client Credentials Flow</div>} />
						<Route path="pkce" element={<div>PKCE Flow</div>} />
						<Route path="device-code" element={<div>Device Code Flow</div>} />
					</Route>

					<Route
						path="/oidc"
						element={
							<ProtectedRoute>
								<div>OpenID Connect</div>
							</ProtectedRoute>
						}
					/>

					<Route
						path="/configuration"
						element={
							<ProtectedRoute>
								<Configuration />
							</ProtectedRoute>
						}
					/>

					<Route
						path="/documentation"
						element={
							<ProtectedRoute>
								<Documentation />
							</ProtectedRoute>
						}
					/>

					<Route path="*" element={<div>Not Found</div>} />
				</Routes>
			</MainContent>
		</AppContainer>
	);
};

function App() {
	return (
		<ThemeProvider theme={theme}>
			<AuthProvider>
				<GlobalStyle />
				<AppRoutes />
			</AuthProvider>
		</ThemeProvider>
	);
}

export default App;
