import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FiCheckCircle, FiAlertCircle, FiLoader } from 'react-icons/fi';
import { v4ToastManager } from '../utils/v4ToastMessages';

const LOG_PREFIX = '[🔀 OIDC-HYBRID]';

const log = {
	info: (message: string, ...args: any[]) => {
		const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
		console.log(`${timestamp} ${LOG_PREFIX} [INFO]`, message, ...args);
	},
	error: (message: string, ...args: any[]) => {
		const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
		console.error(`${timestamp} ${LOG_PREFIX} [ERROR]`, message, ...args);
	},
	success: (message: string, ...args: any[]) => {
		const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
		console.log(`${timestamp} ${LOG_PREFIX} [SUCCESS]`, message, ...args);
	},
};

const CallbackContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 100vh;
	padding: 2rem;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const CallbackCard = styled.div`
	background: white;
	border-radius: 1rem;
	padding: 3rem;
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	max-width: 600px;
	width: 100%;
	text-align: center;
`;

const IconContainer = styled.div<{ $status: 'loading' | 'success' | 'error' }>`
	font-size: 4rem;
	margin-bottom: 1.5rem;
	color: ${({ $status }) =>
		$status === 'success' ? '#10b981' : $status === 'error' ? '#ef4444' : '#3b82f6'};
	
	${({ $status }) =>
		$status === 'loading' &&
		`
		animation: spin 1s linear infinite;
		@keyframes spin {
			from { transform: rotate(0deg); }
			to { transform: rotate(360deg); }
		}
	`}
`;

const Title = styled.h1`
	font-size: 1.875rem;
	font-weight: 700;
	color: #1e293b;
	margin-bottom: 1rem;
`;

const Message = styled.p`
	font-size: 1.125rem;
	color: #64748b;
	margin-bottom: 2rem;
	line-height: 1.6;
`;

const ErrorDetails = styled.div`
	background: #fef2f2;
	border: 1px solid #fecaca;
	border-radius: 0.5rem;
	padding: 1rem;
	margin-top: 1rem;
	text-align: left;
`;

const ErrorText = styled.pre`
	color: #991b1b;
	font-size: 0.875rem;
	margin: 0;
	white-space: pre-wrap;
	word-break: break-word;
`;

// Validate ID Token (basic JWT structure validation)
const validateIdToken = (idToken: string, expectedNonce: string): boolean => {
	try {
		const parts = idToken.split('.');
		if (parts.length !== 3) {
			log.error('Invalid ID token structure');
			return false;
		}

		// Decode payload
		const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

		// Validate nonce
		if (payload.nonce !== expectedNonce) {
			log.error('Nonce mismatch', { expected: expectedNonce, received: payload.nonce });
			return false;
		}

		// Check expiration
		const now = Math.floor(Date.now() / 1000);
		if (payload.exp && payload.exp < now) {
			log.error('ID token expired');
			return false;
		}

		log.success('ID token validated successfully');
		return true;
	} catch (err) {
		log.error('ID token validation failed', err);
		return false;
	}
};

const HybridCallback: React.FC = () => {
	const navigate = useNavigate();
	const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
	const [message, setMessage] = useState('Processing authorization response...');
	const [errorDetails, setErrorDetails] = useState<string | null>(null);

	useEffect(() => {
		const processCallback = async () => {
			try {
				log.info('Processing hybrid flow callback');

				// Parse fragment parameters (hybrid flow returns tokens in fragment)
				const fragment = window.location.hash.substring(1);
				const params = new URLSearchParams(fragment);

				// Check for errors
				const error = params.get('error');
				if (error) {
					const errorDescription = params.get('error_description') || error;
					throw new Error(errorDescription);
				}

				// Extract tokens and code
				const code = params.get('code');
				const idToken = params.get('id_token');
				const accessToken = params.get('access_token');
				const tokenType = params.get('token_type');
				const expiresIn = params.get('expires_in');
				const scope = params.get('scope');
				const state = params.get('state');

				log.info('Callback parameters received', {
					hasCode: !!code,
					hasIdToken: !!idToken,
					hasAccessToken: !!accessToken,
					hasState: !!state,
				});

				// Validate state
				const expectedState = sessionStorage.getItem('hybrid_state');
				if (!state || state !== expectedState) {
					throw new Error('State mismatch - possible CSRF attack');
				}

				log.success('State validated successfully');

				// Validate ID token if present
				if (idToken) {
					const expectedNonce = sessionStorage.getItem('hybrid_nonce');
					if (!expectedNonce) {
						throw new Error('No nonce found in session');
					}

					if (!validateIdToken(idToken, expectedNonce)) {
						throw new Error('ID token validation failed');
					}
				}

				// Store tokens in sessionStorage for the main flow page
				const tokensData: any = {};
				if (code) tokensData.code = code;
				if (idToken) tokensData.id_token = idToken;
				if (accessToken) tokensData.access_token = accessToken;
				if (tokenType) tokensData.token_type = tokenType;
				if (expiresIn) tokensData.expires_in = parseInt(expiresIn);
				if (scope) tokensData.scope = scope;

				sessionStorage.setItem('hybrid_tokens', JSON.stringify(tokensData));

				// Clear URL fragment for security
				window.history.replaceState(null, '', window.location.pathname);

				log.success('Callback processed successfully, redirecting to flow page');

				setStatus('success');
				setMessage('Authorization successful! Redirecting...');
				v4ToastManager.showSuccess('Authorization successful!');

				// Redirect to hybrid flow page
				setTimeout(() => {
					navigate('/flows/hybrid-v5');
				}, 1500);
			} catch (err: any) {
				log.error('Callback processing failed', err);
				setStatus('error');
				setMessage('Authorization failed');
				setErrorDetails(err.message || 'Unknown error occurred');
				v4ToastManager.showError(err.message || 'Authorization failed');

				// Redirect back to flow page after delay
				setTimeout(() => {
					navigate('/flows/hybrid-v5?error=' + encodeURIComponent(err.message));
				}, 3000);
			}
		};

		processCallback();
	}, [navigate]);

	return (
		<CallbackContainer>
			<CallbackCard>
				<IconContainer $status={status}>
					{status === 'loading' && <FiLoader />}
					{status === 'success' && <FiCheckCircle />}
					{status === 'error' && <FiAlertCircle />}
				</IconContainer>
				<Title>
					{status === 'loading' && 'Processing...'}
					{status === 'success' && 'Success!'}
					{status === 'error' && 'Error'}
				</Title>
				<Message>{message}</Message>
				{errorDetails && (
					<ErrorDetails>
						<ErrorText>{errorDetails}</ErrorText>
					</ErrorDetails>
				)}
			</CallbackCard>
		</CallbackContainer>
	);
};

export default HybridCallback;
