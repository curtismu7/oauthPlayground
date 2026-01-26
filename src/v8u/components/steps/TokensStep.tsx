/**
 * @file TokensStep.tsx
 * @description Tokens step component for unified flow
 * @author OAuth Playground Team
 * @version 1.0.0
 * @since 2026-01-25
 */

import { BaseUnifiedStep } from './BaseUnifiedStep';

export const TokensStep: React.FC<{ isCompleted?: boolean; isActive?: boolean }> = ({
	isCompleted = false,
	isActive = false,
}) => {
	return (
		<BaseUnifiedStep
			title="Tokens"
			description="Step implementation placeholder"
			stepNumber={1}
			isCompleted={isCompleted}
			isActive={isActive}
		>
			<div>
				<h4>Tokens</h4>
				<p>This step will be implemented with full functionality.</p>
				<div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
					<p>Implementation coming soon...</p>
				</div>
			</div>
		</BaseUnifiedStep>
	);
};
