// src/components/LogoutCallback.tsx
// Component to handle OIDC logout callback redirects

import React, { useEffect, useState } from 'react';
import { FiCheckCircle, FiLogIn } from '@icons';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { logger } from '../utils/logger';
import { v4ToastManager } from '../utils/v4ToastMessages';

const CallbackContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 60vh;
	padding: 2rem;
	text-align: center;
`;

const SuccessCard = styled.div`
	background: #f0fdf4;
	border: 1px solid #bbf7d0;
	border-radius: 0.75rem;
	padding: 2rem;
	max-width: 500px;
	width: 100%;
`;

const SuccessIcon = styled.div`
	font-size: 3rem;
	color: #22c55e;
	margin-bottom: 1rem;
`;

const SuccessTitle = styled.h1`
	margin: 0 0 0.5rem 0;
	font-size: 1.5rem;
	font-weight: 600;
	color: #14532d;
`;

const SuccessMessage = styled.p`
	margin: 0 0 1.5rem 0;
	color: #166534;
	line-height: 1.6;
`;

const LoginButton = styled.button`
	background: linear-gradient(135deg, #22c55e, #16a34a);
	color: white;
	border: none;
	border-radius: 0.5rem;
	padding: 0.75rem 2rem;
	font-weight: 600;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	transition: all 0.2s ease;

	&:hover {
		background: linear-gradient(135deg, #16a34a, #15803d);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
	}

	svg {
		font-size: 1.1rem;
	}
`;

const LogoutCallback: React.FC = () => {
	const navigate = useNavigate();
	const [isProcessing, setIsProcessing] = useState(true);

	useEffect(() => {
		const processLogoutCallback = async () => {
			try {
				logger.auth('LogoutCallback', 'Processing logout callback');

				// Clear any remaining session data
				const keysToRemove = [
					// Auth tokens
					'access_token',
					'id_token',
					'refresh_token',
					// OAuth flow state
					'oauth_state',
					'oauth_nonce',
					'oauth_tokens',
					// OIDC flow state
					'oidc_state',
					'oidc_nonce',
					'oidc_tokens',
					// Flow-specific data
					'flowContext',
					'authz_flow_tokens',
					'implicit_tokens',
					// User context
					'user_info',
					'session_state',
				];

				keysToRemove.forEach((key) => {
					localStorage.removeItem(key);
					sessionStorage.removeItem(key);
				});

				// Log successful logout
				logger.auth('LogoutCallback', 'Logout completed successfully');

				// Show success message
				v4ToastManager.showSuccess('You have been successfully logged out');

				// Small delay to ensure cleanup is complete
				setTimeout(() => {
					setIsProcessing(false);
				}, 1000);
			} catch (error) {
				logger.error('LogoutCallback', 'Error during logout processing', error);
				v4ToastManager.showError('An error occurred during logout');
				setIsProcessing(false);
			}
		};

		processLogoutCallback();
	}, []);

	const handleReturnToLogin = () => {
		navigate('/login');
	};

	if (isProcessing) {
		return (
			<CallbackContainer>
				<SuccessCard>
					<SuccessIcon>
						<FiCheckCircle />
					</SuccessIcon>
					<SuccessTitle>Logging Out...</SuccessTitle>
					<SuccessMessage>
						Please wait while we complete the logout process and clean up your session data.
					</SuccessMessage>
				</SuccessCard>
			</CallbackContainer>
		);
	}

	return (
		<CallbackContainer>
			<SuccessCard>
				<SuccessIcon>
					<FiCheckCircle />
				</SuccessIcon>
				<SuccessTitle>Logout Successful</SuccessTitle>
				<SuccessMessage>
					You have been successfully logged out from all applications. Your session has been
					terminated and all tokens have been cleared.
				</SuccessMessage>
				<LoginButton onClick={handleReturnToLogin}>
					<FiLogIn />
					Return to Login
				</LoginButton>
			</SuccessCard>
		</CallbackContainer>
	);
};

export default LogoutCallback;
