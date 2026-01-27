/**
 * @file PKCEStep.tsx
 * @description PKCE generation step for authorization code and hybrid flows
 * @author OAuth Playground Team
 * @version 1.0.0
 * @since 2026-01-25
 */

import React from 'react';
import { PKCECodes, PKCEService } from '../../../services/pkceService';
import { useUnifiedFlowStore } from '../../services/UnifiedFlowStateManager';
import { BaseUnifiedStep } from './BaseUnifiedStep';

export const PKCEStep: React.FC<{ isCompleted?: boolean; isActive?: boolean }> = ({
	isCompleted = false,
	isActive = false,
}) => {
	const { setPKCECodes, flowState } = useUnifiedFlowStore();
	const [_pkceCodes, setLocalPKCECodes] = React.useState<PKCECodes | null>(null);

	const generatePKCE = async () => {
		try {
			const codes = await PKCEService.generatePKCECodes();
			setPKCECodes(codes.codeVerifier, codes.codeChallenge, codes.codeChallengeMethod);
			setLocalPKCECodes(codes);
		} catch (error) {
			console.error('Failed to generate PKCE codes:', error);
		}
	};

	return (
		<BaseUnifiedStep
			title="Generate PKCE Parameters"
			description="Generate code verifier and challenge for enhanced security"
			stepNumber={1}
			isCompleted={isCompleted}
			isActive={isActive}
		>
			<div>
				<h4>PKCE (Proof Key for Code Exchange)</h4>
				<p>
					PKCE enhances security for public clients by preventing authorization code interception
					attacks.
				</p>

				{!flowState.codeVerifier && (
					<div style={{ marginBottom: '1rem' }}>
						<button
							type="button"
							onClick={generatePKCE}
							style={{
								padding: '0.75rem 1.5rem',
								background: '#3b82f6',
								color: 'white',
								border: 'none',
								borderRadius: '0.375rem',
								cursor: 'pointer',
								fontWeight: '500',
							}}
						>
							Generate PKCE Parameters
						</button>
					</div>
				)}

				{flowState.codeVerifier && (
					<div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '0.5rem' }}>
						<h5>PKCE Parameters Generated</h5>
						<div style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
							<div>
								<strong>Code Verifier:</strong> {flowState.codeVerifier.substring(0, 20)}...
							</div>
							<div>
								<strong>Code Challenge:</strong> {flowState.codeChallenge?.substring(0, 20)}...
							</div>
							<div>
								<strong>Method:</strong> {flowState.codeChallengeMethod || 'S256'}
							</div>
						</div>
					</div>
				)}
			</div>
		</BaseUnifiedStep>
	);
};
