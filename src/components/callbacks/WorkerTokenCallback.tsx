import { FiLoader } from '@icons';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../contexts/NewAuthContext';
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
  border: 1px solid ${({ $status }) => {
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
  color: V9_COLORS.TEXT.GRAY_DARK;
`;

const StatusMessage = styled.p`
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  margin-bottom: 1rem;
`;

const ErrorDetails = styled.pre`
  background: #f3f4f6;
  color: V9_COLORS.TEXT.GRAY_DARK;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
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
				log.info('WorkerTokenCallback', 'Processing worker token callback', { url: currentUrl });

				const result = await handleCallback(currentUrl);

				if (result.success) {
					setStatus('success');
					setMessage('Worker token flow successful! Redirecting...');
					log.success('WorkerTokenCallback', 'Worker token flow successful', {
						redirectUrl: result.redirectUrl,
					});

					// Redirect after a short delay
					setTimeout(() => {
						navigate(result.redirectUrl || '/');
					}, 1500);
				} else {
					setStatus('error');
					setMessage('Worker token flow failed');
					setError(result.error || 'Unknown error occurred');
					log.error('WorkerTokenCallback', 'Worker token flow failed', { error: result.error });
				}
			} catch (err) {
				setStatus('error');
				setMessage('Worker token flow failed');
				setError(err instanceof Error ? err.message : 'Unknown error occurred');
				log.error('WorkerTokenCallback', 'Error processing worker token callback', err);
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
