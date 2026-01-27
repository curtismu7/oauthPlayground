/**
 * @file PollingStep.tsx
 * @description Polling Step placeholder
 * @author OAuth Playground Team
 * @version 1.0.0
 * @since 2026-01-25
 */

import { BaseUnifiedStep } from './BaseUnifiedStep';

export const PollingStep: React.FC<{ isCompleted?: boolean; isActive?: boolean }> = ({
	isCompleted = false,
	isActive = false,
}) => {
	return (
		<BaseUnifiedStep
			title="Token Polling"
			description="Token polling implementation"
			stepNumber={1}
			isCompleted={isCompleted}
			isActive={isActive}
		>
			<div>
				<h4>Token Polling</h4>
				<p>This step will be implemented with full functionality.</p>
				<div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
					<p>Implementation coming soon...</p>
				</div>
			</div>
		</BaseUnifiedStep>
	);
};
