/**
 * @file UserInfoDisplayV8.tsx
 * @module v8/components
 * @description User information display component for V8 flows
 * @version 8.0.0
 * @since 2025-01-25
 */

import React from 'react';
import { FiUser } from 'react-icons/fi';

interface UserInfoDisplayV8Props {
	username?: string;
	userId?: string;
	fullName?: string;
	compact?: boolean;
}

export const UserInfoDisplayV8: React.FC<UserInfoDisplayV8Props> = ({
	username,
	userId,
	fullName,
	compact = false,
}) => {
	// Don't render if no user data
	if (!username && !userId && !fullName) {
		return null;
	}

	if (compact) {
		return (
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: '8px',
					padding: '8px 12px',
					background: '#f9fafb',
					border: '1px solid #e5e7eb',
					borderRadius: '6px',
					fontSize: '13px',
				}}
			>
				<FiUser style={{ color: '#6b7280', flexShrink: 0 }} />
				<span style={{ fontWeight: '500', color: '#1f2937' }}>{username || userId}</span>
			</div>
		);
	}

	return (
		<div
			style={{
				padding: '16px',
				background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
				borderRadius: '8px',
				color: 'white',
				boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
			}}
		>
			<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
				<div
					style={{
						width: '48px',
						height: '48px',
						borderRadius: '50%',
						background: 'rgba(255, 255, 255, 0.2)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						fontSize: '24px',
					}}
				>
					<FiUser />
				</div>
				<div style={{ flex: 1 }}>
					{fullName && (
						<div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
							{fullName}
						</div>
					)}
					{username && (
						<div style={{ fontSize: '14px', opacity: 0.9 }}>
							@{username}
						</div>
					)}
				</div>
			</div>
			{userId && (
				<div
					style={{
						padding: '8px 12px',
						background: 'rgba(0, 0, 0, 0.2)',
						borderRadius: '4px',
						fontSize: '12px',
						fontFamily: 'monospace',
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
					}}
				>
					<span style={{ opacity: 0.7 }}>ID:</span>
					<span style={{ fontWeight: '500' }}>{userId}</span>
				</div>
			)}
		</div>
	);
};

export default UserInfoDisplayV8;
