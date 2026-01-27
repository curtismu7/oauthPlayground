/**
 * @file FragmentStep.tsx
 * @description Fragment Step placeholder
 * @author OAuth Playground Team
 * @version 1.0.0
 * @since 2026-01-25
 */

import { BaseUnifiedStep } from './BaseUnifiedStep';

export const FragmentStep: React.FC<{ isCompleted?: boolean; isActive?: boolean }> = ({
	isCompleted = false,
	isActive = false,
}) => {
	return (
		<BaseUnifiedStep
			title="Fragment Handling"
			description="URL fragment handling implementation"
			stepNumber={1}
			isCompleted={isCompleted}
			isActive={isActive}
		>
			<div>
				<h4>Fragment Handling</h4>
				<p>This step will be implemented with full functionality.</p>
				<div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
					<p>Implementation coming soon...</p>
				</div>
			</div>
		</BaseUnifiedStep>
	);
};
