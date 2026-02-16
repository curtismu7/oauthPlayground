/**
 * @file CustomLoginForm.tsx
 * @module protect-portal/components
 * @description Custom login form wrapper using BaseLoginForm component
 * @version 9.6.6
 * @since 2026-02-10
 *
 * This component wraps BaseLoginForm with PortalPageLayout styling.
 * Uses BaseLoginForm as the single source of truth for login UI.
 */

import React from 'react';
import type { LoginContext, PortalError, UserContext } from '../types/protectPortal.types';
import BaseLoginForm from './BaseLoginForm';
import PortalPageLayout, { PortalPageSection } from './PortalPageLayout';

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface CustomLoginFormProps {
	environmentId: string;
	clientId: string;
	redirectUri: string;
	buttonText?: string;
	buttonStyle?: React.CSSProperties;
	showIcons?: boolean;
	onLoginSuccess: (userContext: UserContext, loginContext: LoginContext) => void;
	onError: (error: PortalError) => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const CustomLoginForm: React.FC<CustomLoginFormProps> = ({
	environmentId,
	clientId,
	redirectUri,
	buttonText = 'Sign In',
	buttonStyle,
	showIcons = true,
	onLoginSuccess,
	onError,
}) => {
	// ============================================================================
	// RENDER - Simple wrapper around BaseLoginForm
	// ============================================================================

	return (
		<PortalPageLayout title="Sign In" showHeader={false}>
			<PortalPageSection>
				<BaseLoginForm
					environmentId={environmentId}
					clientId={clientId}
					redirectUri={redirectUri}
					buttonText={buttonText}
					{...(buttonStyle && { buttonStyle })}
					showIcons={showIcons}
					onLoginSuccess={onLoginSuccess}
					onError={onError}
				/>
			</PortalPageSection>
		</PortalPageLayout>
	);
};

export default CustomLoginForm;
