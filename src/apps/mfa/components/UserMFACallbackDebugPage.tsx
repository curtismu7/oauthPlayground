/**
 * @file UserMFACallbackDebugPage.tsx
 * @module v8/components
 * @description Debug page for OAuth callback in unified MFA flow
 * Shows all callback parameters and navigation state for troubleshooting
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { sendAnalyticsLog } from '@/v8/utils/analyticsLoggerV8';

const MODULE_TAG = '[🔍 MFA-CALLBACK-DEBUG]';

interface DebugInfo {
	timestamp: string;
	currentUrl: string;
	pathname: string;
	search: string;
	hash: string;
	origin: string;
	callbackParams: Record<string, string>;
	sessionStorageKeys: string[];
	sessionStorageData: Record<string, string>;
	returnPath: string | null;
	willRedirect: boolean;
	redirectTarget: string | null;
	error: string | null;
}

export const UserMFACallbackDebugPage: React.FC = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const _location = useLocation();
	const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
	const [countdown, setCountdown] = useState(10);
	const [autoRedirectEnabled, setAutoRedirectEnabled] = useState(true);

	useEffect(() => {
		// Gather all debug information
		const code = searchParams.get('code');
		const state = searchParams.get('state');
		const error = searchParams.get('error');
		const errorDescription = searchParams.get('error_description');

		// Get all callback params
		const callbackParams: Record<string, string> = {};
		searchParams.forEach((value, key) => {
			callbackParams[key] = value;
		});

		// Get all sessionStorage keys
		const sessionKeys = Object.keys(sessionStorage);

		// Get relevant sessionStorage data
		const sessionData: Record<string, string> = {};
		const relevantKeys = [
			'user_login_state_v8',
			'user_login_return_to_mfa',
			'user_login_code_verifier_v8',
			'user_login_redirect_uri_v8',
			'user_login_credentials_temp_v8',
			'mfa_oauth_callback_return',
			'mfa_redirect_intent',
			'mfa_pending_registration',
		];

		relevantKeys.forEach((key) => {
			const value = sessionStorage.getItem(key);
			if (value) {
				sessionData[key] = value;
			}
		});

		// Get return path
		const returnPath = sessionStorage.getItem('user_login_return_to_mfa');

		// Determine redirect target
		let redirectTarget: string | null = null;
		let willRedirect = false;

		if (returnPath) {
			const callbackParamsStr = new URLSearchParams(window.location.search).toString();
			redirectTarget = callbackParamsStr ? `${returnPath}?${callbackParamsStr}` : returnPath;
			willRedirect = true;
		}

		const info: DebugInfo = {
			timestamp: new Date().toISOString(),
			currentUrl: window.location.href,
			pathname: window.location.pathname,
			search: window.location.search,
			hash: window.location.hash,
			origin: window.location.origin,
			callbackParams,
			sessionStorageKeys: sessionKeys,
			sessionStorageData: sessionData,
			returnPath,
			willRedirect,
			redirectTarget,
			error: error ? `${error}: ${errorDescription || 'No description'}` : null,
		};

		setDebugInfo(info);

		// Log to analytics
		sendAnalyticsLog({
			location: 'UserMFACallbackDebugPage.tsx:mounted',
			message: 'OAuth callback debug page loaded',
			data: info,
			timestamp: Date.now(),
			sessionId: 'debug-session',
			runId: 'callback-debug',
			hypothesisId: 'CALLBACK-DEBUG',
		});

		// Log to console with detailed formatting
		console.log(`${MODULE_TAG} ========================================`);
		console.log(`${MODULE_TAG} OAUTH CALLBACK DEBUG PAGE LOADED`);
		console.log(`${MODULE_TAG} ========================================`);
		console.log(`${MODULE_TAG} Timestamp:`, info.timestamp);
		console.log(`${MODULE_TAG} Current URL:`, info.currentUrl);
		console.log(`${MODULE_TAG} Pathname:`, info.pathname);
		console.log(`${MODULE_TAG} Search:`, info.search);
		console.log(`${MODULE_TAG} ========================================`);
		console.log(`${MODULE_TAG} CALLBACK PARAMETERS:`);
		console.log(`${MODULE_TAG} Code present:`, !!code);
		console.log(`${MODULE_TAG} State present:`, !!state);
		console.log(`${MODULE_TAG} Error:`, error || 'None');
		console.log(`${MODULE_TAG} All params:`, callbackParams);
		console.log(`${MODULE_TAG} ========================================`);
		console.log(`${MODULE_TAG} SESSION STORAGE:`);
		console.log(`${MODULE_TAG} Total keys:`, sessionKeys.length);
		console.log(`${MODULE_TAG} All keys:`, sessionKeys);
		console.log(`${MODULE_TAG} Relevant data:`, sessionData);
		console.log(`${MODULE_TAG} ========================================`);
		console.log(`${MODULE_TAG} NAVIGATION:`);
		console.log(`${MODULE_TAG} Return path:`, returnPath || 'NOT FOUND');
		console.log(`${MODULE_TAG} Will redirect:`, willRedirect);
		console.log(`${MODULE_TAG} Redirect target:`, redirectTarget || 'N/A');
		console.log(`${MODULE_TAG} ========================================`);
	}, [searchParams]);

	// Countdown timer for auto-redirect
	const handleRedirect = useCallback(() => {
		if (!debugInfo?.redirectTarget) return;

		console.log(`${MODULE_TAG} 🚀 Executing redirect to:`, debugInfo.redirectTarget);

		// Set marker that we're returning from OAuth callback
		sessionStorage.setItem('mfa_oauth_callback_return', 'true');

		// Store redirect intent as backup
		sessionStorage.setItem('mfa_redirect_intent', debugInfo.redirectTarget);

		// Use window.location.replace for immediate redirect
		window.location.replace(debugInfo.redirectTarget);
	}, [debugInfo]);

	useEffect(() => {
		if (!autoRedirectEnabled || !debugInfo?.willRedirect) return;

		if (countdown <= 0) {
			handleRedirect();
			return;
		}

		const timer = setTimeout(() => {
			setCountdown((prev) => prev - 1);
		}, 1000);

		return () => clearTimeout(timer);
	}, [countdown, autoRedirectEnabled, debugInfo, handleRedirect]);

	const handleManualRedirect = () => {
		if (!debugInfo?.redirectTarget) return;

		console.log(`${MODULE_TAG} 👆 Manual redirect triggered`);
		handleRedirect();
	};

	const handleCopyDebugInfo = () => {
		if (!debugInfo) return;
		navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
		// Use console.log instead of alert for better UX
		console.log(`${MODULE_TAG} Debug info copied to clipboard:`, debugInfo);
	};

	if (!debugInfo) {
		return (
			<div style={{ padding: '40px', textAlign: 'center' }}>
				<h2>Loading debug information...</h2>
			</div>
		);
	}

	return (
		<div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'monospace' }}>
			<div
				style={{
					background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
					color: 'white',
					padding: '24px',
					borderRadius: '12px',
					marginBottom: '24px',
				}}
			>
				<h1 style={{ margin: 0, fontSize: '28px' }}>🔍 OAuth Callback Debug Page</h1>
				<p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>Unified MFA Flow - Callback Handler</p>
			</div>

			{debugInfo.error && (
				<div
					style={{
						background: '#fee',
						border: '2px solid #f00',
						padding: '16px',
						borderRadius: '8px',
						marginBottom: '24px',
						color: '#c00',
					}}
				>
					<h3 style={{ margin: '0 0 8px 0' }}>❌ OAuth Error</h3>
					<p style={{ margin: 0 }}>{debugInfo.error}</p>
				</div>
			)}

			{debugInfo.willRedirect && (
				<div
					style={{
						background: '#e8f5e9',
						border: '2px solid #4caf50',
						padding: '16px',
						borderRadius: '8px',
						marginBottom: '24px',
					}}
				>
					<h3 style={{ margin: '0 0 8px 0' }}>✅ Redirect Target Found</h3>
					<p style={{ margin: '0 0 12px 0', wordBreak: 'break-all' }}>
						<strong>Target:</strong> {debugInfo.redirectTarget}
					</p>
					<div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
						<button
							type="button"
							onClick={handleManualRedirect}
							style={{
								padding: '12px 24px',
								background: '#4caf50',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								cursor: 'pointer',
								fontSize: '16px',
								fontWeight: '600',
							}}
						>
							Redirect Now
						</button>
						{autoRedirectEnabled ? (
							<>
								<span style={{ fontSize: '14px' }}>Auto-redirecting in {countdown} seconds...</span>
								<button
									type="button"
									onClick={() => setAutoRedirectEnabled(false)}
									style={{
										padding: '8px 16px',
										background: '#ff9800',
										color: 'white',
										border: 'none',
										borderRadius: '6px',
										cursor: 'pointer',
										fontSize: '14px',
									}}
								>
									Cancel Auto-Redirect
								</button>
							</>
						) : (
							<button
								type="button"
								onClick={() => {
									setAutoRedirectEnabled(true);
									setCountdown(10);
								}}
								style={{
									padding: '8px 16px',
									background: '#2196f3',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									cursor: 'pointer',
									fontSize: '14px',
								}}
							>
								Enable Auto-Redirect
							</button>
						)}
					</div>
				</div>
			)}

			{!debugInfo.willRedirect && (
				<div
					style={{
						background: '#fff3e0',
						border: '2px solid #ff9800',
						padding: '16px',
						borderRadius: '8px',
						marginBottom: '24px',
					}}
				>
					<h3 style={{ margin: '0 0 8px 0' }}>⚠️ No Return Path Found</h3>
					<p style={{ margin: 0 }}>
						sessionStorage key 'user_login_return_to_mfa' is missing or empty
					</p>
				</div>
			)}

			<div style={{ display: 'grid', gap: '24px' }}>
				{/* Current URL Info */}
				<div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '8px' }}>
					<h3 style={{ margin: '0 0 12px 0' }}>📍 Current URL</h3>
					<div style={{ fontSize: '12px' }}>
						<p>
							<strong>Full URL:</strong> {debugInfo.currentUrl}
						</p>
						<p>
							<strong>Pathname:</strong> {debugInfo.pathname}
						</p>
						<p>
							<strong>Search:</strong> {debugInfo.search || '(empty)'}
						</p>
						<p>
							<strong>Hash:</strong> {debugInfo.hash || '(empty)'}
						</p>
					</div>
				</div>

				{/* Callback Parameters */}
				<div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '8px' }}>
					<h3 style={{ margin: '0 0 12px 0' }}>📦 Callback Parameters</h3>
					<pre
						style={{
							background: 'white',
							padding: '12px',
							borderRadius: '4px',
							overflow: 'auto',
							fontSize: '12px',
						}}
					>
						{JSON.stringify(debugInfo.callbackParams, null, 2)}
					</pre>
				</div>

				{/* Session Storage */}
				<div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '8px' }}>
					<h3 style={{ margin: '0 0 12px 0' }}>💾 Session Storage</h3>
					<p style={{ fontSize: '12px', marginBottom: '12px' }}>
						<strong>Total Keys:</strong> {debugInfo.sessionStorageKeys.length}
					</p>
					<details>
						<summary style={{ cursor: 'pointer', marginBottom: '8px' }}>
							All Keys ({debugInfo.sessionStorageKeys.length})
						</summary>
						<pre
							style={{
								background: 'white',
								padding: '12px',
								borderRadius: '4px',
								overflow: 'auto',
								fontSize: '11px',
							}}
						>
							{debugInfo.sessionStorageKeys.join('\n')}
						</pre>
					</details>
					<h4 style={{ margin: '12px 0 8px 0', fontSize: '14px' }}>Relevant Data:</h4>
					<pre
						style={{
							background: 'white',
							padding: '12px',
							borderRadius: '4px',
							overflow: 'auto',
							fontSize: '12px',
						}}
					>
						{JSON.stringify(debugInfo.sessionStorageData, null, 2)}
					</pre>
				</div>

				{/* Navigation Info */}
				<div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '8px' }}>
					<h3 style={{ margin: '0 0 12px 0' }}>🧭 Navigation</h3>
					<div style={{ fontSize: '12px' }}>
						<p>
							<strong>Return Path:</strong> {debugInfo.returnPath || '❌ NOT FOUND'}
						</p>
						<p>
							<strong>Will Redirect:</strong> {debugInfo.willRedirect ? '✅ Yes' : '❌ No'}
						</p>
						<p>
							<strong>Redirect Target:</strong> {debugInfo.redirectTarget || 'N/A'}
						</p>
					</div>
				</div>

				{/* Actions */}
				<div style={{ display: 'flex', gap: '12px' }}>
					<button
						type="button"
						onClick={handleCopyDebugInfo}
						style={{
							padding: '12px 24px',
							background: '#2196f3',
							color: 'white',
							border: 'none',
							borderRadius: '6px',
							cursor: 'pointer',
							fontSize: '14px',
						}}
					>
						📋 Copy Debug Info
					</button>
					<button
						type="button"
						onClick={() => navigate('/v8/unified-mfa')}
						style={{
							padding: '12px 24px',
							background: '#9c27b0',
							color: 'white',
							border: 'none',
							borderRadius: '6px',
							cursor: 'pointer',
							fontSize: '14px',
						}}
					>
						🏠 Go to MFA Unified
					</button>
					<button
						type="button"
						onClick={() => {
							sessionStorage.clear();
							window.location.reload();
						}}
						style={{
							padding: '12px 24px',
							background: '#f44336',
							color: 'white',
							border: 'none',
							borderRadius: '6px',
							cursor: 'pointer',
							fontSize: '14px',
						}}
					>
						🗑️ Clear Session & Reload
					</button>
				</div>
			</div>

			<div
				style={{
					marginTop: '24px',
					padding: '16px',
					background: '#e3f2fd',
					borderRadius: '8px',
					fontSize: '12px',
				}}
			>
				<h4 style={{ margin: '0 0 8px 0' }}>💡 Debugging Tips:</h4>
				<ul style={{ margin: 0, paddingLeft: '20px' }}>
					<li>Check if 'user_login_return_to_mfa' exists in sessionStorage</li>
					<li>Verify the return path starts with '/v8/mfa'</li>
					<li>Confirm OAuth callback parameters (code, state) are present</li>
					<li>Look for the 'mfa_pending_registration' data if in user flow</li>
					<li>Check browser console for additional log messages tagged with {MODULE_TAG}</li>
				</ul>
			</div>
		</div>
	);
};
