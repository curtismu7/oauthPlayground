// src/components/flow/createAuthorizationCodeV5Steps.tsx

import type { AuthorizationCodeFlowController } from '../../hooks/useAuthorizationCodeFlowController';
import type { EnhancedFlowStep } from '../EnhancedStepFlowV2';
import {
	createAuthUrlStep,
	createCallbackHandlingStep,
	createCredentialsStep,
	createPKCEStep,
	createRefreshTokenStep,
	createTokenExchangeStep,
	createTokenValidationStep,
	createUserAuthorizationStep,
} from '../steps/CommonSteps';

interface CreateAuthorizationCodeV5StepsParams {
	controller: AuthorizationCodeFlowController;
}

const createAuthorizationCodeV5Steps = ({
	controller,
}: CreateAuthorizationCodeV5StepsParams): EnhancedFlowStep[] => {
	const {
		credentials,
		setCredentials,
		saveCredentials,
		hasCredentialsSaved,
		hasUnsavedCredentialChanges,
		isSavingCredentials,
		pkceCodes,
		setPkceCodes,
		generatePkceCodes,
		authUrl,
		generateAuthorizationUrl,
		showUrlExplainer,
		setShowUrlExplainer,
		isAuthorizing,
		handlePopupAuthorization,
		handleRedirectAuthorization,
		authCode,
		resetFlow,
		isExchangingTokens,
		exchangeTokens,
		tokens,
		flowVariant,
		hasStepResult,
		saveStepResult,
		userInfo,
		fetchUserInfo,
		isFetchingUserInfo,
		refreshToken,
		refreshTokens,
		refreshedTokens,
		isRefreshingTokens,
		stepManager,
	} = controller;

	return [
		{
			...createCredentialsStep(
				credentials,
				setCredentials,
				saveCredentials,
				'OAuth 2.0 Authorization Code Flow V5',
				() => {
					saveStepResult('setup-credentials', { dismissed: true });
					stepManager.setStep(1, 'credentials dismissed');
				},
				controller.persistKey,
				false,
				undefined
			),
			canExecute:
				Boolean(credentials.environmentId && credentials.clientId && !isSavingCredentials) &&
				(!hasCredentialsSaved || hasUnsavedCredentialChanges),
			buttonText: isSavingCredentials
				? 'Saving...'
				: hasCredentialsSaved && !hasUnsavedCredentialChanges
					? 'Saved'
					: 'Save Configuration',
			completed: hasStepResult('setup-credentials'),
		},
		{
			...createPKCEStep(pkceCodes, setPkceCodes, generatePkceCodes),
			canExecute: Boolean(credentials.environmentId && credentials.clientId),
			completed: hasStepResult('generate-pkce'),
		},
		{
			...createAuthUrlStep(
				authUrl,
				generateAuthorizationUrl,
				credentials,
				pkceCodes,
				undefined,
				undefined,
				isAuthorizing,
				showUrlExplainer,
				setShowUrlExplainer
			),
			canExecute: Boolean(
				credentials.environmentId &&
					credentials.clientId &&
					credentials.redirectUri &&
					pkceCodes.codeVerifier &&
					pkceCodes.codeChallenge
			),
			completed: hasStepResult('build-auth-url'),
		},
		{
			...createUserAuthorizationStep(
				authUrl,
				handlePopupAuthorization,
				handleRedirectAuthorization,
				isAuthorizing,
				authCode
			),
			canExecute: Boolean(authUrl) && !authCode,
			completed: hasStepResult('user-authorization') || Boolean(authCode),
		},
		{
			...createCallbackHandlingStep(authCode, resetFlow),
			canExecute: Boolean(authCode),
			completed: hasStepResult('handle-callback') || Boolean(authCode),
		},
		{
			...createTokenExchangeStep(
				authCode,
				tokens,
				async () => {
					await exchangeTokens();
				},
				credentials,
				isExchangingTokens,
				flowVariant
			),
			canExecute: Boolean(authCode && credentials.environmentId && credentials.clientId),
			completed: hasStepResult('exchange-tokens') || Boolean(tokens?.access_token),
		},
		{
			...createTokenValidationStep(tokens, userInfo, fetchUserInfo, isFetchingUserInfo, undefined),
			canExecute: Boolean(tokens?.access_token),
			completed: hasStepResult('validate-tokens') || Boolean(userInfo),
		},
		{
			...createRefreshTokenStep(
				refreshToken,
				refreshedTokens,
				refreshTokens,
				credentials,
				undefined,
				undefined,
				tokens,
				isRefreshingTokens,
				flowVariant
			),
			canExecute: Boolean(refreshToken),
			completed: hasStepResult('refresh-token-exchange') || Boolean(refreshedTokens?.access_token),
		},
	];
};

export default createAuthorizationCodeV5Steps;
