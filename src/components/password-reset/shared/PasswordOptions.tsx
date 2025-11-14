// src/components/password-reset/shared/PasswordOptions.tsx
// Shared password options component (forceChange, bypassPolicy)

import React from 'react';
import { FormGroup, Label } from './PasswordResetSharedComponents';

interface PasswordOptionsProps {
	forceChange: boolean;
	bypassPolicy: boolean;
	onForceChangeChange: (value: boolean) => void;
	onBypassPolicyChange: (value: boolean) => void;
	showBypassPolicy?: boolean;
}

export const PasswordOptions: React.FC<PasswordOptionsProps> = ({
	forceChange,
	bypassPolicy,
	onForceChangeChange,
	onBypassPolicyChange,
	showBypassPolicy = true,
}) => {
	return (
		<>
			<FormGroup>
				<Label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
					<input
						type="checkbox"
						checked={forceChange}
						onChange={(e) => onForceChangeChange(e.target.checked)}
						style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
					/>
					<span>Force password change on next sign-on</span>
				</Label>
				<p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6B7280', marginLeft: '1.75rem' }}>
					If checked, the user will be required to change their password when they next sign in.
				</p>
			</FormGroup>

			{showBypassPolicy && (
				<FormGroup>
					<Label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
						<input
							type="checkbox"
							checked={bypassPolicy}
							onChange={(e) => onBypassPolicyChange(e.target.checked)}
							style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
						/>
						<span>Bypass password policy</span>
					</Label>
					<p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6B7280', marginLeft: '1.75rem' }}>
						If checked, the password will be set even if it doesn't meet the password policy requirements. 
						Use with caution - this allows setting weak passwords that may violate security policies.
					</p>
				</FormGroup>
			)}
		</>
	);
};

