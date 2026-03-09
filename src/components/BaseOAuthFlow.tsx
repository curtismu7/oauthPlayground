import { FiAlertCircle, FiCheckCircle, FiInfo } from '@icons';
import React, { ReactNode, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/NewAuthContext';
import { config } from '../services/config';
import { logger } from '../utils/logger';
import { Card, CardBody, CardHeader } from './Card';
import FlowCredentials from './FlowCredentials';
import PageTitle from './PageTitle';

// Define window interface for PingOne environment variables
interface WindowWithPingOne extends Window {
	__PINGONE_ENVIRONMENT_ID__?: string;
	__PINGONE_API_URL__?: string;
	__PINGONE_CLIENT_ID__?: string;
}

// Base styled components that are reused across flows
export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;

export const FlowOverview = styled(Card)`
  margin-bottom: 2rem;
`;

export const FlowDescription = styled.div`
  margin-bottom: 2rem;

  h2 {
    color: ${({ theme }) => theme.colors.gray900};
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  p {
    color: ${({ theme }) => theme.colors.gray600};
    line-height: 1.6;
    margin-bottom: 1rem;
  }
`;

export const SecurityWarning = styled.div`
  background-color: #fdecea;
  border: 1px solid #f5c2c7;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  .icon {
    color: #dc3545;
    margin-top: 0.125rem;
    flex-shrink: 0;
  }

  .content {
    flex: 1;

    h3 {
      color: #dc3545;
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    p {
      color: #dc3545;
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.5;
    }
  }
`;

export const UseCaseHighlight = styled.div`
  background-color: ${({ theme }) => theme.colors.success}10;
  border: 1px solid ${({ theme }) => theme.colors.success}30;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  .icon {
    color: ${({ theme }) => theme.colors.success};
    margin-top: 0.125rem;
    flex-shrink: 0;
  }

  .content {
    flex: 1;

    h3 {
      color: ${({ theme }) => theme.colors.success};
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    p {
      color: ${({ theme }) => theme.colors.gray700};
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.5;
    }
  }
`;

export const InfoHighlight = styled.div`
  background-color: ${({ theme }) => theme.colors.primary}10;
  border: 1px solid ${({ theme }) => theme.colors.primary}30;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  .icon {
    color: ${({ theme }) => theme.colors.primary};
    margin-top: 0.125rem;
    flex-shrink: 0;
  }

  .content {
    flex: 1;

    h3 {
      color: ${({ theme }) => theme.colors.primary};
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    p {
      color: ${({ theme }) => theme.colors.gray700};
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.5;
    }
  }
`;

// Base OAuth Flow Props Interface
export interface BaseOAuthFlowProps {
	title: string;
	description: string;
	flowType: string;
	children: ReactNode;
	securityWarning?: {
		title: string;
		message: string;
	};
	useCaseHighlight?: {
		title: string;
		message: string;
	};
	infoHighlight?: {
		title: string;
		message: string;
	};
	showCredentials?: boolean;
	className?: string;
}

// Base OAuth Flow Component
export const BaseOAuthFlow: React.FC<BaseOAuthFlowProps> = ({
	title,
	description,
	flowType,
	children,
	securityWarning,
	useCaseHighlight,
	infoHighlight,
	showCredentials = true,
	className,
}) => {
	const { user, isAuthenticated } = useAuth();
	useEffect(() => {
		logger.info(`[${flowType}] Flow component mounted`);

		// Log flow access
		if (isAuthenticated && user) {
			logger.info(`[${flowType}] User ${user.email} accessed ${flowType} flow`);
		}
	}, [flowType, isAuthenticated, user]);

	return (
		<Container className={className}>
			<PageTitle title={title} />

			<FlowOverview>
				<CardHeader>
					<h1>{title}</h1>
				</CardHeader>
				<CardBody>
					<FlowDescription>
						<h2>Flow Overview</h2>
						<p>{description}</p>
					</FlowDescription>

					{securityWarning && (
						<SecurityWarning>
							<FiAlertCircle className="icon" size={20} />
							<div className="content">
								<h3>{securityWarning.title}</h3>
								<p>{securityWarning.message}</p>
							</div>
						</SecurityWarning>
					)}

					{useCaseHighlight && (
						<UseCaseHighlight>
							<FiCheckCircle className="icon" size={20} />
							<div className="content">
								<h3>{useCaseHighlight.title}</h3>
								<p>{useCaseHighlight.message}</p>
							</div>
						</UseCaseHighlight>
					)}

					{infoHighlight && (
						<InfoHighlight>
							<FiInfo className="icon" size={20} />
							<div className="content">
								<h3>{infoHighlight.title}</h3>
								<p>{infoHighlight.message}</p>
							</div>
						</InfoHighlight>
					)}

					{showCredentials && <FlowCredentials />}
				</CardBody>
			</FlowOverview>

			{children}
		</Container>
	);
};

// Hook for common OAuth flow logic
export const useOAuthFlowBase = (flowType: string) => {
	const { user, isAuthenticated } = useAuth();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleError = (error: Error, context: string) => {
		logger.error(`[${flowType}] ${context}:`, error);
		setError(error.message);
		setIsLoading(false);
	};

	const clearError = () => {
		setError(null);
	};

	const startLoading = () => {
		setIsLoading(true);
		clearError();
	};

	const stopLoading = () => {
		setIsLoading(false);
	};

	return {
		user,
		isAuthenticated,
		isLoading,
		error,
		handleError,
		clearError,
		startLoading,
		stopLoading,
	};
};

// Utility function to get PingOne environment variables
export const getPingOneEnvVars = () => {
	const windowWithPingOne = window as WindowWithPingOne;

	return {
		environmentId: windowWithPingOne.__PINGONE_ENVIRONMENT_ID__ || config.pingone.environmentId,
		apiUrl: windowWithPingOne.__PINGONE_API_URL__ || config.pingone.apiUrl,
		clientId: windowWithPingOne.__PINGONE_CLIENT_ID__ || config.pingone.clientId,
	};
};

export default BaseOAuthFlow;
