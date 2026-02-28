// src/services/variablePolicy.ts

import { GenerationIssues } from './postmanIssues';

export type VariablePolicy = 'required' | 'user-fill' | 'runtime-set';

const VARIABLE_POLICIES: Record<string, VariablePolicy> = {
	authPath: 'required',
	apiPath: 'required',
	envID: 'required',
	worker_client_id: 'required',
	worker_client_secret: 'required',
	user_client_id: 'user-fill',
	user_client_secret: 'user-fill',
	redirect_uri: 'user-fill',
	logout_uri: 'user-fill',
	post_logout_redirect_uri: 'user-fill',
};

export const RUNTIME_SET_VARIABLES = new Set([
	'workerToken',
	'userToken',
	'access_token',
	'id_token',
	'refresh_token',
	'expires_in',
	'authorization_code',
	'authCode',
	'flowID',
	'interactionId',
	'interactionToken',
	'userId',
	'SignUpUserID',
	'SignUpUsername',
	'SignUpPopID',
	'SignInUserID',
	'SignInUsername',
	'SignInUserEmail',
	'baseballPlayerFirstName',
	'baseballPlayerLastName',
	'baseballPlayerEmail',
	'baseballPlayerUsername',
	'groupId',
	'webAppSignInWithPKCEId',
	'SignInWithPKCEAppSecret',
	'SignInSignonPolicyID',
	'flowID',
	'authCode',
	'userPassword',
	'newPassword',
	'deviceId',
	'deviceAuthenticationId',
	'deviceAuthenticationPolicyId',
	'sessionId',
	'request_uri',
	'par_request_uri',
	'code_verifier',
	'code_challenge',
	'code_challenge_method',
	'codeChallenge',
	'codeChallengeMethod',
	'codeVerifier',
]);

/**
 * Check whether a value is blank or whitespace only.
 */
export const isBlank = (value?: string | null): boolean => {
	if (value === undefined || value === null) return true;
	return value.trim().length === 0;
};

/**
 * Require a non-blank string; adds error and returns a placeholder if missing.
 */
export const requireNonBlankString = (
	name: string,
	value: string | undefined,
	issues: GenerationIssues,
	context?: Record<string, unknown>
): string => {
	const trimmed = value?.trim() ?? '';
	if (trimmed.length === 0) {
		issues.addError('REQUIRED_VALUE_MISSING', `Required value "${name}" is blank.`, context);
		return '<<REQUIRED_VALUE_MISSING>>';
	}
	return trimmed;
};

/**
 * Allow blank values but emit a warning every time.
 */
export const allowBlankButWarn = (
	name: string,
	value: string | undefined,
	issues: GenerationIssues,
	context?: Record<string, unknown>
): string => {
	if (isBlank(value)) {
		const policyLabel = RUNTIME_SET_VARIABLES.has(name)
			? 'Value intentionally blank — set by collection scripts at runtime'
			: 'Value intentionally blank — user must fill before running collection';
		issues.addWarning('INTENTIONALLY_BLANK', `${policyLabel}: "${name}"`, context);
		return value ?? '';
	}
	return value?.trim() ?? '';
};

/**
 * Determine variable policy based on registry or runtime-set heuristics.
 */
export const resolveVariablePolicy = (key: string): VariablePolicy => {
	if (VARIABLE_POLICIES[key]) return VARIABLE_POLICIES[key];
	if (RUNTIME_SET_VARIABLES.has(key)) return 'runtime-set';
	return 'user-fill';
};

/**
 * Return required variable keys for validation.
 */
export const getRequiredVariableKeys = (): string[] => {
	return Object.entries(VARIABLE_POLICIES)
		.filter(([, policy]) => policy === 'required')
		.map(([key]) => key);
};

/**
 * Enforce variable policies and attach descriptions for intentionally blank values.
 */
export const finalizeVariables = (
	variables: Array<{ key: string; value: string; type?: string; description?: string }>,
	issues: GenerationIssues,
	contextLabel: string
): Array<{ key: string; value: string; type?: string; description?: string }> => {
	const sortedVariables = [...variables].sort((a, b) => a.key.localeCompare(b.key));
	return sortedVariables.map((variable) => {
		const key = requireNonBlankString('variable.key', variable.key, issues, {
			contextLabel,
			variable,
		});
		const policy = resolveVariablePolicy(key);
		let value = variable.value;

		if (policy === 'required') {
			value = requireNonBlankString(key, variable.value, issues, { contextLabel, key });
		} else {
			value = allowBlankButWarn(key, variable.value, issues, { contextLabel, key });
		}

		if (isBlank(value)) {
			const warningDescription = RUNTIME_SET_VARIABLES.has(key)
				? 'Value intentionally blank — set by collection scripts at runtime.'
				: 'Value intentionally blank — user must fill before running collection.';
			const description = variable.description
				? `${variable.description} ${warningDescription}`
				: warningDescription;
			return { ...variable, key, value, description };
		}

		return { ...variable, key, value };
	});
};
