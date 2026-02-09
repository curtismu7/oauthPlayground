/**
 * @file NewMFAFlowV8.tsx
 * @module v8/flows
 * @description New 6-Step Device Authentication Flow
 * @version 8.1.0
 */

import React from 'react';
import { DeviceConfigKey } from './config/deviceFlowConfigTypes';
import { APIDocsStepV8 } from './shared/APIDocsStepV8';
import type { MFAFlowBaseRenderProps } from './shared/MFAFlowBaseV8';
import { MFAFlowBaseV8 } from './shared/MFAFlowBaseV8';
import { SuccessStepV8 } from './shared/SuccessStepV8';
import { UserLoginStepV8 } from './shared/UserLoginStepV8';
import { UnifiedActivationStep } from './unified/components/UnifiedActivationStep';
import { UnifiedDeviceRegistrationForm } from './unified/components/UnifiedDeviceRegistrationForm';
import { WorkerTokenStatusServiceV8 } from '../services/workerTokenStatusServiceV8';

const MODULE_TAG = '[🎯 NEW-MFA-FLOW-V8]';

interface NewMFAFlowV8Props {
	deviceType: DeviceConfigKey;
}

export const NewMFAFlowV8: React.FC<NewMFAFlowV8Props> = ({ deviceType }) => {
	/**
	 * Render Step 0: Configuration (environment, user, policy)
	 */
	const renderStep0 = React.useCallback(
		(props: MFAFlowBaseRenderProps) => {
			return (
				<UnifiedDeviceRegistrationForm
					initialDeviceType={deviceType}
					onSubmit={async (selectedDeviceType, fields, flowType) => {
						console.log(`${MODULE_TAG} Device registration submitted:`, {
							selectedDeviceType,
							flowType,
							fields,
						});
						// TODO: Implement device registration logic
					}}
					onCancel={() => {
						console.log(`${MODULE_TAG} Device registration cancelled`);
					}}
					tokenStatus={props.tokenStatus}
					username={props.credentials.username}
				/>
			);
		},
		[deviceType]
	);

	/**
	 * Render Step 1: User Login using Authorization Code Flow with PKCE
	 */
	const renderStep1 = React.useCallback((props: MFAFlowBaseRenderProps) => {
		return <UserLoginStepV8 renderProps={props} />;
	}, []);

	/**
	 * Render Step 2: Device Selection (option to call registration if want new device, or have no devices)
	 */
	const renderStep2 = React.useCallback(
		(props: MFAFlowBaseRenderProps) => {
			return <UnifiedActivationStep {...props} config={{ deviceType }} />;
		},
		[deviceType]
	);

	/**
	 * Render Step 3: Device-Specific Actions (OTP/QR Generation, FIDO, Mobile Push)
	 */
	const renderStep3 = React.useCallback(
		(props: MFAFlowBaseRenderProps) => {
			// This will be device-specific based on the device type
			// For now, return the activation step which handles device-specific logic
			return <UnifiedActivationStep {...props} config={{ deviceType }} />;
		},
		[deviceType]
	);

	/**
	 * Render Step 4: OTP Validation / Confirmation
	 */
	const renderStep4 = React.useCallback(
		(props: MFAFlowBaseRenderProps) => {
			// This will be device-specific validation
			return <UnifiedActivationStep {...props} config={{ deviceType }} />;
		},
		[deviceType]
	);

	/**
	 * Render Step 5: Success screen with all user data and other valuable options
	 */
	const renderStep5 = React.useCallback((props: MFAFlowBaseRenderProps) => {
		return <SuccessStepV8 renderProps={props} />;
	}, []);

	/**
	 * Render Step 6: API Documentation
	 */
	const renderStep6 = React.useCallback((props: MFAFlowBaseRenderProps) => {
		return <APIDocsStepV8 renderProps={props} />;
	}, []);

	// Step labels for device authentication flow
	const stepLabels = React.useMemo(() => {
		if (deviceType === 'FIDO2') {
			return [
				'Configure',
				'User Login',
				'Device Selection',
				'Start FIDO in Browser',
				'Passkey confirmation',
				'Success',
				'API Docs',
			];
		} else if (deviceType === 'MOBILE') {
			return [
				'Configure',
				'User Login',
				'Device Selection',
				'Push to Mobile App',
				'User Confirms on Mobile',
				'Success',
				'API Docs',
			];
		} else {
			// SMS, Email, TOTP, WhatsApp
			return [
				'Configure',
				'User Login',
				'Device Selection',
				'Generate OTP/QR',
				'Validate OTP',
				'Success',
				'API Docs',
			];
		}
	}, [deviceType]);

	const shouldHideNextButton = React.useCallback((props: MFAFlowBaseRenderProps) => {
		if (props.nav.currentStep === 0) {
			// FIXED: Prevent advancement from step 0 without valid worker token
			const tokenStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync();
			const tokenType = props.credentials.tokenType || 'worker';
			
			// For worker token flows: require valid token
			// For user token flows: require valid user token
			if (tokenType === 'worker' && !tokenStatus.isValid) {
				return true; // Hide Next button - worker token invalid
			}
			if (tokenType === 'user' && !props.credentials.userToken?.trim()) {
				return true; // Hide Next button - user token missing
			}
			
			return true; // Hide Next button on configuration step, use form submit
		}
		if (props.nav.currentStep === 1) {
			return true; // Hide Next button on user login step, use authentication button
		}
		if (props.nav.currentStep === 2) {
			// FIXED: Prevent advancement to step 3 without valid worker token
			const tokenStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync();
			const tokenType = props.credentials.tokenType || 'worker';
			
			// For worker token flows: require valid token
			// For user token flows: require valid user token
			if (tokenType === 'worker' && !tokenStatus.isValid) {
				return true; // Hide Next button - worker token invalid
			}
			if (tokenType === 'user' && !props.credentials.userToken?.trim()) {
				return true; // Hide Next button - user token missing
			}
		}
		return false;
	}, []);

	const validateStep0 = React.useCallback((credentials: any, tokenStatus: any, _nav: any) => {
		// Always check for valid worker token (required for MFA device operations)
		if (!tokenStatus.isValid) {
			console.warn(`${MODULE_TAG} Step 0 validation failed: Invalid or expired worker token`);
			return false;
		}

		// Check required configuration
		const hasEnvironmentId = credentials.environmentId?.trim();
		const hasUsername = credentials.username?.trim();

		console.log(`${MODULE_TAG} Validating step 0:`, {
			hasEnvironmentId,
			hasUsername,
			tokenValid: tokenStatus.isValid,
			tokenType: credentials.tokenType,
			hasUserToken: !!credentials.userToken,
		});

		return hasEnvironmentId && hasUsername;
	}, []);

	return (
		<div style={{ minHeight: '100vh', background: '#f8fafc' }}>
			<MFAFlowBaseV8
				deviceType={deviceType}
				renderStep0={renderStep0}
				renderStep1={renderStep1}
				renderStep2={renderStep2}
				renderStep3={renderStep3}
				renderStep4={renderStep4}
				renderStep5={renderStep5}
				renderStep6={renderStep6}
				validateStep0={validateStep0}
				stepLabels={stepLabels}
				shouldHideNextButton={shouldHideNextButton}
				flowType="device-auth"
			/>
		</div>
	);
};
