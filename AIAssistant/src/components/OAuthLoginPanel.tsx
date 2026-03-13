/**
 * OAuthLoginPanel — handles Authorization Code Flow in the standalone AI Assistant app.
 *
 * Shows a configurable authorization request form, opens the PingOne login page in a
 * popup window, intercepts the redirect callback, and displays the resulting token set.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OAuthParams {
	authorizationEndpoint: string;
	clientId: string;
	redirectUri: string;
	scope: string;
	responseType: 'code' | 'token' | 'id_token token';
	usePKCE: boolean;
	state?: string;
	nonce?: string;
	loginHint?: string;
}

interface TokenSet {
	access_token?: string;
	id_token?: string;
	refresh_token?: string;
	token_type?: string;
	expires_in?: number;
	scope?: string;
	[key: string]: unknown;
}

interface PanelProps {
	/** Pre-fill fields from the assistant (e.g. when the AI says "start auth code flow") */
	prefill?: Partial<OAuthParams>;
	onClose?: () => void;
}

// ─── PKCE helpers ─────────────────────────────────────────────────────────────

async function generateCodeVerifier(): Promise<string> {
	const array = new Uint8Array(32);
	crypto.getRandomValues(array);
	return btoa(String.fromCharCode(...array))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
	const data = new TextEncoder().encode(verifier);
	const digest = await crypto.subtle.digest('SHA-256', data);
	return btoa(String.fromCharCode(...new Uint8Array(digest)))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
}

function generateState(): string {
	const array = new Uint8Array(16);
	crypto.getRandomValues(array);
	return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

// ─── Component ────────────────────────────────────────────────────────────────

export const OAuthLoginPanel: React.FC<PanelProps> = ({ prefill, onClose }) => {
	const [params, setParams] = useState<OAuthParams>({
		authorizationEndpoint: prefill?.authorizationEndpoint ?? '',
		clientId: prefill?.clientId ?? '',
		redirectUri: prefill?.redirectUri ?? `${window.location.origin}/callback`,
		scope: prefill?.scope ?? 'openid profile email',
		responseType: prefill?.responseType ?? 'code',
		usePKCE: prefill?.usePKCE ?? true,
		state: prefill?.state ?? generateState(),
		nonce: prefill?.nonce ?? '',
		loginHint: prefill?.loginHint ?? '',
	});

	const [authUrl, setAuthUrl] = useState<string>('');
	const [currentStep, setCurrentStep] = useState<'configure' | 'login' | 'callback' | 'tokens'>('configure');
	const [callbackData, setCallbackData] = useState<Record<string, string>>({});
	const [tokenSet, setTokenSet] = useState<TokenSet | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isExchanging, setIsExchanging] = useState(false);
	const [codeVerifier, setCodeVerifier] = useState('');
	const popupRef = useRef<Window | null>(null);
	const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

	// Discover OIDC endpoints from backend (optional convenience)
	const [discovery, setDiscovery] = useState<Record<string, string> | null>(null);
	const [isDiscovering, setIsDiscovering] = useState(false);

	const discoverEndpoints = async () => {
		const envId = params.authorizationEndpoint.match(/\/([0-9a-f-]{36})\//)?.[1];
		if (!envId) { setError('Cannot auto-discover: no environment ID found in the authorization endpoint URL.'); return; }
		setIsDiscovering(true);
		try {
			const res = await fetch(`/api/mcp/query`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query: `get OIDC discovery document for environment ${envId}` }),
			});
			const data = await res.json();
			if (data.success && data.data) {
				const disc = data.data as Record<string, string>;
				setDiscovery(disc);
				setParams((p) => ({
					...p,
					authorizationEndpoint: disc.authorization_endpoint ?? p.authorizationEndpoint,
				}));
				setError(null);
			} else {
				setError('Discovery failed: ' + (data.error ?? 'unknown error'));
			}
		} catch (e) {
			setError('Discovery request failed: ' + (e instanceof Error ? e.message : String(e)));
		} finally {
			setIsDiscovering(false);
		}
	};

	// Listen for the popup navigating to our redirect_uri
	const startPopupListener = useCallback(() => {
		if (pollRef.current) clearInterval(pollRef.current);

		pollRef.current = setInterval(() => {
			try {
				const popup = popupRef.current;
				if (!popup || popup.closed) {
					clearInterval(pollRef.current!);
					if (currentStep === 'login') {
						setError('Login window was closed before completing the flow.');
					}
					return;
				}

				// Try to access the URL — will throw if cross-origin
				const url = popup.location.href;
				if (url.includes(params.redirectUri) || url.startsWith(window.location.origin + '/callback')) {
					clearInterval(pollRef.current!);
					popup.close();

					// Parse callback parameters
					const parsed = new URL(url);
					const cbData: Record<string, string> = {};
					parsed.searchParams.forEach((v, k) => { cbData[k] = v; });
					// Handle hash fragment (implicit/hybrid)
					if (parsed.hash) {
						parsed.hash.slice(1).split('&').forEach((pair) => {
							const [k, v] = pair.split('=');
							if (k) cbData[decodeURIComponent(k)] = decodeURIComponent(v ?? '');
						});
					}
					setCallbackData(cbData);
					setCurrentStep('callback');
				}
			} catch {
				// cross-origin — popup not yet on our domain, keep polling
			}
		}, 500);
	}, [params.redirectUri, currentStep]);

	const buildAuthUrl = useCallback(async () => {
		const verifier = params.usePKCE ? await generateCodeVerifier() : '';
		const challenge = params.usePKCE ? await generateCodeChallenge(verifier) : '';
		if (params.usePKCE) setCodeVerifier(verifier);

		const url = new URL(params.authorizationEndpoint);
		url.searchParams.set('response_type', params.responseType);
		url.searchParams.set('client_id', params.clientId);
		url.searchParams.set('redirect_uri', params.redirectUri);
		url.searchParams.set('scope', params.scope);
		url.searchParams.set('state', params.state ?? generateState());
		if (params.nonce) url.searchParams.set('nonce', params.nonce);
		if (params.loginHint) url.searchParams.set('login_hint', params.loginHint);
		if (params.usePKCE) {
			url.searchParams.set('code_challenge', challenge);
			url.searchParams.set('code_challenge_method', 'S256');
		}
		return url.toString();
	}, [params]);

	const handleStartFlow = async () => {
		setError(null);
		try {
			const url = await buildAuthUrl();
			setAuthUrl(url);
			setCurrentStep('login');

			const popup = window.open(
				url,
				'oauth-login',
				'width=520,height=680,scrollbars=yes,resizable=yes'
			);
			if (!popup) {
				setError('Popup was blocked. Please allow popups for this site and try again.');
				setCurrentStep('configure');
				return;
			}
			popupRef.current = popup;
			startPopupListener();
		} catch (e) {
			setError('Failed to build authorization URL: ' + (e instanceof Error ? e.message : String(e)));
		}
	};

	const handleExchangeCode = async () => {
		if (!callbackData.code) { setError('No authorization code in callback.'); return; }
		setIsExchanging(true);
		setError(null);
		try {
			const body: Record<string, string> = {
				grant_type: 'authorization_code',
				code: callbackData.code,
				redirect_uri: params.redirectUri,
				client_id: params.clientId,
				// Use the discovered token endpoint, or derive from authorization endpoint
				token_endpoint: discovery?.token_endpoint ?? params.authorizationEndpoint.replace('/as/authorize', '/as/token'),
			};
			if (codeVerifier) body.code_verifier = codeVerifier;

			// Use the existing token-exchange proxy endpoint (accepts flat params + token_endpoint)
			const res = await fetch('/api/token-exchange', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});
			const data = await res.json();
			if (!res.ok) {
				setError(`Token exchange failed (${res.status}): ${data.error_description ?? data.error ?? JSON.stringify(data)}`);
			} else {
				setTokenSet(data);
				setCurrentStep('tokens');
			}
		} catch (e) {
			setError('Token exchange request failed: ' + (e instanceof Error ? e.message : String(e)));
		} finally {
			setIsExchanging(false);
		}
	};

	const handleReset = () => {
		setCurrentStep('configure');
		setCallbackData({});
		setTokenSet(null);
		setError(null);
		setAuthUrl('');
		if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
		if (pollRef.current) clearInterval(pollRef.current);
	};

	useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

	const update = (field: keyof OAuthParams) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
		setParams((p) => ({ ...p, [field]: e.target.value }));

	// ─── Render ─────────────────────────────────────────────────────────────

	return (
		<PanelRoot>
			<PanelHeader>
				<PanelTitle>🔐 OAuth Login Window</PanelTitle>
				<PanelSubtitle>Authorization Code Flow</PanelSubtitle>
				{onClose && <CloseBtn onClick={onClose} aria-label="Close OAuth panel">✕</CloseBtn>}
			</PanelHeader>

			{/* Step indicators */}
			<Steps>
				{(['configure', 'login', 'callback', 'tokens'] as const).map((step, i) => (
					<StepItem key={step} $active={currentStep === step} $done={
						(['configure', 'login', 'callback', 'tokens'] as const).indexOf(currentStep) > i
					}>
						<StepNum>{i + 1}</StepNum>
						<StepLabel>{step === 'configure' ? 'Configure' : step === 'login' ? 'Login' : step === 'callback' ? 'Callback' : 'Tokens'}</StepLabel>
					</StepItem>
				))}
			</Steps>

			{error && <ErrorBanner>{error}</ErrorBanner>}

			{/* Step 1: Configure */}
			{currentStep === 'configure' && (
				<StepContent>
					<FieldGroup>
						<FieldRow>
							<Label>Authorization Endpoint</Label>
							<FieldWithAction>
								<TextInput value={params.authorizationEndpoint} onChange={update('authorizationEndpoint')} placeholder="https://auth.pingone.com/{envId}/as/authorize" />
								<SmallBtn onClick={discoverEndpoints} disabled={isDiscovering} title="Auto-discover from OIDC well-known endpoint">
									{isDiscovering ? '…' : '🔍 Discover'}
								</SmallBtn>
							</FieldWithAction>
						</FieldRow>
						<FieldRow>
							<Label>Client ID</Label>
							<TextInput value={params.clientId} onChange={update('clientId')} placeholder="00000000-0000-0000-0000-000000000000" />
						</FieldRow>
						<FieldRow>
							<Label>Redirect URI</Label>
							<TextInput value={params.redirectUri} onChange={update('redirectUri')} placeholder={`${window.location.origin}/callback`} />
						</FieldRow>
						<FieldRow>
							<Label>Scopes</Label>
							<TextInput value={params.scope} onChange={update('scope')} placeholder="openid profile email" />
						</FieldRow>
						<FieldRow>
							<Label>Response Type</Label>
							<Select value={params.responseType} onChange={(e) => update('responseType')(e)}>
								<option value="code">code (Authorization Code)</option>
								<option value="token">token (Implicit)</option>
								<option value="id_token token">id_token token (Hybrid)</option>
							</Select>
						</FieldRow>
						<FieldRow>
							<Label>Login Hint (optional)</Label>
							<TextInput value={params.loginHint} onChange={update('loginHint')} placeholder="user@example.com" />
						</FieldRow>
						<CheckRow>
							<input type="checkbox" id="pkce" checked={params.usePKCE} onChange={(e) => setParams((p) => ({ ...p, usePKCE: e.target.checked }))} />
							<label htmlFor="pkce">Use PKCE (S256) — recommended</label>
						</CheckRow>
					</FieldGroup>

					{discovery && (
						<DiscoveryBox>
							<DiscoveryTitle>OIDC Discovery</DiscoveryTitle>
							{['issuer', 'authorization_endpoint', 'token_endpoint', 'userinfo_endpoint', 'jwks_uri'].map((k) => (
								discovery[k] ? <DiscoveryRow key={k}><DiscoveryKey>{k}</DiscoveryKey><DiscoveryVal>{discovery[k]}</DiscoveryVal></DiscoveryRow> : null
							))}
						</DiscoveryBox>
					)}

					<StartBtn onClick={handleStartFlow} disabled={!params.authorizationEndpoint || !params.clientId}>
						▶ Open Login Window
					</StartBtn>
				</StepContent>
			)}

			{/* Step 2: Login in progress */}
			{currentStep === 'login' && (
				<StepContent>
					<InfoBox>
						<p>🔐 A login popup has been opened. Complete the login there.</p>
						<p style={{ fontSize: '11px', color: '#888', marginTop: 8 }}>
							The window will be monitored automatically. If popups were blocked, use the link below:
						</p>
						<AuthUrlBox href={authUrl} target="_blank" rel="noopener noreferrer">Open authorization URL manually</AuthUrlBox>
					</InfoBox>
					<SmallBtn onClick={handleReset} style={{ marginTop: 12 }}>✕ Cancel flow</SmallBtn>
				</StepContent>
			)}

			{/* Step 3: Callback received */}
			{currentStep === 'callback' && (
				<StepContent>
					<SectionTitle>Callback Parameters</SectionTitle>
					<DataTable>
						{Object.entries(callbackData).map(([k, v]) => (
							<DataRow key={k}>
								<DataKey>{k}</DataKey>
								<DataVal>{v}</DataVal>
							</DataRow>
						))}
					</DataTable>

					{callbackData.code && (
						<>
							<SectionTitle style={{ marginTop: 16 }}>Exchange Code for Tokens</SectionTitle>
							<StartBtn onClick={handleExchangeCode} disabled={isExchanging}>
								{isExchanging ? '⏳ Exchanging…' : '🔄 Exchange Code for Tokens'}
							</StartBtn>
						</>
					)}
					{callbackData.access_token && (
						<>
							<SectionTitle style={{ marginTop: 16 }}>Implicit / Hybrid Tokens</SectionTitle>
							<TokenDisplay tokens={callbackData as unknown as TokenSet} />
						</>
					)}
					<SmallBtn onClick={handleReset} style={{ marginTop: 16 }}>↩ Start over</SmallBtn>
				</StepContent>
			)}

			{/* Step 4: Tokens */}
			{currentStep === 'tokens' && tokenSet && (
				<StepContent>
					<SectionTitle>✅ Token Exchange Successful</SectionTitle>
					<TokenDisplay tokens={tokenSet} />
					<SmallBtn onClick={handleReset} style={{ marginTop: 16 }}>↩ Start new flow</SmallBtn>
				</StepContent>
			)}
		</PanelRoot>
	);
};

// ─── Token display sub-component ──────────────────────────────────────────────

const TokenDisplay: React.FC<{ tokens: TokenSet }> = ({ tokens }) => {
	const [showRaw, setShowRaw] = useState(false);

	return (
		<TokenBox>
			{(['access_token', 'id_token', 'refresh_token', 'token_type', 'expires_in', 'scope'] as const).map((k) =>
				tokens[k] ? (
					<DataRow key={k}>
						<DataKey>{k}</DataKey>
						<DataVal style={{ wordBreak: 'break-all', fontSize: 11 }}>{String(tokens[k])}</DataVal>
					</DataRow>
				) : null
			)}
			<SmallBtn onClick={() => setShowRaw((v) => !v)} style={{ marginTop: 8 }}>
				{showRaw ? 'Hide' : 'Show'} raw JSON
			</SmallBtn>
			{showRaw && (
				<pre style={{ fontSize: 11, overflow: 'auto', maxHeight: 200, background: '#f4f4f8', padding: 8, borderRadius: 6, marginTop: 8 }}>
					{JSON.stringify(tokens, null, 2)}
				</pre>
			)}
		</TokenBox>
	);
};

// ─── Styled Components ────────────────────────────────────────────────────────

const PanelRoot = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  background: #f8f9fa;
`;

const PanelHeader = styled.div`
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  position: relative;
`;

const PanelTitle = styled.div`
  font-weight: 700;
  font-size: 15px;
`;

const PanelSubtitle = styled.div`
  font-size: 12px;
  opacity: 0.85;
  margin-left: 4px;
`;

const CloseBtn = styled.button`
  margin-left: auto;
  background: rgba(255,255,255,0.25);
  border: none;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover { background: rgba(255,255,255,0.4); }
`;

const Steps = styled.div`
  display: flex;
  padding: 10px 16px;
  gap: 0;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
`;

const StepItem = styled.div<{ $active: boolean; $done: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
  &::after {
    content: '';
    position: absolute;
    top: 12px;
    left: 60%;
    right: -40%;
    height: 2px;
    background: ${(p) => (p.$done ? '#11998e' : '#e0e0e0')};
    z-index: 0;
  }
  &:last-child::after { display: none; }
`;

const StepNum = styled.div<{ $active?: boolean; $done?: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  z-index: 1;
  background: ${(p) => (p.$done ? '#11998e' : p.$active ? '#667eea' : '#e0e0e0')};
  color: ${(p) => (p.$done || p.$active ? 'white' : '#888')};
`;

const StepLabel = styled.div`
  font-size: 10px;
  color: #888;
  margin-top: 3px;
  text-transform: capitalize;
`;

const ErrorBanner = styled.div`
  margin: 10px 16px 0;
  padding: 8px 12px;
  background: #fff0f0;
  border: 1px solid #ffbdbd;
  border-radius: 6px;
  color: #c0392b;
  font-size: 12px;
  line-height: 1.4;
`;

const StepContent = styled.div`
  padding: 16px;
  flex: 1;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const FieldRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const FieldWithAction = styled.div`
  display: flex;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 11px;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const TextInput = styled.input`
  padding: 8px 10px;
  border: 1px solid #d0d0d8;
  border-radius: 6px;
  font-size: 13px;
  flex: 1;
  outline: none;
  &:focus { border-color: #667eea; box-shadow: 0 0 0 2px rgba(102,126,234,0.15); }
`;

const Select = styled.select`
  padding: 8px 10px;
  border: 1px solid #d0d0d8;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  background: white;
  &:focus { border-color: #667eea; }
`;

const CheckRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #444;
  label { cursor: pointer; }
`;

const StartBtn = styled.button`
  margin-top: 16px;
  width: 100%;
  padding: 11px;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  &:hover:not(:disabled) { opacity: 0.9; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const SmallBtn = styled.button`
  padding: 6px 12px;
  background: white;
  border: 1px solid #d0d0d8;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  &:hover:not(:disabled) { background: #f4f4f8; border-color: #667eea; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const InfoBox = styled.div`
  padding: 14px;
  background: #eaf4fb;
  border: 1px solid #b8d8f0;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: #2471a3;
`;

const AuthUrlBox = styled.a`
  display: block;
  margin-top: 8px;
  padding: 8px;
  background: rgba(0,0,0,0.04);
  border-radius: 4px;
  font-size: 11px;
  color: #667eea;
  word-break: break-all;
  text-decoration: underline;
`;

const SectionTitle = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 8px;
`;

const DataTable = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const DataRow = styled.div`
  display: flex;
  gap: 8px;
  font-size: 12px;
  line-height: 1.5;
  align-items: baseline;
`;

const DataKey = styled.span`
  font-weight: 600;
  color: #5a45bd;
  min-width: 110px;
  flex-shrink: 0;
`;

const DataVal = styled.span`
  color: #333;
  word-break: break-all;
`;

const TokenBox = styled.div`
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
`;

const DiscoveryBox = styled.div`
  margin-top: 12px;
  padding: 10px 12px;
  background: rgba(17,153,142,0.07);
  border: 1px solid rgba(17,153,142,0.25);
  border-radius: 8px;
`;

const DiscoveryTitle = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: #11998e;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const DiscoveryRow = styled.div`
  display: flex;
  gap: 8px;
  font-size: 11px;
  margin-bottom: 2px;
  align-items: baseline;
`;

const DiscoveryKey = styled.span`
  font-weight: 600;
  color: #555;
  min-width: 160px;
  flex-shrink: 0;
`;

const DiscoveryVal = styled.span`
  color: #0a4b45;
  word-break: break-all;
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 10px;
`;

export default OAuthLoginPanel;
