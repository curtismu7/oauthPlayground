/**
 * @file AuthorizationUrlStep.tsx
 * @description Authorization URL generation step
 * @author OAuth Playground Team
 * @version 1.0.0
 * @since 2026-01-25
 */

import React from 'react';
import { BaseUnifiedStep } from './BaseUnifiedStep';

export const AuthorizationUrlStep: React.FC<{ isCompleted?: boolean; isActive?: boolean }> = ({
	isCompleted = false,
	isActive = false,
}) => {
	return (
		<BaseUnifiedStep
			title="Generate Authorization URL"
			description="Create the authorization URL for user consent"
			stepNumber={2}
			isCompleted={isCompleted}
			isActive={isActive}
		>
			<div>
				<h4>Authorization URL Generation</h4>
				<p>This step generates the URL that users will visit to grant consent.</p>
				<div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
					<p>Authorization URL generation will be implemented here.</p>
				</div>
			</div>
		</BaseUnifiedStep>
	);
};
