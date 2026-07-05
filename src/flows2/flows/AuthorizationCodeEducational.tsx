// src/flows2/flows/AuthorizationCodeEducational.tsx
//
// Educational OAuth 2.1 Authorization Code flow — 4-column interactive teaching tool.
// Shows real PingOne OAuth endpoints and actual flow execution with decoded tokens.
//
// Layout: Sidebar (flow selector) | Config panel | Flow panel (7 steps) | Inspector (tokens)

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { authorizationCodeService } from '../services/authorizationCodeService';
import type { FlowCredentials, FlowMode, TokenResult, FlowError } from '../framework/types';
import { loadStash, saveStash } from '../framework/authzStash';

// Design tokens for educational UI
const DESIGN = {
	primary: '#1e3a8a',      // Deep indigo
	accent: '#14b8a6',       // Electric teal
	success: '#10b981',
	error: '#dc2626',
	neutral100: '#f9fafb',
	neutral200: '#f3f4f6',
	neutral300: '#e5e7eb',
	neutral600: '#4b5563',
	neutral900: '#111827',
};

const STEPS = [
	{ id: 'configure', title: 'Configure', subtitle: 'Set credentials' },
	{ id: 'pkce', title: 'PKCE', subtitle: 'Verifier + challenge' },
	{ id: 'auth-request', title: 'Auth Request', subtitle: 'Redirect to PingOne' },
	{ id: 'auth-code', title: 'Auth Code', subtitle: 'User approves' },
	{ id: 'exchange', title: 'Exchange', subtitle: 'Code → tokens' },
	{ id: 'introspect', title: 'Introspect', subtitle: 'Verify claims' },
	{ id: 'api-call', title: 'Call APIs', subtitle: 'Use access token' },
];

// === Layout Structure ===
const Container = styled.div`
	display: grid;
	grid-template-columns: 220px 1fr 1fr 320px;
	gap: 1rem;
	padding: 1.5rem;
	background: ${DESIGN.neutral100};
	min-height: 100vh;
	font-family: 'Inter', sans-serif;

	@media (max-width: 1400px) {
		grid-template-columns: 1fr;
	}
`;

const Panel = styled.div`
	background: white;
	border: 1px solid #e2e8f0;
	border-radius: 12px;
	padding: 1.5rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	overflow-y: auto;
	max-height: calc(100vh - 3rem);
`;

// === Navbar ===
const Navbar = styled.nav`
	grid-column: 1 / -1;
	display: flex;
	justify-content: space-between;
	align-items: center;
	background: white;
	border: 1px solid #e2e8f0;
	border-radius: 12px;
	padding: 1rem 1.5rem;
	margin-bottom: 0.5rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
	font-family: 'IBM Plex Mono', monospace;
	font-size: 1.25rem;
	font-weight: 700;
	color: ${DESIGN.primary};
	margin: 0;
	letter-spacing: 0.05em;
`;

const UrlDisplay = styled.div`
	flex: 1;
	margin: 0 2rem;
	background: ${DESIGN.neutral200};
	border: 1px solid #cbd5e1;
	border-radius: 8px;
	padding: 0.5rem 1rem;
	font-family: 'IBM Plex Mono', monospace;
	font-size: 0.8rem;
	color: ${DESIGN.neutral900};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const PlayButton = styled.button`
	font-family: 'IBM Plex Mono', monospace;
	font-size: 0.85rem;
	font-weight: 700;
	padding: 0.6rem 1.2rem;
	border-radius: 8px;
	border: none;
	background: ${DESIGN.accent};
	color: white;
	cursor: pointer;
	transition: all 150ms ease;

	&:hover:not(:disabled) {
		background: #0d9488;
		transform: translateY(-1px);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

// === Sidebar: Flow Selector ===
const SidebarPanel = styled(Panel)`
	grid-column: 1;
	grid-row: 2;
`;

const SidebarTitle = styled.h3`
	font-family: 'IBM Plex Mono', monospace;
	font-size: 0.8rem;
	font-weight: 700;
	text-transform: uppercase;
	color: ${DESIGN.primary};
	margin: 0 0 1rem 0;
	letter-spacing: 0.08em;
`;

const FlowOption = styled.button<{ $active: boolean }>`
	width: 100%;
	text-align: left;
	padding: 0.75rem 1rem;
	margin-bottom: 0.5rem;
	border: 2px solid ${({ $active }) => ($active ? DESIGN.accent : '#e2e8f0')};
	border-radius: 8px;
	background: ${({ $active }) => ($active ? DESIGN.accent : 'white')};
	color: ${({ $active }) => ($active ? 'white' : DESIGN.neutral900)};
	cursor: pointer;
	font-size: 0.85rem;
	font-weight: 600;
	transition: all 150ms ease;

	&:hover {
		border-color: ${DESIGN.accent};
	}
`;

// === Config Panel ===
const ConfigPanel = styled(Panel)`
	grid-column: 2;
	grid-row: 2;
`;

const PanelTitle = styled.h2`
	font-family: 'IBM Plex Mono', monospace;
	font-size: 0.9rem;
	font-weight: 700;
	text-transform: uppercase;
	color: ${DESIGN.primary};
	margin: 0 0 1rem 0;
	letter-spacing: 0.08em;
`;

const FormGroup = styled.div`
	margin-bottom: 1rem;
	display: flex;
	flex-direction: column;
	gap: 0.4rem;
`;

const Label = styled.label`
	font-size: 0.75rem;
	font-weight: 700;
	color: ${DESIGN.neutral900};
	text-transform: uppercase;
	letter-spacing: 0.05em;
`;

const Input = styled.input`
	padding: 0.6rem 0.8rem;
	border: 1px solid #cbd5e1;
	border-radius: 6px;
	font-size: 0.85rem;
	font-family: 'IBM Plex Mono', monospace;

	&:focus {
		outline: none;
		border-color: ${DESIGN.accent};
		box-shadow: 0 0 0 2px ${DESIGN.accent}22;
	}
`;

const Select = styled.select`
	padding: 0.6rem 0.8rem;
	border: 1px solid #cbd5e1;
	border-radius: 6px;
	font-size: 0.85rem;
	background: white;
	cursor: pointer;

	&:focus {
		outline: none;
		border-color: ${DESIGN.accent};
		box-shadow: 0 0 0 2px ${DESIGN.accent}22;
	}
`;

// === Flow Panel ===
const FlowPanel = styled(Panel)`
	grid-column: 3;
	grid-row: 2;
`;

const StepGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 0.75rem;
`;

const StepCard = styled.button<{ $active: boolean; $complete: boolean }>`
	padding: 1rem;
	border: 2px solid ${({ $active, $complete }) => {
		if ($active) return DESIGN.accent;
		if ($complete) return '#10b981';
		return '#e2e8f0';
	}};
	border-left: 4px solid ${({ $active, $complete }) => {
		if ($active) return DESIGN.accent;
		if ($complete) return '#10b981';
		return '#cbd5e1';
	}};
	border-radius: 8px;
	background: ${({ $active }) => ($active ? 'white' : DESIGN.neutral100)};
	cursor: pointer;
	text-align: left;
	transition: all 150ms ease;

	&:hover {
		border-color: ${DESIGN.accent};
		background: white;
	}
`;

const StepNumber = styled.div`
	font-family: 'IBM Plex Mono', monospace;
	font-size: 0.75rem;
	font-weight: 700;
	color: ${DESIGN.primary};
	text-transform: uppercase;
	margin-bottom: 0.3rem;
	letter-spacing: 0.08em;
`;

const StepTitle = styled.div`
	font-weight: 700;
	font-size: 0.9rem;
	color: ${DESIGN.neutral900};
	margin-bottom: 0.2rem;
`;

const StepSubtitle = styled.div`
	font-size: 0.75rem;
	color: ${DESIGN.neutral600};
`;

const ActionButton = styled.button`
	width: 100%;
	padding: 0.7rem;
	margin-top: 1rem;
	background: ${DESIGN.accent};
	color: white;
	border: none;
	border-radius: 8px;
	font-weight: 600;
	font-size: 0.85rem;
	cursor: pointer;
	font-family: 'IBM Plex Mono', monospace;
	transition: all 150ms ease;

	&:hover:not(:disabled) {
		background: #0d9488;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

// === Inspector Panel (Tokens) ===
const InspectorPanel = styled(Panel)`
	grid-column: 4;
	grid-row: 2;
`;

const TokenSection = styled.div`
	margin-bottom: 1.5rem;
`;

const TokenLabel = styled.div`
	font-family: 'IBM Plex Mono', monospace;
	font-size: 0.7rem;
	font-weight: 700;
	text-transform: uppercase;
	color: ${DESIGN.primary};
	margin-bottom: 0.5rem;
	letter-spacing: 0.08em;
`;

const TokenBox = styled.div`
	background: ${DESIGN.neutral200};
	border: 1px solid #cbd5e1;
	border-radius: 6px;
	padding: 0.75rem;
	font-family: 'IBM Plex Mono', monospace;
	font-size: 0.65rem;
	color: ${DESIGN.neutral900};
	word-break: break-all;
	max-height: 120px;
	overflow-y: auto;
	margin-bottom: 0.5rem;
`;

const DecodeButton = styled.button`
	width: 100%;
	padding: 0.4rem;
	background: ${DESIGN.primary};
	color: white;
	border: none;
	border-radius: 6px;
	font-size: 0.75rem;
	font-weight: 700;
	cursor: pointer;
	transition: all 150ms ease;

	&:hover:not(:disabled) {
		background: #1e40af;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

// === Modal for JWT Decode ===
const ModalOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
`;

const ModalContent = styled.div`
	background: white;
	border-radius: 12px;
	padding: 2rem;
	max-width: 600px;
	width: 90%;
	max-height: 80vh;
	overflow-y: auto;
	box-shadow: 0 20px 25px rgba(0, 0, 0, 0.2);
`;

const ModalTitle = styled.h3`
	margin: 0 0 1.5rem 0;
	font-size: 1.1rem;
	font-weight: 700;
	color: ${DESIGN.primary};
`;

const ModalCloseButton = styled.button`
	position: absolute;
	top: 1rem;
	right: 1rem;
	background: none;
	border: none;
	font-size: 1.5rem;
	cursor: pointer;
	color: ${DESIGN.neutral600};

	&:hover {
		color: ${DESIGN.neutral900};
	}
`;

const JwtPart = styled.div`
	margin-bottom: 1.5rem;
`;

const JwtPartTitle = styled.h4`
	font-family: 'IBM Plex Mono', monospace;
	font-size: 0.8rem;
	font-weight: 700;
	color: ${DESIGN.primary};
	margin: 0 0 0.5rem 0;
	text-transform: uppercase;
`;

const JwtPartContent = styled.pre`
	background: ${DESIGN.neutral200};
	border: 1px solid #cbd5e1;
	border-radius: 6px;
	padding: 0.75rem;
	font-family: 'IBM Plex Mono', monospace;
	font-size: 0.75rem;
	margin: 0;
	overflow-x: auto;
	white-space: pre-wrap;
	word-break: break-all;
`;

// === Request/Response Display ===
const RequestResponseBox = styled.div`
	background: ${DESIGN.neutral200};
	border: 1px solid #cbd5e1;
	border-radius: 6px;
	padding: 0.75rem;
	font-family: 'IBM Plex Mono', monospace;
	font-size: 0.65rem;
	color: ${DESIGN.neutral900};
	max-height: 150px;
	overflow-y: auto;
	margin-bottom: 0.75rem;
`;

// === Helper Functions ===

function decodeJwt(token: string): { header?: Record<string, unknown>; payload?: Record<string, unknown>; signature?: string } {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) return {};

		const header = JSON.parse(atob(parts[0]));
		const payload = JSON.parse(atob(parts[1]));
		const signature = parts[2].substring(0, 40);

		return { header, payload, signature };
	} catch {
		return {};
	}
}

function pingoneHost(region: string): string {
	const map: Record<string, string> = {
		com: 'auth.pingone.com',
		eu: 'auth.eu.pingone.com',
		ca: 'auth.ca.pingone.com',
		asia: 'auth.ap.pingone.com',
	};
	return map[region] || 'auth.pingone.com';
}

function buildCurrentUrl(step: string, creds: FlowCredentials): string {
	const base = `https://${pingoneHost(creds.region)}/${creds.environmentId}`;
	switch (step) {
		case 'pkce':
			return `GET ${base}/as/authorize`;
		case 'auth-request':
			return `GET ${base}/as/authorize`;
		case 'auth-code':
			return `GET http://localhost:8000/callback`;
		case 'exchange':
			return `POST ${base}/as/token`;
		case 'introspect':
			return `POST ${base}/as/introspect`;
		case 'api-call':
			return `GET https://api.pingone.com/v1/users`;
		default:
			return 'Configure your credentials to see the endpoint';
	}
}

// === Main Component ===

interface StepState {
	id: string;
	loading: boolean;
	complete: boolean;
	result?: unknown;
	error?: FlowError;
}

const AuthorizationCodeEducational: React.FC = () => {
	const [currentStep, setCurrentStep] = useState(0);
	const [creds, setCreds] = useState<FlowCredentials>(
		loadStash() || {
			environmentId: '',
			region: 'com',
			clientId: '',
			clientSecret: '',
			redirectUri: 'http://localhost:8000/callback',
		}
	);
	const [mode, setMode] = useState<FlowMode>('real');
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [sidebarWidth, setSidebarWidth] = useState(220);
	const [isPlaying, setIsPlaying] = useState(false);
	const [stepStates, setStepStates] = useState<Record<string, StepState>>({});
	const [pkceData, setPkceData] = useState<{ verifier: string; challenge: string } | null>(null);
	const [authCode, setAuthCode] = useState<string | null>(null);
	const [tokens, setTokens] = useState<TokenResult | null>(null);
	const [introspectResult, setIntrospectResult] = useState<Record<string, unknown> | null>(null);
	const [selectedToken, setSelectedToken] = useState<'access' | 'id' | 'refresh' | null>(null);
	const [showDecodeModal, setShowDecodeModal] = useState(false);

	// Load configuration from localStorage on mount
	useEffect(() => {
		const savedMode = localStorage.getItem('authzCode_mode');
		if (savedMode) {
			try {
				setMode(JSON.parse(savedMode));
			} catch {
				// Fallback to default if parse fails
			}
		}

		const savedSidebarCollapsed = localStorage.getItem('authzCode_sidebar');
		if (savedSidebarCollapsed) {
			try {
				setSidebarCollapsed(JSON.parse(savedSidebarCollapsed));
			} catch {
				// Fallback to default if parse fails
			}
		}

		const savedPanelWidth = localStorage.getItem('authzCode_panelWidth');
		if (savedPanelWidth) {
			try {
				setSidebarWidth(JSON.parse(savedPanelWidth));
			} catch {
				// Fallback to default if parse fails
			}
		}
	}, []);

	// Save mode to localStorage when it changes
	useEffect(() => {
		localStorage.setItem('authzCode_mode', JSON.stringify(mode));
	}, [mode]);

	// Save sidebar collapsed state to localStorage when it changes
	useEffect(() => {
		localStorage.setItem('authzCode_sidebar', JSON.stringify(sidebarCollapsed));
	}, [sidebarCollapsed]);

	// Save sidebar width to localStorage when it changes
	useEffect(() => {
		localStorage.setItem('authzCode_panelWidth', JSON.stringify(sidebarWidth));
	}, [sidebarWidth]);

	// Auto-fill mock credentials when mode changes
	useEffect(() => {
		if (mode === 'mock') {
			const mockCreds: FlowCredentials = {
				environmentId: 'a1234567-b890-c123-d456-e7890f123456',
				region: 'com',
				clientId: 'mock-client-demo-1234567890',
				clientSecret: 'mock-client-secret',
				redirectUri: 'http://localhost:8000/callback',
				scope: 'openid profile email offline_access',
			};
			setCreds(mockCreds);
			saveStash(mockCreds);
		} else if (mode === 'real') {
			const emptyCreds: FlowCredentials = {
				environmentId: '',
				region: 'com',
				clientId: '',
				clientSecret: '',
				redirectUri: 'http://localhost:8000/callback',
			};
			setCreds(emptyCreds);
			saveStash(emptyCreds);
		}
	}, [mode]);

	const updateCred = (key: keyof FlowCredentials) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const updated = { ...creds, [key]: e.target.value };
		setCreds(updated);
		saveStash(updated);
	};

	const setStepState = (id: string, state: Partial<StepState>) => {
		setStepStates((prev) => ({
			...prev,
			[id]: { ...prev[id], id, ...state },
		}));
	};

	// Step 1: Configure (no-op, just mark complete)
	const handleConfigure = useCallback(() => {
		setStepState('configure', { complete: true });
		setCurrentStep(1);
	}, [setStepState]);

	// Step 2: PKCE
	const handlePkce = useCallback(async () => {
		setStepState('pkce', { loading: true });
		try {
			const pair = await authorizationCodeService.generatePkce(mode);
			setPkceData({ verifier: pair.codeVerifier, challenge: pair.codeChallenge });
			setStepState('pkce', { loading: false, complete: true });
			setCurrentStep(2);
		} catch (err) {
			setStepState('pkce', { loading: false, error: err as FlowError });
		}
	}, [mode, setStepState]);

	// Step 3: Auth Request
	const handleAuthRequest = useCallback(async () => {
		if (!pkceData) {
			setStepState('auth-request', { error: { error: 'PKCE data missing' } });
			return;
		}
		setStepState('auth-request', { loading: true });
		try {
			const result = await authorizationCodeService.authorize(
				{
					credentials: creds,
					redirectUri: creds.redirectUri,
					state: `state-${Math.random().toString(36).substring(7)}`,
					codeChallenge: pkceData.challenge,
				},
				mode
			);
			setAuthCode(result.code || null);
			setStepState('auth-request', { loading: false, complete: true, result });
			setCurrentStep(3);
		} catch (err) {
			setStepState('auth-request', { loading: false, error: err as FlowError });
		}
	}, [creds, pkceData, mode, setStepState]);

	// Step 4: Auth Code (info-only)
	const handleAuthCode = useCallback(() => {
		setStepState('auth-code', { complete: true });
		setCurrentStep(4);
	}, [setStepState]);

	// Step 5: Exchange
	const handleExchange = useCallback(async () => {
		if (!authCode || !pkceData) {
			setStepState('exchange', { error: { error: 'Auth code or PKCE data missing' } });
			return;
		}
		setStepState('exchange', { loading: true });
		try {
			const result = await authorizationCodeService.exchangeCode(
				{
					credentials: creds,
					redirectUri: creds.redirectUri,
					code: authCode,
					codeVerifier: pkceData.verifier,
				},
				mode
			);
			setTokens(result);
			setStepState('exchange', { loading: false, complete: true, result });
			setCurrentStep(5);
		} catch (err) {
			setStepState('exchange', { loading: false, error: err as FlowError });
		}
	}, [authCode, pkceData, creds, mode, setStepState]);

	// Step 6: Introspect
	const handleIntrospect = useCallback(async () => {
		if (!tokens?.accessToken) {
			setStepState('introspect', { error: { error: 'Access token missing' } });
			return;
		}
		setStepState('introspect', { loading: true });
		try {
			const result = await authorizationCodeService.introspect(tokens.accessToken, creds, mode);
			setIntrospectResult(result);
			setStepState('introspect', { loading: false, complete: true, result });
			setCurrentStep(6);
		} catch (err) {
			setStepState('introspect', { loading: false, error: err as FlowError });
		}
	}, [tokens, creds, mode, setStepState]);

	// Step 7: API Call (info-only for now)
	const handleApiCall = useCallback(() => {
		setStepState('api-call', { complete: true });
		setCurrentStep(6);
	}, [setStepState]);

	// Auto-play animation through steps
	const handlePlay = useCallback(async () => {
		setIsPlaying(true);
		const delays = [500, 2000, 4000, 6000, 8000, 10000, 12000];

		for (let i = 0; i < STEPS.length; i++) {
			await new Promise((resolve) => setTimeout(resolve, delays[i]));
			setCurrentStep(i);

			// Auto-trigger actions at certain steps
			if (i === 1) {
				// PKCE
				const pair = await authorizationCodeService.generatePkce(mode);
				setPkceData({ verifier: pair.codeVerifier, challenge: pair.codeChallenge });
			} else if (i === 2) {
				// Auth Request
				if (pkceData) {
					const result = await authorizationCodeService.authorize(
						{
							credentials: creds,
							redirectUri: creds.redirectUri,
							state: 'auto-play-state',
							codeChallenge: pkceData.challenge,
						},
						mode
					);
					setAuthCode(result.code || null);
				}
			} else if (i === 4) {
				// Exchange
				if (authCode && pkceData) {
					const result = await authorizationCodeService.exchangeCode(
						{
							credentials: creds,
							redirectUri: creds.redirectUri,
							code: authCode,
							codeVerifier: pkceData.verifier,
						},
						mode
					);
					setTokens(result);
				}
			} else if (i === 5) {
				// Introspect
				if (tokens?.accessToken) {
					const result = await authorizationCodeService.introspect(tokens.accessToken, creds, mode);
					setIntrospectResult(result);
				}
			}
		}

		setIsPlaying(false);
	}, [creds, mode, pkceData, authCode, tokens]);

	const currentUrl = buildCurrentUrl(STEPS[currentStep].id, creds);
	const stepState = stepStates[STEPS[currentStep].id] || { id: STEPS[currentStep].id };

	const getSelectedTokenValue = (): string | undefined => {
		if (selectedToken === 'access') return tokens?.accessToken;
		if (selectedToken === 'id') return tokens?.idToken;
		if (selectedToken === 'refresh') return tokens?.refreshToken;
		return undefined;
	};

	const selectedTokenValue = getSelectedTokenValue();
	const decoded = selectedTokenValue ? decodeJwt(selectedTokenValue) : null;

	return (
		<>
			<Container>
				{/* Navbar */}
				<Navbar>
					<Title>OAuth 2.1 AuthZ Code</Title>
					<UrlDisplay title={currentUrl}>{currentUrl}</UrlDisplay>
					<PlayButton onClick={handlePlay} disabled={isPlaying}>
						{isPlaying ? 'Playing...' : 'Play'}
					</PlayButton>
				</Navbar>

				{/* Sidebar */}
				<SidebarPanel>
					<SidebarTitle>Flow</SidebarTitle>
					<FlowOption $active={mode === 'real'} onClick={() => setMode('real')}>
						Real PingOne
					</FlowOption>
					<FlowOption $active={mode === 'mock'} onClick={() => setMode('mock')}>
						Mock Mode
					</FlowOption>
				</SidebarPanel>

				{/* Config Panel */}
				<ConfigPanel>
					<PanelTitle>Config</PanelTitle>
					<FormGroup>
						<Label>Region</Label>
						<Select value={creds.region} onChange={updateCred('region')}>
							<option value="com">US (auth.pingone.com)</option>
							<option value="eu">EU (auth.eu.pingone.com)</option>
							<option value="ca">CA (auth.ca.pingone.com)</option>
							<option value="asia">APAC (auth.ap.pingone.com)</option>
						</Select>
					</FormGroup>
					<FormGroup>
						<Label>Environment ID</Label>
						<Input
							placeholder="UUID"
							value={creds.environmentId}
							onChange={updateCred('environmentId')}
						/>
					</FormGroup>
					<FormGroup>
						<Label>Client ID</Label>
						<Input
							placeholder="OAuth client ID"
							value={creds.clientId}
							onChange={updateCred('clientId')}
						/>
					</FormGroup>
					<FormGroup>
						<Label>Client Secret</Label>
						<Input
							type="password"
							placeholder="Optional"
							value={creds.clientSecret || ''}
							onChange={updateCred('clientSecret')}
						/>
					</FormGroup>
					<FormGroup>
						<Label>Redirect URI</Label>
						<Input
							placeholder="https://localhost:8000/callback"
							value={creds.redirectUri}
							onChange={updateCred('redirectUri')}
						/>
					</FormGroup>
				</ConfigPanel>

				{/* Flow Panel */}
				<FlowPanel>
					<PanelTitle>Steps</PanelTitle>
					<StepGrid>
						{STEPS.map((step, i) => (
							<StepCard
								key={step.id}
								$active={i === currentStep}
								$complete={stepStates[step.id]?.complete || false}
								onClick={() => setCurrentStep(i)}
							>
								<StepNumber>Step {i + 1}</StepNumber>
								<StepTitle>{step.title}</StepTitle>
								<StepSubtitle>{step.subtitle}</StepSubtitle>
							</StepCard>
						))}
					</StepGrid>

					{/* Action buttons based on current step */}
					{currentStep === 0 && (
						<ActionButton onClick={handleConfigure}>
							Proceed
						</ActionButton>
					)}
					{currentStep === 1 && (
						<ActionButton onClick={handlePkce} disabled={stepState.loading}>
							{stepState.loading ? 'Generating...' : 'Generate PKCE'}
						</ActionButton>
					)}
					{currentStep === 2 && (
						<ActionButton onClick={handleAuthRequest} disabled={stepState.loading}>
							{stepState.loading ? 'Requesting...' : 'Send Request'}
						</ActionButton>
					)}
					{currentStep === 3 && (
						<ActionButton onClick={handleAuthCode}>
							Continue
						</ActionButton>
					)}
					{currentStep === 4 && (
						<ActionButton onClick={handleExchange} disabled={stepState.loading}>
							{stepState.loading ? 'Exchanging...' : 'Exchange Code'}
						</ActionButton>
					)}
					{currentStep === 5 && (
						<ActionButton onClick={handleIntrospect} disabled={stepState.loading}>
							{stepState.loading ? 'Introspecting...' : 'Introspect'}
						</ActionButton>
					)}
					{currentStep === 6 && (
						<ActionButton onClick={handleApiCall}>
							Complete
						</ActionButton>
					)}

					{/* Show step result if available */}
					{stepState.result && (
						<RequestResponseBox>
							<strong>Result:</strong>
							<pre>{JSON.stringify(stepState.result, null, 2)}</pre>
						</RequestResponseBox>
					)}
					{stepState.error && (
						<RequestResponseBox style={{ background: '#fee2e2', color: '#991b1b' }}>
							<strong>Error:</strong> {stepState.error.error}
						</RequestResponseBox>
					)}
				</FlowPanel>

				{/* Inspector Panel */}
				<InspectorPanel>
					<PanelTitle>Tokens</PanelTitle>

					{tokens?.accessToken && (
						<TokenSection>
							<TokenLabel>Access Token</TokenLabel>
							<TokenBox title={tokens.accessToken}>
								{tokens.accessToken.substring(0, 40)}...
							</TokenBox>
							<DecodeButton onClick={() => { setSelectedToken('access'); setShowDecodeModal(true); }}>
								Decode
							</DecodeButton>
						</TokenSection>
					)}

					{tokens?.idToken && (
						<TokenSection>
							<TokenLabel>ID Token</TokenLabel>
							<TokenBox title={tokens.idToken}>
								{tokens.idToken.substring(0, 40)}...
							</TokenBox>
							<DecodeButton onClick={() => { setSelectedToken('id'); setShowDecodeModal(true); }}>
								Decode
							</DecodeButton>
						</TokenSection>
					)}

					{tokens?.refreshToken && (
						<TokenSection>
							<TokenLabel>Refresh Token</TokenLabel>
							<TokenBox title={tokens.refreshToken}>
								{tokens.refreshToken.substring(0, 40)}...
							</TokenBox>
							<DecodeButton onClick={() => { setSelectedToken('refresh'); setShowDecodeModal(true); }}>
								Decode
							</DecodeButton>
						</TokenSection>
					)}

					{introspectResult && (
						<TokenSection>
							<TokenLabel>Introspect</TokenLabel>
							<RequestResponseBox>
								{JSON.stringify(introspectResult, null, 2)}
							</RequestResponseBox>
						</TokenSection>
					)}
				</InspectorPanel>
			</Container>

			{/* JWT Decode Modal */}
			{showDecodeModal && selectedTokenValue && decoded && (
				<ModalOverlay onClick={() => setShowDecodeModal(false)}>
					<ModalContent onClick={(e) => e.stopPropagation()}>
						<ModalTitle>JWT Breakdown</ModalTitle>
						<ModalCloseButton onClick={() => setShowDecodeModal(false)}>×</ModalCloseButton>

						{decoded.header && (
							<JwtPart>
								<JwtPartTitle>Header</JwtPartTitle>
								<JwtPartContent>
									{JSON.stringify(decoded.header, null, 2)}
								</JwtPartContent>
							</JwtPart>
						)}

						{decoded.payload && (
							<JwtPart>
								<JwtPartTitle>Payload (Claims)</JwtPartTitle>
								<JwtPartContent>
									{JSON.stringify(decoded.payload, null, 2)}
								</JwtPartContent>
							</JwtPart>
						)}

						{decoded.signature && (
							<JwtPart>
								<JwtPartTitle>Signature</JwtPartTitle>
								<JwtPartContent>{decoded.signature}...</JwtPartContent>
							</JwtPart>
						)}
					</ModalContent>
				</ModalOverlay>
			)}
		</>
	);
};

export default AuthorizationCodeEducational;
