/**
 * @file ConfigurationStep.tsx
 * @description Step 0: Configure credentials for all flows
 * @author OAuth Playground Team
 * @version 1.0.0
 * @since 2026-01-25
 */

import React from 'react';
import EnhancedFlowInfoCard from '@/components/EnhancedFlowInfoCard';
import FlowConfigurationRequirements from '@/components/FlowConfigurationRequirements';
import { useUnifiedFlowStore } from '../../services/UnifiedFlowStateManager';
import { BaseUnifiedStep } from './BaseUnifiedStep';

export const ConfigurationStep: React.FC = () => {
	const { flowType, specVersion, credentials, markStepCompleted } = useUnifiedFlowStore();

	const _handleStepComplete = () => {
		// Validate that required credentials are set
		if (credentials.clientId && credentials.environmentId) {
			markStepCompleted(0);
		}
	};

	const getRequiredFields = () => {
		const needsRedirectUri = ['oauth-authz', 'implicit', 'hybrid'].includes(flowType);
		const needsClientSecret = ['oauth-authz', 'hybrid', 'client-credentials'].includes(flowType);

		return {
			clientId: true,
			clientSecret: needsClientSecret,
			environmentId: true,
			redirectUri: needsRedirectUri,
		};
	};

	// Map our flow types to the expected types for FlowConfigurationRequirements
	const mapFlowType = (type: string) => {
		switch (type) {
			case 'oauth-authz':
				return 'authorization-code' as const;
			case 'client-credentials':
				return 'client-credentials' as const;
			case 'device-code':
				return 'device-authorization' as const;
			case 'implicit':
				return 'implicit' as const;
			case 'hybrid':
				return 'hybrid' as const;
			default:
				return 'authorization-code' as const;
		}
	};

	const isStepValid = () => {
		const required = getRequiredFields();
		return (
			credentials.clientId &&
			credentials.environmentId &&
			(!required.clientSecret || credentials.clientSecret) &&
			(!required.redirectUri || credentials.redirectUri)
		);
	};

	return (
		<BaseUnifiedStep
			title="Configure Application Credentials"
			description="Enter your PingOne application credentials to begin the OAuth flow"
			stepNumber={0}
			flowType={flowType}
			isCompleted={useUnifiedFlowStore((state) => state.completedSteps.includes(0))}
			isActive={useUnifiedFlowStore((state) => state.currentStep === 0)}
		>
			{/* Flow Information Card */}
			<EnhancedFlowInfoCard
				flowType={`${flowType}-${specVersion}` as string}
				showAdditionalInfo={true}
				showDocumentation={true}
				showCommonIssues={true}
			/>

			{/* Configuration Requirements */}
			<FlowConfigurationRequirements flowType={mapFlowType(flowType)} />

			{/* Validation Status */}
			{!isStepValid() && (
				<div
					style={{
						padding: '1rem',
						backgroundColor: '#fef2f2',
						border: '1px solid #fecaca',
						borderRadius: '0.5rem',
						marginTop: '1rem',
					}}
				>
					<p style={{ color: '#dc2626', margin: 0, fontWeight: '500' }}>
						⚠️ Please complete all required fields before proceeding
					</p>
				</div>
			)}

			{isStepValid() && (
				<div
					style={{
						padding: '1rem',
						backgroundColor: '#f0fdf4',
						border: '1px solid #bbf7d0',
						borderRadius: '0.5rem',
						marginTop: '1rem',
					}}
				>
					<p style={{ color: '#166534', margin: 0, fontWeight: '500' }}>
						✅ Configuration is complete. You can proceed to the next step.
					</p>
				</div>
			)}
		</BaseUnifiedStep>
	);
};
