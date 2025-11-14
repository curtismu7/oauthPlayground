// src/components/password-reset/shared/UserLookupForm.tsx
// Shared user lookup form component used across password reset tabs

import React, { useEffect, useState } from 'react';
import { FiSearch } from '../../../services/commonImportsService';
import {
	Button,
	FormGroup,
	Input,
	Label,
	SpinningIcon,
	UserAvatar,
	UserCard,
	UserInfo,
} from './PasswordResetSharedComponents';
import { type PingOneUser, useUserLookup } from './useUserLookup';

interface UserLookupFormProps {
	environmentId: string;
	workerToken: string;
	onUserFound?: (user: PingOneUser) => void;
	placeholder?: string;
	label?: string;
}

export const UserLookupForm: React.FC<UserLookupFormProps> = ({
	environmentId,
	workerToken,
	onUserFound,
	placeholder = 'Enter username, email, or user ID',
	label = 'Username, Email, or User ID',
}) => {
	const [identifier, setIdentifier] = useState('');
	const { user, loading, lookupUser, resetUser } = useUserLookup(environmentId, workerToken);

	// Debug logging
	React.useEffect(() => {
		console.log('[UserLookupForm] Props received:', {
			environmentId: environmentId ? `${environmentId.substring(0, 8)}...` : 'empty',
			workerToken: workerToken ? `${workerToken.substring(0, 10)}...` : 'empty',
			hasOnUserFound: !!onUserFound,
		});
	}, [environmentId, workerToken, onUserFound]);

	const handleLookup = async () => {
		await lookupUser(identifier);
		// Note: user state will be updated by the hook, onUserFound will be called via useEffect
	};

	const handleReset = () => {
		setIdentifier('');
		resetUser();
	};

	// Call onUserFound when user is found
	useEffect(() => {
		if (user && onUserFound) {
			onUserFound(user);
		}
	}, [user, onUserFound]);

	// Get user display name
	const getUserDisplayName = (user: PingOneUser): string => {
		if (user.name) {
			if (typeof user.name === 'string') {
				return user.name;
			}
			if (user.name.given || user.name.family) {
				return `${user.name.given || ''} ${user.name.family || ''}`.trim();
			}
		}
		return user.username || user.email || 'User';
	};

	// Get user email
	const getUserEmail = (user: PingOneUser): string => {
		if (user.email) {
			return user.email;
		}
		if (user.emails && Array.isArray(user.emails) && user.emails.length > 0) {
			return user.emails[0].value || '';
		}
		return user.username || '';
	};

	// Get user avatar initial
	const getUserInitial = (user: PingOneUser): string => {
		const name = getUserDisplayName(user);
		return name.charAt(0).toUpperCase();
	};

	return (
		<>
			<FormGroup>
				<Label>{label}</Label>
				<div style={{ display: 'flex', gap: '0.5rem' }}>
					<Input
						type="text"
						placeholder={placeholder}
						value={identifier}
						onChange={(e) => setIdentifier(e.target.value)}
						onKeyPress={(e) => e.key === 'Enter' && handleLookup()}
					/>
					<Button onClick={handleLookup} disabled={loading || !identifier}>
						{loading ? <SpinningIcon /> : <FiSearch />}
						Lookup
					</Button>
					{user && (
						<Button $variant="secondary" onClick={handleReset}>
							Clear
						</Button>
					)}
				</div>
			</FormGroup>

			{user && (
				<UserCard style={{ 
					background: 'linear-gradient(135deg, #EBF4FF 0%, #E0F2FE 100%)',
					border: '2px solid #3B82F6',
					boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.1), 0 2px 4px -1px rgba(59, 130, 246, 0.06)',
					marginTop: '1rem',
					marginBottom: '1rem'
				}}>
					<UserInfo>
						<UserAvatar style={{ 
							background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
							color: 'white',
							fontSize: '1.25rem',
							width: '3rem',
							height: '3rem'
						}}>
							{getUserInitial(user)}
						</UserAvatar>
						<div style={{ flex: 1 }}>
							<div style={{ fontWeight: 700, color: '#1E40AF', marginBottom: '0.25rem', fontSize: '1.1rem' }}>
								{getUserDisplayName(user)}
							</div>
							<div style={{ fontSize: '0.9rem', color: '#1F2937', marginBottom: '0.5rem', fontWeight: 500 }}>
								📧 {getUserEmail(user)}
							</div>
							<div style={{ 
								fontSize: '0.8rem', 
								color: '#374151', 
								fontFamily: 'monospace',
								background: 'rgba(255, 255, 255, 0.7)',
								padding: '0.5rem',
								borderRadius: '0.375rem',
								border: '1px solid rgba(59, 130, 246, 0.2)'
							}}>
								<strong style={{ color: '#1E40AF' }}>Username:</strong> {user.username || 'N/A'} • <strong style={{ color: '#1E40AF' }}>User ID:</strong> {user.id || 'N/A'}
							</div>
						</div>
					</UserInfo>
				</UserCard>
			)}
		</>
	);
};
