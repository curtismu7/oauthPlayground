// src/components/callbacks/OAuthV3Callback.tsx - OAuth V3 specific callback handler

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FiCheckCircle, FiAlertCircle, FiLoader } from 'react-icons/fi';

const CallbackContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const CallbackCard = styled.div`
  background: white;
  padding: 3rem;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  text-align: center;
  max-width: 500px;
  width: 90%;
`;

const StatusIcon = styled.div<{ $status: 'loading' | 'success' | 'error' }>`
  font-size: 3rem;
  margin-bottom: 1.5rem;
  color: ${({ $status }) => {
		switch ($status) {
			case 'success':
				return '#10b981';
			case 'error':
				return '#ef4444';
			default:
				return '#3b82f6';
		}
	}};
  
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

const StatusTitle = styled.h2`
  margin: 0 0 1rem 0;
  color: #1f2937;
`;

const StatusMessage = styled.p`
  color: #6b7280;
  margin-bottom: 2rem;
  line-height: 1.6;
`;

const OAuthV3Callback: React.FC = () => {
	const navigate = useNavigate();
	const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading');
	const [message, setMessage] = React.useState('Processing OAuth authorization...');

	useEffect(() => {
		const processCallback = async () => {
			try {
				const urlParams = new URLSearchParams(window.location.search);
				const code = urlParams.get('code');
				const state = urlParams.get('state');
				const error = urlParams.get('error');
				const errorDescription = urlParams.get('error_description');

				console.log(' [OAuth-V3-Callback] Processing callback:', {
					hasCode: !!code,
					hasState: !!state,
					error,
					errorDescription,
				});

				if (error) {
					setStatus('error');
					setMessage(`Authorization failed: ${error} - ${errorDescription}`);
					console.error(' [OAuth-V3-Callback] Authorization error:', { error, errorDescription });

					// Redirect back to OAuth V3 flow with error
					setTimeout(() => {
						navigate('/flows/oauth-authorization-code-v3?error=' + encodeURIComponent(error));
					}, 3000);
					return;
				}

				if (code) {
					// Store the authorization code and state for the OAuth V3 flow
					sessionStorage.setItem('oauth_v3_auth_code', code);
					sessionStorage.setItem('oauth_v3_state', state || '');

					console.log(' [OAuth-V3-Callback] Authorization code received and stored');

					setStatus('success');
					setMessage('Authorization successful! Redirecting back to OAuth flow...');

					// Redirect back to OAuth V3 flow
					setTimeout(() => {
						navigate('/flows/oauth-authorization-code-v3?step=5');
					}, 2000);
				} else {
					setStatus('error');
					setMessage('No authorization code received. Please try again.');

					setTimeout(() => {
						navigate('/flows/oauth-authorization-code-v3');
					}, 3000);
				}
			} catch (error) {
				console.error(' [OAuth-V3-Callback] Callback processing failed:', error);
				setStatus('error');
				setMessage('Failed to process authorization callback.');

				setTimeout(() => {
					navigate('/flows/oauth-authorization-code-v3');
				}, 3000);
			}
		};

		processCallback();
	}, [navigate]);

	const getStatusIcon = () => {
		switch (status) {
			case 'success':
				return <FiCheckCircle />;
			case 'error':
				return <FiAlertCircle />;
			default:
				return <FiLoader />;
		}
	};

	const getStatusTitle = () => {
		switch (status) {
			case 'success':
				return 'Authorization Successful!';
			case 'error':
				return 'Authorization Failed';
			default:
				return 'Processing Authorization...';
		}
	};

	return (
		<CallbackContainer>
			<CallbackCard>
				<StatusIcon $status={status}>{getStatusIcon()}</StatusIcon>
				<StatusTitle>{getStatusTitle()}</StatusTitle>
				<StatusMessage>{message}</StatusMessage>
			</CallbackCard>
		</CallbackContainer>
	);
};

export default OAuthV3Callback;
