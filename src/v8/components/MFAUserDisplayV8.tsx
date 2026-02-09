/**
 * @file MFAUserDisplayV8.tsx
 * @module v8/components
 * @description MFA User Display Component - Shows current username and allows changing it
 * @version 8.0.0
 * @since 2026-02-06
 *
 * Features:
 * - Display current username
 * - Optional "Change User" button
 * - Consistent styling across MFA pages
 * - Callback for username changes
 */

import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 16px;
`;

const UsernameLabel = styled.span`
	font-size: 14px;
	color: #6b7280;
	margin: 0;
`;

const UsernameValue = styled.strong`
	color: #374151;
	font-size: 14px;
`;

const ChangeButton = styled.button`
	padding: 4px 8px;
	background: #f3f4f6;
	color: #374151;
	border: 1px solid #d1d5db;
	border-radius: 4px;
	font-size: 12px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: #e5e7eb;
		border-color: #9ca3af;
	}

	&:active {
		background: #d1d5db;
	}
`;

interface MFAUserDisplayV8Props {
	/** Current username */
	username: string;
	/** Optional callback for changing username */
	onUsernameChange?: () => void;
	/** Additional CSS styles */
	style?: React.CSSProperties;
	/** Label text (default: "User") */
	label?: string;
	/** Whether to show the change button */
	showChangeButton?: boolean;
}

export const MFAUserDisplayV8: React.FC<MFAUserDisplayV8Props> = ({
	username,
	onUsernameChange,
	style,
	label = 'User',
	showChangeButton = true,
}) => {
	if (!username) {
		return null;
	}

	return (
		<Container style={style}>
			<UsernameLabel>
				{label}: <UsernameValue>{username}</UsernameValue>
			</UsernameLabel>
			{showChangeButton && onUsernameChange && (
				<ChangeButton type="button" onClick={onUsernameChange} title="Change to a different user">
					🔄 Change User
				</ChangeButton>
			)}
		</Container>
	);
};

export default MFAUserDisplayV8;
