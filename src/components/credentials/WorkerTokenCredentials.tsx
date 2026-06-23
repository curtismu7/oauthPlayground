/**
 * @file WorkerTokenCredentials.tsx
 * @description Canonical, unversioned worker-token credentials component for the
 *   whole platform. One component, two orientations:
 *     - variant="modal"  → overlay dialog (replaces WorkerTokenModal / *V8 / *V9)
 *     - variant="inline"  → in-page section that opens the same dialog (replaces
 *                           WorkerTokenSectionV8 / *V9)
 *   Single-screen layout + AI-Demo (ping2026) styling. Grant-type selector:
 *   Client Credentials (wired) and Authorization Code (UI present, gated).
 *
 *   Styling is inlined/scoped under `.wtc-root` because oauthPlayground does not
 *   load AI-Demo's controls.css / v2-global-theme.css.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import { unifiedWorkerTokenService } from '@/services/unifiedWorkerTokenService';
import {
	type WorkerTokenCredentials as WorkerTokenCredentialsPayload,
	exportWorkerTokenCredentials,
	importCredentials,
	triggerFileImport,
} from '@/services/credentialExportImportService';
import {
	acquireWorkerToken,
	type WorkerTokenAuthMethod,
	type WorkerTokenRegion,
} from '@/services/workerTokenAcquisitionService';
import { PINGONE_WORKER_MFA_SCOPE_STRING } from '@/v8/config/constants';

export type WorkerTokenGrantType = 'client_credentials' | 'authorization_code';

export interface WorkerTokenCredentialsProps {
	/** Orientation. 'modal' = overlay dialog, 'inline' = in-page section. */
	variant?: 'modal' | 'inline';
	/** Density. 'compact' tightens padding for embedding in flows. */
	size?: 'compact' | 'full';
	/** Controlled open state (modal variant). Ignored for inline (self-managed). */
	isOpen?: boolean;
	onClose?: () => void;
	/** Prefill + report. */
	environmentId?: string;
	grantType?: WorkerTokenGrantType;
	redirectUri?: string;
	onTokenGenerated?: (token: string) => void;
}

const SCOPED_CSS = `
.wtc-root {
  --v2-bg:#f7f7f5; --v2-surface:#fff; --v2-surface-2:#f3f3f1;
  --v2-ink-1:#111110; --v2-ink-2:#4c4c48; --v2-ink-3:#8c8c88;
  --v2-line-1:#e4e4e0; --v2-line-2:#d5d5d0;
  --v2-accent:#1b3a6b; --v2-accent-muted:rgba(27,58,107,.08); --v2-danger:#c0392b;
  --v2-r-sm:4px; --v2-r-md:8px; --v2-r-lg:12px;
  --v2-shadow-1:0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04);
  --v2-shadow-2:0 4px 16px rgba(0,0,0,.08),0 1px 3px rgba(0,0,0,.04);
  --v2-shadow-3:0 8px 32px rgba(0,0,0,.12),0 4px 8px rgba(0,0,0,.08);
  --ctl-brand:#0b69a3; --ctl-ink:#102a43; --ctl-line:#d9e2ec; --ctl-line-strong:#b6c2cf;
  --ctl-radius:10px; --ctl-ring:0 0 0 3px rgba(11,105,163,.35);
  font-family:"Inter",ui-sans-serif,system-ui,sans-serif; color:var(--v2-ink-2);
}
.wtc-root *{box-sizing:border-box;}
.wtc-overlay{position:fixed;inset:0;background:rgba(17,17,16,.45);display:flex;align-items:flex-start;justify-content:center;padding:32px 16px;overflow-y:auto;z-index:1000;}
.wtc-card{width:100%;max-width:560px;background:var(--v2-surface);border:1px solid var(--v2-line-1);border-radius:var(--v2-r-lg);box-shadow:var(--v2-shadow-3);overflow:hidden;}
.wtc-card--inline{box-shadow:var(--v2-shadow-1);}
.wtc-header{padding:22px 24px;border-bottom:1px solid var(--v2-line-1);display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}
.wtc-header h2{margin:0 0 4px;font-family:"Fraunces",Georgia,serif;font-weight:600;font-size:21px;color:var(--v2-ink-1);letter-spacing:-.01em;}
.wtc-header p{margin:0;font-size:13px;color:var(--v2-ink-3);}
.wtc-close{background:none;border:none;font-size:22px;line-height:1;cursor:pointer;color:var(--v2-ink-3);padding:2px 6px;border-radius:var(--v2-r-sm);}
.wtc-close:hover{background:var(--v2-surface-2);color:var(--v2-ink-1);}
.wtc-content{padding:24px;}
.wtc-content--compact{padding:16px;}
.wtc-help{margin-bottom:18px;padding:11px 14px;background:var(--v2-accent-muted);border:1px solid rgba(27,58,107,.22);border-radius:var(--v2-r-md);font-size:13px;color:var(--v2-ink-2);}
.wtc-help summary{cursor:pointer;font-weight:600;color:var(--v2-accent);list-style:none;}
.wtc-help summary::-webkit-details-marker{display:none;}
.wtc-help summary::before,.wtc-adv summary::before{content:"\\25B8";display:inline-block;margin-right:7px;transition:transform .15s;}
.wtc-help[open] summary::before,.wtc-adv[open] summary::before{transform:rotate(90deg);}
.wtc-help>div{margin-top:9px;line-height:1.55;}
.wtc-help code,.wtc-root code{font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:12px;background:var(--v2-surface-2);padding:1px 5px;border-radius:var(--v2-r-sm);color:var(--v2-ink-1);}
.wtc-form{display:flex;flex-direction:column;gap:16px;}
.wtc-root label{display:block;font-weight:600;font-size:13px;color:var(--v2-ink-1);margin-bottom:6px;}
.wtc-req{color:var(--v2-danger);}
.wtc-root input[type=text],.wtc-root input[type=password],.wtc-root textarea,.wtc-select{width:100%;padding:10px 12px;border:1px solid var(--v2-line-1);border-radius:var(--v2-r-md);font-size:14px;color:var(--v2-ink-1);background:var(--v2-surface);}
.wtc-root input[type=text],.wtc-root input[type=password],.wtc-root textarea{font-family:"IBM Plex Mono",ui-monospace,monospace;}
.wtc-root textarea{font-size:13px;resize:vertical;}
.wtc-root input:focus,.wtc-root textarea:focus{outline:none;border-color:var(--v2-accent);box-shadow:0 0 0 3px var(--v2-accent-muted);}
.wtc-root small{display:block;margin-top:5px;color:var(--v2-ink-3);font-size:12px;}
.wtc-secret-wrap{position:relative;}
.wtc-secret-toggle{position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--v2-ink-3);font-size:12px;font-weight:600;}
.wtc-select{-webkit-appearance:none;appearance:none;border:1.5px solid var(--ctl-line);border-radius:var(--ctl-radius);background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%230b69a3' d='M1 1l5 5 5-5'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding:9px 34px 9px 13px;color:var(--ctl-ink);cursor:pointer;}
.wtc-select:hover{border-color:var(--ctl-line-strong);}
.wtc-select:focus{outline:none;border-color:var(--ctl-brand);box-shadow:var(--ctl-ring);}
.wtc-adv summary{cursor:pointer;font-weight:600;font-size:13px;color:var(--v2-accent);list-style:none;}
.wtc-adv summary::-webkit-details-marker{display:none;}
.wtc-adv>div{display:flex;flex-direction:column;gap:16px;margin-top:16px;}
.wtc-seg{display:inline-flex;padding:3px;gap:3px;background:var(--v2-surface-2);border:1px solid var(--v2-line-1);border-radius:var(--ctl-radius);width:100%;}
.wtc-seg button{flex:1;padding:8px 12px;border-radius:7px;font-size:13px;font-weight:600;color:var(--v2-ink-2);cursor:pointer;background:none;border:none;transition:background .15s,color .15s;font-family:inherit;}
.wtc-seg button:hover:not(:disabled){color:var(--ctl-brand);}
.wtc-seg button[aria-pressed="true"]{background:var(--ctl-brand);color:#fff;box-shadow:var(--v2-shadow-1);}
.wtc-seg button:disabled{opacity:.55;cursor:default;}
.wtc-actions{display:flex;flex-direction:column;gap:12px;margin-top:22px;}
.wtc-io{display:flex;gap:10px;}
.wtc-root button{font-family:inherit;cursor:pointer;}
.wtc-btn-tertiary{flex:1;padding:9px 12px;background:var(--v2-surface);color:var(--v2-ink-2);border:1px solid var(--v2-line-2);border-radius:var(--v2-r-md);font-size:13px;font-weight:600;}
.wtc-btn-tertiary:hover{background:var(--v2-surface-2);border-color:var(--v2-ink-3);}
.wtc-main{display:flex;gap:10px;}
.wtc-btn-secondary{flex:1;padding:11px 16px;background:var(--v2-surface);color:var(--v2-ink-1);border:1px solid var(--v2-line-1);border-radius:var(--v2-r-md);font-size:14px;font-weight:600;box-shadow:var(--v2-shadow-1);}
.wtc-btn-secondary:hover{background:var(--v2-surface-2);border-color:var(--v2-ink-2);}
.wtc-btn-primary{flex:1;padding:11px 16px;background:var(--v2-accent);color:#fff;border:none;border-radius:var(--v2-r-md);font-size:14px;font-weight:600;box-shadow:var(--v2-shadow-1);}
.wtc-btn-primary:hover{background:#142d54;box-shadow:var(--v2-shadow-2);}
.wtc-btn-primary:disabled{opacity:.6;cursor:not-allowed;}
.wtc-token{padding:14px;background:#e8f3ea;border:1px solid #86c79b;border-radius:var(--v2-r-md);margin-bottom:18px;font-size:13px;color:#1d5b34;word-break:break-all;}
.wtc-inline-launch{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px;background:var(--v2-surface);border:1px solid var(--v2-line-1);border-radius:var(--v2-r-lg);box-shadow:var(--v2-shadow-1);}
.wtc-inline-launch.compact{padding:12px;}
.wtc-inline-launch h3{margin:0 0 2px;font-size:14px;font-weight:600;color:var(--v2-ink-1);}
.wtc-inline-launch p{margin:0;font-size:12px;color:var(--v2-ink-3);}
`;

const REGION_OPTIONS: Array<{ value: WorkerTokenRegion; label: string }> = [
	{ value: 'us', label: 'North America — US (pingone.com)' },
	{ value: 'ca', label: 'Canada — CA (pingone.ca)' },
	{ value: 'eu', label: 'Europe — EMEA (pingone.eu)' },
	{ value: 'ap', label: 'Asia Pacific — APAC (pingone.asia)' },
];

/** The credential form + actions shared by both variants. */
const CredentialsBody: React.FC<{
	size: 'compact' | 'full';
	environmentIdSeed?: string | undefined;
	grantTypeSeed: WorkerTokenGrantType;
	redirectUriSeed?: string | undefined;
	onClose?: (() => void) | undefined;
	onTokenGenerated?: ((token: string) => void) | undefined;
}> = ({ size, environmentIdSeed = '', grantTypeSeed, redirectUriSeed = '', onClose, onTokenGenerated }) => {
	const [grantType, setGrantType] = useState<WorkerTokenGrantType>(grantTypeSeed);
	const [environmentId, setEnvironmentId] = useState(environmentIdSeed);
	const [clientId, setClientId] = useState('');
	const [clientSecret, setClientSecret] = useState('');
	const [scopeInput, setScopeInput] = useState(PINGONE_WORKER_MFA_SCOPE_STRING);
	const [region, setRegion] = useState<WorkerTokenRegion>('us');
	const [authMethod, setAuthMethod] = useState<WorkerTokenAuthMethod>('client_secret_basic');
	const [customDomain, setCustomDomain] = useState('');
	const [redirectUri, setRedirectUri] = useState(redirectUriSeed);
	const [showSecret, setShowSecret] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [currentToken, setCurrentToken] = useState<string | null>(null);

	const isAuthz = grantType === 'authorization_code';

	const handleGenerate = async () => {
		if (isAuthz) {
			modernMessaging.showBanner({
				type: 'info',
				title: 'Coming soon',
				message:
					'The Authorization Code worker-token flow is not wired yet. Use Client Credentials for now.',
				dismissible: true,
			});
			return;
		}
		const parsedScopes = scopeInput.split(/\s+/).map((s) => s.trim()).filter(Boolean);
		// Help text promises defaults when left empty — honor it instead of erroring.
		const scopes = parsedScopes.length > 0 ? parsedScopes : [PINGONE_WORKER_MFA_SCOPE_STRING];
		setIsGenerating(true);
		try {
			const result = await acquireWorkerToken({
				environmentId,
				clientId,
				clientSecret,
				scopes,
				region,
				authMethod,
				customDomain,
			});
			setCurrentToken(result.token);
			if (result.authMethodUsed !== authMethod) {
				setAuthMethod(result.authMethodUsed);
				modernMessaging.showFooterMessage({
					type: 'info',
					message: `Auth method auto-corrected to ${
						result.authMethodUsed === 'client_secret_basic' ? 'Client Secret Basic' : 'Client Secret Post'
					} and token generated.`,
					duration: 6000,
				});
			} else {
				modernMessaging.showFooterMessage({
					type: 'info',
					message: 'Worker token generated successfully.',
					duration: 3000,
				});
			}
			onTokenGenerated?.(result.token);
		} catch (error) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: error instanceof Error ? error.message : 'Failed to generate worker token',
				dismissible: true,
			});
		} finally {
			setIsGenerating(false);
		}
	};

	const handleExport = () => {
		if (!environmentId.trim() || !clientId.trim() || !clientSecret.trim()) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Please fill in all required fields before exporting',
				dismissible: true,
			});
			return;
		}
		const scopes = scopeInput.split(/\s+/).map((s) => s.trim()).filter(Boolean);
		const payload: WorkerTokenCredentialsPayload = {
			environmentId: environmentId.trim(),
			clientId: clientId.trim(),
			clientSecret: clientSecret.trim(),
			scopes: scopes.length > 0 ? scopes : [PINGONE_WORKER_MFA_SCOPE_STRING],
			region,
			customDomain: customDomain.trim(),
			authMethod,
		};
		exportWorkerTokenCredentials(payload);
		modernMessaging.showFooterMessage({
			type: 'info',
			message: 'Worker token credentials exported.',
			duration: 3000,
		});
	};

	const handleImport = () => {
		triggerFileImport(async (file) => {
			try {
				const imported = await importCredentials(file);
				const wt = imported.workerToken;
				if (!wt) {
					modernMessaging.showBanner({
						type: 'error',
						title: 'Error',
						message: 'The selected file does not contain worker token credentials',
						dismissible: true,
					});
					return;
				}
				if (wt.environmentId) setEnvironmentId(wt.environmentId);
				if (wt.clientId) setClientId(wt.clientId);
				if (wt.clientSecret) setClientSecret(wt.clientSecret);
				if (Array.isArray(wt.scopes) && wt.scopes.length > 0) setScopeInput(wt.scopes.join(' '));
				if (wt.customDomain) setCustomDomain(wt.customDomain);
				if (wt.authMethod === 'client_secret_basic' || wt.authMethod === 'client_secret_post') {
					setAuthMethod(wt.authMethod);
				}
				modernMessaging.showFooterMessage({
					type: 'info',
					message: 'Worker token credentials imported.',
					duration: 3000,
				});
			} catch (error) {
				modernMessaging.showBanner({
					type: 'error',
					title: 'Error',
					message: error instanceof Error ? error.message : 'Failed to import credentials',
					dismissible: true,
				});
			}
		});
	};

	return (
		<div className={`wtc-content${size === 'compact' ? ' wtc-content--compact' : ''}`}>
			{currentToken && (
				<div className="wtc-token">
					<strong>Worker token generated.</strong> Stored for API calls.
				</div>
			)}

			<details className="wtc-help">
				<summary>About worker tokens &amp; how to get credentials</summary>
				<div>
					Worker tokens authorize server-to-server PingOne management API calls and are valid for{' '}
					<strong>1 hour</strong> after generation. They require a Worker application with appropriate
					roles (e.g., "Identity Data Read Only" or "Environment Admin"). Recommended scopes:{' '}
					<code>{PINGONE_WORKER_MFA_SCOPE_STRING}</code>. To get credentials, open PingOne Console →
					Connections → Applications, create or select a Worker app, and copy the Environment ID,
					Client ID, and Client Secret.
				</div>
			</details>

			<div className="wtc-form">
				<div>
					<label>Grant Type <span className="wtc-req">*</span></label>
					<div className="wtc-seg" role="group" aria-label="Grant type">
						<button
							type="button"
							aria-pressed={!isAuthz}
							onClick={() => setGrantType('client_credentials')}
						>
							Client Credentials
						</button>
						<button
							type="button"
							aria-pressed={isAuthz}
							onClick={() => setGrantType('authorization_code')}
						>
							Authorization Code
						</button>
					</div>
					<small>
						{isAuthz
							? 'Interactive: an admin signs in and consents; the token is returned to the redirect URI below. (Coming soon.)'
							: 'Server-to-server: the worker app authenticates directly with its client secret.'}
					</small>
				</div>

				{isAuthz && (
					<div>
						<label htmlFor="wtc-redirect">Redirect URI <span className="wtc-req">*</span></label>
						<input
							id="wtc-redirect"
							type="text"
							value={redirectUri}
							onChange={(e) => setRedirectUri(e.target.value)}
							placeholder="https://localhost:3000/worker-token/callback"
						/>
						<small>Must exactly match a Redirect URI registered on the Worker app in PingOne.</small>
					</div>
				)}

				<div>
					<label htmlFor="wtc-env">Environment ID <span className="wtc-req">*</span></label>
					<input
						id="wtc-env"
						type="text"
						value={environmentId}
						onChange={(e) => setEnvironmentId(e.target.value)}
						placeholder="12345678-1234-1234-1234-123456789012"
					/>
				</div>
				<div>
					<label htmlFor="wtc-cid">Client ID <span className="wtc-req">*</span></label>
					<input
						id="wtc-cid"
						type="text"
						value={clientId}
						onChange={(e) => setClientId(e.target.value)}
						placeholder="abc123def456..."
					/>
				</div>
				<div>
					<label htmlFor="wtc-secret">Client Secret <span className="wtc-req">*</span></label>
					<div className="wtc-secret-wrap">
						<input
							id="wtc-secret"
							type={showSecret ? 'text' : 'password'}
							value={clientSecret}
							onChange={(e) => setClientSecret(e.target.value)}
							placeholder="••••••••••••••••"
						/>
						<button
							type="button"
							className="wtc-secret-toggle"
							onClick={() => setShowSecret((s) => !s)}
						>
							{showSecret ? 'HIDE' : 'SHOW'}
						</button>
					</div>
				</div>
				<div>
					<label htmlFor="wtc-scopes">Scopes <span className="wtc-req">*</span></label>
					<textarea
						id="wtc-scopes"
						rows={3}
						value={scopeInput}
						onChange={(e) => setScopeInput(e.target.value)}
					/>
					<small>Space-separated list. Leave empty for default scopes.</small>
				</div>
				<div>
					<label htmlFor="wtc-region">PingOne Location <span className="wtc-req">*</span></label>
					<select
						id="wtc-region"
						className="wtc-select"
						value={region}
						onChange={(e) => setRegion(e.target.value as WorkerTokenRegion)}
					>
						{REGION_OPTIONS.map((o) => (
							<option key={o.value} value={o.value}>
								{o.label}
							</option>
						))}
					</select>
					<small>Selects the PingOne regional domain your environment is hosted in.</small>
				</div>
				<div>
					<label htmlFor="wtc-auth">Token Endpoint Authentication</label>
					<select
						id="wtc-auth"
						className="wtc-select"
						value={authMethod}
						onChange={(e) => setAuthMethod(e.target.value as WorkerTokenAuthMethod)}
					>
						<option value="client_secret_basic">Client Secret Basic</option>
						<option value="client_secret_post">Client Secret Post</option>
					</select>
					<small>How the client authenticates to the token endpoint. Match your Worker app's setting.</small>
				</div>

				<details className="wtc-adv">
					<summary>Advanced options</summary>
					<div>
						<div>
							<label htmlFor="wtc-domain">Custom Domain (Optional)</label>
							<input
								id="wtc-domain"
								type="text"
								value={customDomain}
								onChange={(e) => setCustomDomain(e.target.value)}
								placeholder="auth.yourcompany.com"
							/>
							<small>If set, overrides the region-based domain. Leave empty to use the default.</small>
						</div>
					</div>
				</details>
			</div>

			<div className="wtc-actions">
				<div className="wtc-io">
					<button type="button" className="wtc-btn-tertiary" onClick={handleExport}>
						Export
					</button>
					<button type="button" className="wtc-btn-tertiary" onClick={handleImport}>
						Import
					</button>
				</div>
				<div className="wtc-main">
					{onClose && (
						<button type="button" className="wtc-btn-secondary" onClick={onClose}>
							Cancel
						</button>
					)}
					<button
						type="button"
						className="wtc-btn-primary"
						onClick={handleGenerate}
						disabled={isGenerating}
					>
						{isGenerating ? 'Generating…' : 'Generate Token'}
					</button>
				</div>
			</div>
		</div>
	);
};

const Dialog: React.FC<{
	size: 'compact' | 'full';
	environmentId?: string | undefined;
	grantType: WorkerTokenGrantType;
	redirectUri?: string | undefined;
	onClose: () => void;
	onTokenGenerated?: ((token: string) => void) | undefined;
}> = ({ size, environmentId, grantType, redirectUri, onClose, onTokenGenerated }) => {
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		document.addEventListener('keydown', onKey);
		return () => document.removeEventListener('keydown', onKey);
	}, [onClose]);

	return (
	<div className="wtc-root">
		<style>{SCOPED_CSS}</style>
		<div className="wtc-overlay" onClick={onClose}>
			<div className="wtc-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
				<div className="wtc-header">
					<div>
						<h2>Worker Token Credentials</h2>
						<p>Generate a worker token for API access</p>
					</div>
					<button type="button" className="wtc-close" aria-label="Close" onClick={onClose}>
						×
					</button>
				</div>
				<CredentialsBody
					size={size}
					environmentIdSeed={environmentId}
					grantTypeSeed={grantType}
					redirectUriSeed={redirectUri}
					onClose={onClose}
					onTokenGenerated={onTokenGenerated}
				/>
			</div>
		</div>
	</div>
	);
};

export const WorkerTokenCredentials: React.FC<WorkerTokenCredentialsProps> = ({
	variant = 'modal',
	size = 'full',
	isOpen,
	onClose,
	environmentId,
	grantType = 'client_credentials',
	redirectUri,
	onTokenGenerated,
}) => {
	const [inlineOpen, setInlineOpen] = useState(false);
	const [hasToken, setHasToken] = useState<boolean | null>(null);

	const refreshTokenStatus = useCallback(async () => {
		try {
			const token = await unifiedWorkerTokenService.getToken();
			setHasToken(!!token);
		} catch {
			setHasToken(false);
		}
	}, []);

	useEffect(() => {
		if (variant === 'inline') void refreshTokenStatus();
	}, [variant, refreshTokenStatus]);

	if (variant === 'inline') {
		return (
			<div className="wtc-root">
				<style>{SCOPED_CSS}</style>
				<div className={`wtc-inline-launch${size === 'compact' ? ' compact' : ''}`}>
					<div>
						<h3>Worker Token</h3>
						<p>
							{hasToken === null
								? 'Checking token status…'
								: hasToken
									? '● Active — a valid worker token is stored.'
									: '○ Not set — generate a worker token for PingOne management API access.'}
						</p>
					</div>
					<button type="button" className="wtc-btn-primary" onClick={() => setInlineOpen(true)}>
						{hasToken ? 'Manage Worker Token' : 'Get Worker Token'}
					</button>
				</div>
				{inlineOpen && (
					<Dialog
						size={size}
						environmentId={environmentId}
						grantType={grantType}
						redirectUri={redirectUri}
						onClose={() => setInlineOpen(false)}
						onTokenGenerated={(t) => {
							void refreshTokenStatus();
							onTokenGenerated?.(t);
						}}
					/>
				)}
			</div>
		);
	}

	if (!isOpen) return null;
	return (
		<Dialog
			size={size}
			environmentId={environmentId}
			grantType={grantType}
			redirectUri={redirectUri}
			onClose={() => onClose?.()}
			onTokenGenerated={onTokenGenerated}
		/>
	);
};

export default WorkerTokenCredentials;
