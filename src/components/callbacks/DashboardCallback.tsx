import { FiCheckCircle, FiLoader, FiXCircle } from '@icons';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../contexts/NewAuthContext';
import { logger } from '../../utils/logger';
import { getValidatedCurrentUrl } from '../../utils/urlValidation';

const CallbackContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0070CC 0%, #0056A3 100%);
  padding: 2rem;
`;

const StatusCard = styled.div<{ $status: 'loading' | 'success' | 'error' }>`
  background: white;
  border-radius: 12px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  text-align: center;
  max-width: 500px;
  width: 100%;
  
  ${({ $status }) => {
		switch ($status) {
			case 'success':
				return `
          border-left: 4px solid V9_COLORS.PRIMARY.GREEN;
        `;
			case 'error':
				return `
          border-left: 4px solid V9_COLORS.PRIMARY.RED;
        `;
			default:
				return `
          border-left: 4px solid V9_COLORS.PRIMARY.BLUE;
        `;
		}
	}}
`;

const StatusIcon = styled.div<{ $status: 'loading' | 'success' | 'error' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  
  svg {
    ${({ $status }) => {
			switch ($status) {
				case 'success':
					return `
            color: V9_COLORS.PRIMARY.GREEN;
            font-size: 3rem;
          `;
				case 'error':
					return `
            color: V9_COLORS.PRIMARY.RED;
            font-size: 3rem;
          `;
				default:
					return `
            color: V9_COLORS.PRIMARY.BLUE;
            font-size: 3rem;
            animation: spin 1s linear infinite;
          `;
			}
		}}
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const StatusTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: V9_COLORS.TEXT.GRAY_DARK;
  margin-bottom: 0.5rem;
`;

const StatusMessage = styled.p`
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  font-size: 1rem;
  margin-bottom: 1.5rem;
  line-height: 1.5;
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

const DashboardCallback: React.FC = () => {
	const navigate = useNavigate();
	const { handleCallback } = useAuth();
	const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
	const [message, setMessage] = useState('Processing dashboard login...');
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const processCallback = async () => {
			try {
				const currentUrl = getValidatedCurrentUrl('DashboardCallback');
				logger.auth('DashboardCallback', 'Processing dashboard login callback', {
					url: currentUrl,
				});

				const result = await handleCallback(currentUrl);

				if (result.success) {
					setStatus('success');
					setMessage('Dashboard login successful! Redirecting to dashboard...');
					logger.auth('DashboardCallback', 'Dashboard login successful', {
						redirectUrl: '/dashboard',
					});

					// Always redirect to dashboard for dashboard login
					setTimeout(() => {
						navigate('/dashboard', { replace: true });
					}, 1500);
				} else {
					setStatus('error');
					setMessage('Dashboard login failed');
					setError(result.error || 'Unknown error occurred');
					logger.error('DashboardCallback', 'Dashboard login failed', { error: result.error });
				}
			} catch (err) {
				setStatus('error');
				setMessage('Dashboard login failed');
				setError(err instanceof Error ? err.message : 'Unknown error occurred');
				logger.error('DashboardCallback', 'Error processing dashboard callback', err);
			}
		};

		processCallback();
	}, [handleCallback, navigate]);

	const getStatusIcon = () => {
		switch (status) {
			case 'success':
				return <FiCheckCircle />;
			case 'error':
				return <FiXCircle />;
			default:
				return <FiLoader className="animate-spin" />;
		}
	};

	return (
		<CallbackContainer>
			<StatusCard $status={status}>
				<StatusIcon $status={status}>{getStatusIcon()}</StatusIcon>
				<StatusTitle>
					{status === 'loading' && 'Completing Dashboard Login'}
					{status === 'success' && 'Dashboard Login Successful'}
					{status === 'error' && 'Dashboard Login Failed'}
				</StatusTitle>
				<StatusMessage>{message}</StatusMessage>
				{error && <ErrorDetails>{error}</ErrorDetails>}
			</StatusCard>
		</CallbackContainer>
	);
};

export default DashboardCallback;
