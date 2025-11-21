// src/pages/AuthorizationCallback.tsx
import React, { useEffect, useState } from 'react';
import { FiAlertCircle, FiCheckCircle, FiLoader } from 'react-icons/fi';
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
  background: #f8fafc;
  border: 2px solid #e2e8f0;
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
		const handleCallback = () => {
			console.log('🔄 [AuthCallback] ===== STARTING CALLBACK PROCESSING =====');
			console.log('🔄 [AuthCallback] Current URL:', window.location.href);
			console.log('🔄 [AuthCallback] Current timestamp:', new Date().toISOString());
			console.log('🔄 [AuthCallback] User agent:', navigator.userAgent);
			console.log('🔄 [AuthCallback] Document ready state:', document.readyState);

			// Get URL parameters
			const urlParams = new URLSearchParams(window.location.search);
			const code = urlParams.get('code');
			const state = urlParams.get('state');
			const errorParam = urlParams.get('error');
			const errorDescription = urlParams.get('error_description');

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
					code.substring(0, 10) + '...'
				);
				console.log('✅ [AuthCallback] Full authorization code length:', code.length);

				// Check if this is a popup window
				const isPopup = window.opener && !window.opener.closed;
				console.log('✅ [AuthCallback] Is popup window?', isPopup);

				// Store authorization code in sessionStorage
				console.log('✅ [AuthCallback] ===== STORING IN SESSION STORAGE =====');

				if (isPopup) {
					// If popup, store in the parent window's sessionStorage
					console.log('✅ [AuthCallback] Storing in parent window sessionStorage...');
					window.opener.sessionStorage.setItem('oidc_auth_code', code);
					if (state) {
						window.opener.sessionStorage.setItem('oidc_state', state);
					}
					window.opener.sessionStorage.setItem('oidc_auth_code_timestamp', Date.now().toString());
					window.opener.sessionStorage.setItem('oidc_callback_timestamp', new Date().toISOString());
					window.opener.sessionStorage.setItem('oidc_callback_url', window.location.href);
					console.log('✅ [AuthCallback] Stored in parent window sessionStorage');

					// Trigger a storage event in the parent window to notify about the new code
					console.log('✅ [AuthCallback] Triggering custom event in parent window...');
					window.opener.dispatchEvent(
						new CustomEvent('oidc-auth-code-received', {
							detail: { code, state, timestamp: Date.now() },
						})
					);

					// For debugging - don't close automatically, let user close manually
					console.log(
						'✅ [AuthCallback] DEBUG MODE - Popup will NOT close automatically. Close it manually when done debugging.'
					);
					// Commented out auto-close for debugging
					// setTimeout(() => {
					// 	window.close();
					// }, 60000);
				} else {
					// If not popup, store in this window's sessionStorage (original behavior)
					console.log('✅ [AuthCallback] Storing in current window sessionStorage...');
					sessionStorage.setItem('oidc_auth_code', code);
					if (state) {
						sessionStorage.setItem('oidc_state', state);
					}
					sessionStorage.setItem('oidc_auth_code_timestamp', Date.now().toString());
					sessionStorage.setItem('oidc_callback_timestamp', new Date().toISOString());
					sessionStorage.setItem('oidc_callback_url', window.location.href);
					console.log('✅ [AuthCallback] Stored oidc_auth_code in sessionStorage');
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
					// If popup, show success message and close it after delay
					console.log('✅ [AuthCallback] Popup mode - will close automatically in 60 seconds');
					// The popup will close from the earlier setTimeout
				} else {
					// If not popup, redirect back to the OIDC flow after a short delay
					console.log('✅ [AuthCallback] ===== SCHEDULING REDIRECT =====');
					console.log('✅ [AuthCallback] Scheduling redirect to V6 flow in 3 seconds...');
					setTimeout(() => {
						setRedirecting(true);
						console.log('✅ [AuthCallback] Redirecting now to /flows/oidc-authorization-code-v6');
						setTimeout(() => {
							console.log('✅ [AuthCallback] Executing window.location.href redirect...');
							window.location.href = '/flows/oidc-authorization-code-v6';
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

						{status === 'success' && !redirecting && (
							<RedirectingMessage>
								✅ DEBUG MODE: Authorization code received and saved! Check console for details.
								Popup will NOT close automatically - close manually when done debugging.
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
