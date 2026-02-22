/**
 * @file MFAAuthenticationSuccessPage.tsx
 * @module v8/components
 * @description Success page component for MFA authentication flows
 * @version 8.3.0
 * @since 2025-01-XX
 *
 * Displays authentication success with access token and related information.
 */

import React from 'react';
import { useLocation } from 'react-router-dom';
import {
	type UnifiedMFASuccessPageData,
	UnifiedMFASuccessPageV8,
} from '@/v8/services/unifiedMFASuccessPageServiceV8';

interface LocationState {
	completionResult?: {
		accessToken?: string;
		tokenType?: string;
		expiresIn?: number;
		scope?: string;
		status?: string;
		message?: string;
	};
	username?: string;
	userId?: string;
	environmentId?: string;
	deviceType?: string;
	deviceDetails?: {
		id?: string;
		type?: string;
		nickname?: string;
		name?: string;
		phone?: string;
		email?: string;
		status?: string;
		[key: string]: unknown;
	};
	policyId?: string;
	policyName?: string;
	authenticationId?: string | null;
	challengeId?: string | null;
	timestamp?: string;
	deviceSelectionBehavior?: string;
}

export const MFAAuthenticationSuccessPage: React.FC = () => {
	const location = useLocation();
	const state = location.state as LocationState | null;

	const completionResult = state?.completionResult;
	const username = state?.username;
	const userId = state?.userId;
	const environmentId = state?.environmentId;
	const deviceType = state?.deviceType;
	const deviceDetails = state?.deviceDetails;
	const policyId = state?.policyId;
	const policyName = state?.policyName;
	const authenticationId = state?.authenticationId;
	const challengeId = state?.challengeId;
	const timestamp = state?.timestamp;
	const deviceSelectionBehavior = state?.deviceSelectionBehavior;

	// Convert to unified format
	const resolvedDeviceType = deviceType || deviceDetails?.type;
	const unifiedData: UnifiedMFASuccessPageData = {
		flowType: 'authentication',
		...(username && { username }),
		...(userId && { userId }),
		...(environmentId && { environmentId }),
		...(deviceDetails?.id && { deviceId: deviceDetails.id }),
		...(resolvedDeviceType && { deviceType: resolvedDeviceType }),
		...(deviceDetails?.status && { deviceStatus: deviceDetails.status }),
		...(deviceDetails?.nickname && { deviceNickname: deviceDetails.nickname }),
		...(deviceDetails?.name && { deviceName: deviceDetails.name }),
		...(deviceDetails?.phone && { phone: deviceDetails.phone }),
		...(deviceDetails?.email && { email: deviceDetails.email }),
		...(policyId && { policyId }),
		...(policyName && { policyName }),
		...(completionResult && { completionResult }),
		...(authenticationId && { authenticationId }),
		...(challengeId && { challengeId }),
		...(timestamp && { timestamp }),
		...(deviceSelectionBehavior && { deviceSelectionBehavior }),
		responseData: completionResult || {},
	};

	return <UnifiedMFASuccessPageV8 data={unifiedData} />;
};

export default MFAAuthenticationSuccessPage;
