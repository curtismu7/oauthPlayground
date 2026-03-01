// src/pages/AuthorizationCallback.tsx

import { FiAlertCircle, FiCheckCircle } from '@icons';
import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';

// Animation for loading spinner
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
`;

const Card = styled.div`
  background: white;
  border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  padding: 3rem;
  max-width: 500px;
  width: 100%;
  text-align: center;
`;

const IconContainer = styled.div<{ $success: boolean; $error: boolean }>`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 2rem;
  background: ${({ $success, $error }) =>
		$success
			? 'linear-gradient(135deg, #10b981, #059669)'
			: $error
				? 'linear-gradient(135deg, #ef4444, #dc2626)'
				: 'linear-gradient(135deg, #3b82f6, #2563eb)'};
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const Title = styled.h1<{ $success: boolean; $error: boolean }>`
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  color: ${({ $success, $error }) => ($success ? '#10b981' : $error ? '#ef4444' : '#1f2937')};
`;

const Message = styled.p`
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 2rem 0;
  line-height: 1.6;
`;

const CodeDisplay = styled.div`
  background: #f0fdf4; /* Light green for generated content */
  border: 2px solid #16a34a;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  word-break: break-all;
  color: #1f2937;
`;

const ErrorDetails = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem 0;
  color: #991b1b;
  font-size: 0.875rem;
`;

const RedirectingMessage = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  font-style: italic;
`;

const AuthorizationCallback: React.FC = () => {
	const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
	const [authCode, setAuthCode] = useState<string>('');
	const [error, setError] = useState<string>('');
	const [redirecting, setRedirecting] = useState(false);

	useEffect(() => {
		// Set a flag IMMEDIATELY when this page loads (before any other logic)
		try {
			const testFlag = {
				loaded: true,
				timestamp: new Date().toISOString(),
				url: window.location.href,
				isOpener: !!window.opener,
			};

			// Try to save to BOTH locations
			localStorage.setItem('callback_page_loaded', JSON.stringify(testFlag));
			if (window.opener && !window.opener.closed) {
				window.opener.localStorage.setItem('callback_page_loaded', JSON.stringify(testFlag));
			}
		} catch (err) {
			console.error('Failed to set callback_page_loaded flag:', err);
		}

		const handleCallback = () => {
			// Save debug info to localStorage IMMEDIATELY so we can check it from main window
			const debugInfo: Record<string, unknown> = {
				timestamp: new Date().toISOString(),
				url: window.location.href,
				search: window.location.search,
				hash: window.location.hash,
				isPopup: !!(window.opener && !window.opener.closed),
				openerExists: !!window.opener,
				openerClosed: window.opener ? window.opener.closed : 'N/A',
			};

			console.log('🔄 [AuthCallback] ===== STARTING CALLBACK PROCESSING =====');
			console.log('🔄 [AuthCallback] Current URL:', window.location.href);
			console.log('🔄 [AuthCallback] Is popup?', debugInfo.isPopup);

			// Get URL parameters
			const urlParams = new URLSearchParams(window.location.search);
			const code = urlParams.get('code');
			const state = urlParams.get('state');
			const errorParam = urlParams.get('error');
			const errorDescription = urlParams.get('error_description');

			debugInfo.hasCode = !!code;
			debugInfo.codeLength = code ? code.length : 0;
			debugInfo.state = state || 'NULL';
			debugInfo.error = errorParam || 'NULL';
			debugInfo.errorDescription = errorDescription || 'NULL';

			// Save to localStorage immediately
			try {
				const storageToUse = debugInfo.isPopup ? window.opener.localStorage : localStorage;
				storageToUse.setItem('callback_debug_info', JSON.stringify(debugInfo));
				console.log('✅ [AuthCallback] Debug info saved to localStorage');
			} catch (err) {
				console.error('❌ [AuthCallback] Failed to save debug info:', err);
			}

			console.log('🔄 [AuthCallback] ===== URL PARAMETER ANALYSIS =====');
			console.log('🔄 [AuthCallback] URL search params:', window.location.search);
			console.log('🔄 [AuthCallback] All URL params:', Object.fromEntries(urlParams.entries()));
			console.log(
				'🔄 [AuthCallback] Code parameter:',
				code ? `${code.substring(0, 10)}...` : 'NULL'
			);
			console.log('🔄 [AuthCallback] State parameter:', state || 'NULL');
			console.log('🔄 [AuthCallback] Error parameter:', errorParam || 'NULL');
			console.log('🔄 [AuthCallback] Error description:', errorDescription || 'NULL');

			// Check sessionStorage before processing
			console.log('🔄 [AuthCallback] ===== SESSION STORAGE BEFORE PROCESSING =====');
			const allSessionKeys = Object.keys(sessionStorage);
			console.log('🔄 [AuthCallback] All sessionStorage keys:', allSessionKeys);
			allSessionKeys.forEach((key) => {
				if (key.includes('oidc') || key.includes('auth')) {
					console.log(`🔄 [AuthCallback] ${key}:`, sessionStorage.getItem(key));
				}
			});

			// Handle authorization error
			if (errorParam) {
				console.error('❌ [AuthCallback] Authorization error:', errorParam, errorDescription);
				setError(`${errorParam}: ${errorDescription || 'Unknown error'}`);
				setStatus('error');
				return;
			}

			// Handle successful authorization
			if (code) {
				console.log('✅ [AuthCallback] ===== SUCCESSFUL AUTHORIZATION DETECTED =====');
				console.log(
					'✅ [AuthCallback] Authorization code received:',
					`${code.substring(0, 10)}...`
				);
				console.log('✅ [AuthCallback] Full authorization code length:', code.length);

				// Check if this is a popup window
				const isPopup = window.opener && !window.opener.closed;
				console.log('✅ [AuthCallback] Is popup window?', isPopup);

				// Detect flow type from sessionStorage to know where to redirect
				const _storageToCheck = isPopup ? window.opener.sessionStorage : sessionStorage;
				const activeFlow =
					storageToCheck.getItem('active_oauth_flow') || 'oidc-authorization-code-v6';
				console.log('✅ [AuthCallback] Active flow type:', activeFlow);

				// Store authorization code in sessionStorage
				console.log('✅ [AuthCallback] ===== STORING IN SESSION STORAGE =====');

				// Determine flow-specific keys
				const isOAuthFlow = activeFlow.includes('oauth-authorization-code');
				const isOIDCFlow =
					activeFlow.includes('oidc-authorization-code') || activeFlow.includes('oidc-v');
				const isPARFlow = activeFlow.includes('par');
				const isRARFlow = activeFlow.includes('rar');

				// Store with both generic and flow-specific keys for compatibility
				if (isPopup) {
					// If popup, store in the parent window's sessionStorage
					console.log('✅ [AuthCallback] Storing in parent window sessionStorage...');

					// Generic keys (for compatibility)
					window.opener.sessionStorage.setItem('oidc_auth_code', code);
					window.opener.sessionStorage.setItem('auth_code', code);

					// Flow-specific keys
					if (isOAuthFlow) {
						window.opener.sessionStorage.setItem('oauth-authorization-code-v6-authCode', code);
						console.log('✅ [AuthCallback] Stored OAuth-specific code');
					}
					if (isOIDCFlow) {
						window.opener.sessionStorage.setItem('oidc-authorization-code-v6-authCode', code);
						console.log('✅ [AuthCallback] Stored OIDC-specific code');
					}
					if (isPARFlow) {
						window.opener.sessionStorage.setItem('par-flow-authCode', code);
						console.log('✅ [AuthCallback] Stored PAR-specific code');
					}
					if (isRARFlow) {
						window.opener.sessionStorage.setItem('rar-flow-authCode', code);
						console.log('✅ [AuthCallback] Stored RAR-specific code');
					}

					if (state) {
						window.opener.sessionStorage.setItem('oidc_state', state);
						window.opener.sessionStorage.setItem('oauth_state', state);
					}
					window.opener.sessionStorage.setItem('oidc_auth_code_timestamp', Date.now().toString());
					window.opener.sessionStorage.setItem('oidc_callback_timestamp', new Date().toISOString());
					window.opener.sessionStorage.setItem('oidc_callback_url', window.location.href);
					window.opener.sessionStorage.setItem('restore_step', '3'); // Go to token exchange step
					console.log('✅ [AuthCallback] Stored in parent window sessionStorage');

					// Trigger a storage event in the parent window to notify about the new code
					console.log('✅ [AuthCallback] Triggering custom event in parent window...');
					window.opener.dispatchEvent(
						new CustomEvent('auth-code-received', {
							detail: { code, state, timestamp: Date.now(), flowType: activeFlow },
						})
					);
					console.log('✅ [AuthCallback] Custom event dispatched!');

					// Set a callback completion flag as backup communication method
					window.opener.sessionStorage.setItem('callback_processed', Date.now().toString());
					window.opener.sessionStorage.setItem('callback_flow_type', activeFlow);
					console.log('✅ [AuthCallback] Set callback_processed flag for polling fallback');

					// DEBUG MODE: Don't auto-close so we can see logs
					console.log('🐛 [AuthCallback] DEBUG MODE: Popup will NOT auto-close');
					console.log('🐛 [AuthCallback] Please close this popup manually after reviewing logs');
					// Auto-close popup after 2 seconds
					// console.log('✅ [AuthCallback] Auto-closing popup in 2 seconds...');
					// setTimeout(() => {
					// 	console.log('✅ [AuthCallback] Closing popup now');
					// 	window.close();
					// }, 2000);
				} else {
					// If not popup, store in this window's sessionStorage (original behavior)
					console.log('✅ [AuthCallback] Storing in current window sessionStorage...');

					// Generic keys
					sessionStorage.setItem('oidc_auth_code', code);
					sessionStorage.setItem('auth_code', code);

					// Flow-specific keys
					if (isOAuthFlow) {
						sessionStorage.setItem('oauth-authorization-code-v6-authCode', code);
					}
					if (isOIDCFlow) {
						sessionStorage.setItem('oidc-authorization-code-v6-authCode', code);
					}
					if (isPARFlow) {
						sessionStorage.setItem('par-flow-authCode', code);
					}
					if (isRARFlow) {
						sessionStorage.setItem('rar-flow-authCode', code);
					}

					if (state) {
						sessionStorage.setItem('oidc_state', state);
						sessionStorage.setItem('oauth_state', state);
					}
					sessionStorage.setItem('oidc_auth_code_timestamp', Date.now().toString());
					sessionStorage.setItem('oidc_callback_timestamp', new Date().toISOString());
					sessionStorage.setItem('oidc_callback_url', window.location.href);
					sessionStorage.setItem('restore_step', '3'); // Go to token exchange step
					console.log('✅ [AuthCallback] Stored auth codes with flow-specific keys');
				}

				// Verify storage worked
				console.log('✅ [AuthCallback] ===== VERIFICATION OF STORAGE =====');
				const storageToCheck = isPopup ? window.opener.sessionStorage : sessionStorage;
				const verifyCode = storageToCheck.getItem('oidc_auth_code');
				const verifyTimestamp = storageToCheck.getItem('oidc_auth_code_timestamp');
				const verifyState = storageToCheck.getItem('oidc_state');
				const verifyCallbackTimestamp = storageToCheck.getItem('oidc_callback_timestamp');
				const verifyCallbackUrl = storageToCheck.getItem('oidc_callback_url');

				console.log('✅ [AuthCallback] Verification results:', {
					isPopup,
					code: verifyCode
						? `${verifyCode.substring(0, 10)}... (length: ${verifyCode.length})`
						: 'NOT FOUND',
					timestamp: verifyTimestamp,
					state: verifyState || 'NOT FOUND',
					callbackTimestamp: verifyCallbackTimestamp || 'NOT FOUND',
					callbackUrl: verifyCallbackUrl || 'NOT FOUND',
					allOidcKeys: Object.keys(storageToCheck).filter((k) => k.includes('oidc')),
				});

				setAuthCode(code);
				setStatus('success');

				if (isPopup) {
					// If popup, show success message - auto-close is handled above
					console.log('✅ [AuthCallback] Popup mode - will auto-close in 2 seconds');
				} else {
					// If not popup, redirect back to the flow after a short delay
					console.log('✅ [AuthCallback] ===== SCHEDULING REDIRECT =====');

					// Determine redirect path based on active flow
					let redirectPath = '/flows/oidc-authorization-code-v6'; // Default
					if (activeFlow.includes('oauth-authorization-code')) {
						redirectPath = '/flows/oauth-authorization-code-v6';
					} else if (activeFlow.includes('oidc-authorization-code')) {
						redirectPath = '/flows/oidc-authorization-code-v6';
					} else if (activeFlow.includes('par')) {
						redirectPath = '/flows/par-flow';
					} else if (activeFlow.includes('rar')) {
						redirectPath = '/flows/rar-flow';
					}

					console.log('✅ [AuthCallback] Scheduling redirect to', redirectPath, 'in 3 seconds...');
					setTimeout(() => {
						setRedirecting(true);
						console.log('✅ [AuthCallback] Redirecting now to', redirectPath);
						setTimeout(() => {
							console.log('✅ [AuthCallback] Executing window.location.href redirect...');
							window.location.href = redirectPath;
						}, 1000);
					}, 3000);
				}
			} else {
				console.error('❌ [AuthCallback] ===== NO AUTHORIZATION CODE FOUND =====');
				console.error('❌ [AuthCallback] URL search params:', window.location.search);
				console.error(
					'❌ [AuthCallback] All URL params:',
					Object.fromEntries(new URLSearchParams(window.location.search).entries())
				);
				setError('No authorization code received from PingOne');
				setStatus('error');
			}
		};

		// Small delay to ensure page is fully loaded
		const timer = setTimeout(handleCallback, 100);

		return () => clearTimeout(timer);
	}, []);

	return (
		<Container>
			<Card>
				<IconContainer $success={status === 'success'} $error={status === 'error'}>
					{status === 'loading' && <Spinner />}
					{status === 'success' && <FiCheckCircle size={40} color="white" />}
					{status === 'error' && <FiAlertCircle size={40} color="white" />}
				</IconContainer>

				{status === 'loading' && (
					<>
						<Title $success={false} $error={false}>
							Processing Authorization
						</Title>
						<Message>
							Please wait while we process your authorization response from PingOne...
						</Message>
					</>
				)}

				{status === 'success' && (
					<>
						<Title $success={true} $error={false}>
							Authorization Successful!
						</Title>
						<Message>
							Your authorization was successful. We've received your authorization code and are
							redirecting you back to the flow.
						</Message>
						{authCode && <CodeDisplay>Authorization Code: {authCode}</CodeDisplay>}
						{redirecting && (
							<RedirectingMessage>
								Redirecting you back to the OIDC Authorization Code Flow with your authorization
								code...
							</RedirectingMessage>
						)}

						{!redirecting && (
							<RedirectingMessage>
								🐛 DEBUG MODE: Popup will stay open so you can review the console logs. Close this
								window manually when done.
							</RedirectingMessage>
						)}
					</>
				)}

				{status === 'error' && (
					<>
						<Title $success={false} $error={true}>
							Authorization Failed
						</Title>
						<Message>There was an error during the authorization process.</Message>
						{error && <ErrorDetails>Error: {error}</ErrorDetails>}
						<RedirectingMessage>
							You will be redirected back to the flow in a moment...
						</RedirectingMessage>
					</>
				)}
			</Card>
		</Container>
	);
};

export default AuthorizationCallback;
