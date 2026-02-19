/**
 * @file ProtectPage.tsx
 * @module protect-portal/components
 * @description Protect page component for additional security verification
 * @version 9.6.5
 * @since 2026-02-11
 *
 * This component displays additional security verification for medium and high
 * risk scores before allowing access to the protected resource.
 */

import React from 'react';
import { FiAlertTriangle, FiCheckCircle, FiShield } from 'react-icons/fi';
import styled from 'styled-components';
import type {
	EducationalContent,
	RiskEvaluationResult,
	UserContext,
} from '../types/protectPortal.types';
import PortalPageLayout, { PortalPageSection } from './PortalPageLayout';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const ProtectCard = styled.div<{ variant?: 'info' | 'warning' | 'error' }>`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid ${(props) => {
		switch (props.variant) {
			case 'warning':
				return '#f59e0b';
			case 'error':
				return '#ef4444';
			default:
				return '#e5e7eb';
		}
	}};
  border-left: 4px solid ${(props) => {
		switch (props.variant) {
			case 'warning':
				return '#f59e0b';
			case 'error':
				return '#ef4444';
			default:
				return 'var(--brand-primary)';
		}
	}};
`;

const ProtectIcon = styled.div<{ variant?: 'info' | 'warning' | 'error' }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  color: white;
  font-size: 1.5rem;
  background: ${(props) => {
		switch (props.variant) {
			case 'warning':
				return '#f59e0b';
			case 'error':
				return '#ef4444';
			default:
				return 'var(--brand-primary)';
		}
	}};
`;

const ProtectCardTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--brand-text-primary);
  margin-bottom: 1rem;
`;

const ProtectCardContent = styled.div`
  color: var(--brand-text-secondary);
  line-height: 1.6;
  margin-bottom: 1.5rem;
`;

const ProtectList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 1rem 0;
`;

const UserInfo = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const UserInfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const UserInfoLabel = styled.span`
  font-weight: 600;
  color: var(--brand-text-primary);
`;

const UserInfoValue = styled.span`
  color: var(--brand-text-secondary);
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  background: ${(props) => {
		switch (props.variant) {
			case 'secondary':
				return '#6b7280';
			case 'danger':
				return '#ef4444';
			default:
				return 'var(--brand-primary)';
		}
	}};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.5rem;

  &:hover {
    background: ${(props) => {
			switch (props.variant) {
				case 'secondary':
					return '#4b5563';
				case 'danger':
					return '#dc2626';
				default:
					return 'var(--brand-primary-dark)';
			}
		}};
  }
`;

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid var(--brand-primary);
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 0.5rem;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// ============================================================================
// COMPONENT
// ============================================================================

interface ProtectPageProps {
	userContext: UserContext;
	riskEvaluation: RiskEvaluationResult;
	onSuccess: () => void;
	onError: (error: { message: string; recoverable?: boolean }) => void;
	educationalContent: EducationalContent;
}

const ProtectPage: React.FC<ProtectPageProps> = ({
	userContext,
	riskEvaluation,
	onSuccess,
	onError,
	educationalContent,
}) => {
	const [isVerifying, setIsVerifying] = React.useState(false);
	const [verificationComplete, setVerificationComplete] = React.useState(false);

	const handleVerification = async () => {
		setIsVerifying(true);

		try {
			// Simulate additional security verification
			await new Promise((resolve) => setTimeout(resolve, 2000));

			setVerificationComplete(true);

			// For high risk, we might want to block instead of allowing success
			// This will be handled by the parent component based on the risk level
			setTimeout(() => {
				onSuccess();
			}, 1000);
		} catch (_error) {
			onError({ message: 'Verification failed', recoverable: true });
		} finally {
			setIsVerifying(false);
		}
	};

	const getRiskVariant = () => {
		switch (riskEvaluation.result.level) {
			case 'MEDIUM':
				return 'warning' as const;
			case 'HIGH':
				return 'error' as const;
			default:
				return 'info' as const;
		}
	};

	const getRiskIcon = () => {
		switch (riskEvaluation.result.level) {
			case 'MEDIUM':
				return <FiAlertTriangle />;
			case 'HIGH':
				return <FiShield />;
			default:
				return <FiCheckCircle />;
		}
	};

	const getRiskTitle = () => {
		switch (riskEvaluation.result.level) {
			case 'MEDIUM':
				return 'Additional Verification Required';
			case 'HIGH':
				return 'Security Check Required';
			default:
				return 'Security Verification';
		}
	};

	return (
		<PortalPageLayout
			title={getRiskTitle()}
			subtitle="For your security, we need to perform additional verification before granting access."
		>
			<PortalPageSection>
				<UserInfo>
					<UserInfoRow>
						<UserInfoLabel>User:</UserInfoLabel>
						<UserInfoValue>{userContext.email}</UserInfoValue>
					</UserInfoRow>
					<UserInfoRow>
						<UserInfoLabel>Risk Level:</UserInfoLabel>
						<UserInfoValue>{riskEvaluation.result.level}</UserInfoValue>
					</UserInfoRow>
					<UserInfoRow>
						<UserInfoLabel>Evaluated:</UserInfoLabel>
						<UserInfoValue>{new Date(riskEvaluation.createdAt).toLocaleString()}</UserInfoValue>
					</UserInfoRow>
				</UserInfo>
			</PortalPageSection>

			<PortalPageSection>
				<ProtectCard variant={getRiskVariant()}>
					<ProtectIcon variant={getRiskVariant()}>{getRiskIcon()}</ProtectIcon>
					<ProtectCardTitle>{getRiskTitle()}</ProtectCardTitle>
					<ProtectCardContent>
						{riskEvaluation.result.level === 'HIGH' && (
							<>
								We detected unusual activity in your login attempt. To protect your account, please
								verify your identity through additional security measures.
								<ProtectList>
									<li>Device fingerprint verification</li>
									<li>Location validation</li>
									<li>Behavioral analysis</li>
									<li>Multi-factor authentication</li>
								</ProtectList>
							</>
						)}
						{riskEvaluation.result.level === 'MEDIUM' && (
							<>
								Your login attempt requires additional verification to ensure account security.
								<ProtectList>
									<li>Device verification</li>
									<li>Multi-factor authentication</li>
									<li>Session validation</li>
								</ProtectList>
							</>
						)}
					</ProtectCardContent>
				</ProtectCard>
			</PortalPageSection>

			<PortalPageSection>
				{!verificationComplete && (
					<div style={{ textAlign: 'center' }}>
						<ActionButton onClick={handleVerification} disabled={isVerifying}>
							{isVerifying && <LoadingSpinner />}
							{isVerifying ? 'Verifying...' : 'Start Verification'}
						</ActionButton>
					</div>
				)}

				{verificationComplete && (
					<div style={{ textAlign: 'center' }}>
						<ActionButton onClick={onSuccess} variant="primary">
							<FiCheckCircle />
							Continue to Protected Resource
						</ActionButton>
					</div>
				)}
			</PortalPageSection>
		</PortalPageLayout>
	);
};

export default ProtectPage;
