/**
 * @file PortalStats.tsx
 * @module protect-portal/components
 * @description Portal stats page component for low risk scores
 * @version 9.6.5
 * @since 2026-02-11
 *
 * This component displays risk evaluation statistics and information
 * for low risk score scenarios before proceeding to success page.
 */

import React, { useEffect } from 'react';
import { FiActivity, FiCheckCircle, FiClock, FiMapPin } from 'react-icons/fi';
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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
  }
`;

const StatIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--brand-primary), var(--brand-primary-dark));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  color: white;
  font-size: 1.5rem;
`;

const StatTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--brand-text-primary);
  margin-bottom: 0.5rem;
`;

const StatValue = styled.p`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--brand-primary);
  margin-bottom: 0.5rem;
`;

const StatDescription = styled.p`
  font-size: 0.875rem;
  color: var(--brand-text-secondary);
  line-height: 1.5;
`;

const ActionButton = styled.button`
  background: var(--brand-primary);
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
  margin: 0 auto;

  &:hover {
    background: var(--brand-primary-dark);
  }
`;

// ============================================================================
// COMPONENT
// ============================================================================

interface PortalStatsProps {
	userContext: UserContext;
	riskEvaluation: RiskEvaluationResult;
	onSuccess: () => void;
	onError: (error: { message: string; recoverable?: boolean }) => void;
	educationalContent: EducationalContent;
}

const PortalStats: React.FC<PortalStatsProps> = ({
	userContext,
	riskEvaluation,
	onSuccess,
	onError,
	educationalContent,
}) => {
	const [stats, setStats] = React.useState({
		loginAttempts: 0,
		successfulLogins: 0,
		averageTime: 0,
		deviceCount: 0,
	});

	useEffect(() => {
		// Simulate loading stats data
		const loadStats = async () => {
			try {
				// In a real implementation, this would fetch actual stats
				setStats({
					loginAttempts: Math.floor(Math.random() * 100) + 50,
					successfulLogins: Math.floor(Math.random() * 80) + 40,
					averageTime: Math.floor(Math.random() * 30) + 10,
					deviceCount: Math.floor(Math.random() * 20) + 5,
				});
			} catch (_error) {
				onError({ message: 'Failed to load statistics', recoverable: true });
			}
		};

		loadStats();
	}, [onError]);

	const handleContinue = () => {
		onSuccess();
	};

	return (
		<PortalPageLayout
			title="Security Evaluation Complete"
			subtitle="Your login attempt has been evaluated with a low risk score. Here are the current statistics."
		>
			<PortalPageSection>
				<StatsGrid>
					<StatCard>
						<StatIcon>
							<FiCheckCircle />
						</StatIcon>
						<StatTitle>Success Rate</StatTitle>
						<StatValue>
							{stats.successfulLogins > 0
								? `${Math.round((stats.successfulLogins / stats.loginAttempts) * 100)}%`
								: '0%'}
						</StatValue>
						<StatDescription>
							{stats.successfulLogins} successful out of {stats.loginAttempts} attempts
						</StatDescription>
					</StatCard>

					<StatCard>
						<StatIcon>
							<FiClock />
						</StatIcon>
						<StatTitle>Average Time</StatTitle>
						<StatValue>{stats.averageTime}s</StatValue>
						<StatDescription>Average time to complete login evaluation</StatDescription>
					</StatCard>

					<StatCard>
						<StatIcon>
							<FiMapPin />
						</StatIcon>
						<StatTitle>Devices</StatTitle>
						<StatValue>{stats.deviceCount}</StatValue>
						<StatDescription>Trusted devices registered in system</StatDescription>
					</StatCard>

					<StatCard>
						<StatIcon>
							<FiActivity />
						</StatIcon>
						<StatTitle>Risk Level</StatTitle>
						<StatValue style={{ color: '#10b981' }}>LOW</StatValue>
						<StatDescription>Your login attempt passed all security checks</StatDescription>
					</StatCard>
				</StatsGrid>
			</PortalPageSection>

			<PortalPageSection>
				<div style={{ textAlign: 'center' }}>
					<ActionButton onClick={handleContinue}>
						Continue to Success Page
						<FiCheckCircle />
					</ActionButton>
				</div>
			</PortalPageSection>
		</PortalPageLayout>
	);
};

export default PortalStats;
