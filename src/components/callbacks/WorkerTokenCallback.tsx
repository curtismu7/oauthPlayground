import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../contexts/NewAuthContext';
import { FiLoader } from '../../icons';
import { logger } from '../../utils/logger';
import { oauthStorage } from '../../utils/storage';
import { getValidatedCurrentUrl } from '../../utils/urlValidation';

const CallbackContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 60vh;
	padding: 2rem;
	text-align: center;
`;

const StatusCard = styled.div<{ $status: 'loading' | 'success' | 'error' }>`
	background: ${({ $status }) => {
		switch ($status) {
			case 'success':
				return '#f0fdf4';
			case 'error':
				return '#fef2f2';
			default:
				return '#f8fafc';
		}
	}};
	border: 1px solid
		${({ $status }) => {
			switch ($status) {
				case 'success':
					return '#10b981';
				case 'error':
					return '#ef4444';
				default:
					return '#e5e7eb';
			}
		}};
	border-radius: 0.75rem;
	padding: 2rem;
	max-width: 500px;
	width: 100%;
`;

const StatusIcon = styled.div<{ $status: 'loading' | 'success' | 'error' }>`
	font-size: 3rem;
	color: ${({ $status }) => {
		switch ($status) {
			case 'success':
				return '#059669';
			case 'error':
				return '#dc2626';
			default:
				return '#6b7280';
		}
	}};
	margin-bottom: 1rem;
`;

const StatusTitle = styled.h2`
	font-size: 1.5rem;
	font-weight: 600;
	margin-bottom: 0.5rem;
	color: COLORS.TEXT.GRAY_DARK;
`;

const StatusMessage = styled.p`
	color: COLORS.TEXT.GRAY_MEDIUM;
	margin-bottom: 1rem;
`;

const ErrorDetails = styled.pre`
	background: #f3f4f6;
	color: COLORS.TEXT.GRAY_DARK;
	border: 1px solid COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 0.375rem;
	padding: 1rem;
	font-size: 0.875rem;
	text-align: left;
	overflow-x: auto;
	margin-top: 1rem;
`;

const WorkerTokenCallback: React.FC = () => {
	const navigate = useNavigate();
	const _location = useLocation();
	const { handleCallback } = useAuth();
	const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
	const [message, setMessage] = useState('Processing worker token callback...');
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const processCallback = async () => {
			try {
				const currentUrl = getValidatedCurrentUrl('WorkerTokenCallback');
				logger.info('WorkerTokenCallback', 'Processing worker token callback', { url: currentUrl });

				const result = await handleCallback(currentUrl);

				if (result.success) {
					setStatus('success');
					setMessage('Worker token flow successful! Redirecting...');
					logger.success('WorkerTokenCallback', 'Worker token flow successful', {
						redirectUrl: result.redirectUrl,
					});

					// Bridge the exchanged token into the worker-token store. handleCallback
					// only saves to the user-login session (oauthStorage); the /environments
					// status panel reads localStorage 'unified_worker_token', so without this
					// the token "succeeds" but the status shows MISSING.
					try {
						const tokens = oauthStorage.getTokens();
						if (tokens?.access_token) {
							const expiresAt =
								tokens.expires_at ??
								(tokens.expires_in
									? Date.now() + tokens.expires_in * 1000
									: Date.now() + 3600 * 1000);
							localStorage.setItem(
								'unified_worker_token',
								JSON.stringify({ token: tokens.access_token, expiresAt })
							);
							window.dispatchEvent(new Event('workerTokenUpdated'));
						}
					} catch (bridgeErr) {
						logger.warn(
							'WorkerTokenCallback',
							'Failed to bridge token to worker token store',
							bridgeErr
						);
					}

					// Redirect after a short delay
					setTimeout(() => {
						navigate(result.redirectUrl || '/');
					}, 1500);
				} else {
					setStatus('error');
					setMessage('Worker token flow failed');
					setError(result.error || 'Unknown error occurred');
					logger.error('WorkerTokenCallback', 'Worker token flow failed', { error: result.error });
				}
			} catch (err) {
				setStatus('error');
				setMessage('Worker token flow failed');
				setError(err instanceof Error ? err.message : 'Unknown error occurred');
				logger.error('WorkerTokenCallback', 'Error processing worker token callback', err);
			}
		};

		processCallback();
	}, [handleCallback, navigate]);

	const getStatusIcon = () => {
		switch (status) {
			case 'success':
				return <span>✅</span>;
			case 'error':
				return <span>❌</span>;
			default:
				return <FiLoader className="animate-spin" />;
		}
	};

	return (
		<CallbackContainer>
			<StatusCard $status={status}>
				<StatusIcon $status={status}>{getStatusIcon()}</StatusIcon>
				<StatusTitle>
					{status === 'loading' && 'Processing Worker Token'}
					{status === 'success' && 'Worker Token Successful'}
					{status === 'error' && 'Worker Token Failed'}
				</StatusTitle>
				<StatusMessage>{message}</StatusMessage>
				{error && <ErrorDetails>{error}</ErrorDetails>}
			</StatusCard>
		</CallbackContainer>
	);
};

export default WorkerTokenCallback;
