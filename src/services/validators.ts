// src/services/validators.ts

import { extractEnvironmentScriptKeys } from './builders/scriptUtils';
import { GenerationIssues } from './postmanIssues';
import type { PostmanCollection, PostmanCollectionItem } from './postmanTypes';
import {
	getRequiredVariableKeys,
	isBlank,
	RUNTIME_SET_VARIABLES,
	resolveVariablePolicy,
} from './variablePolicy';

/**
 * Validate collection invariants before output.
 */
export const validateCollection = (
	collection: PostmanCollection,
	issues: GenerationIssues,
	contextLabel: string
): void => {
	const variableKeys = new Set(collection.variable.map((variable) => variable.key));
	const postmanBuiltins = new Set([
		'$timestamp',
		'$guid',
		'$randomUUID',
		'$randomInt',
		'$randomAlphaNumeric',
		'$randomBoolean',
		'$randomFirstName',
		'$randomLastName',
		'$randomUserName',
		'$randomEmail',
		'$randomPhoneNumber',
		'$randomCity',
		'$randomCountry',
		'$randomStreetAddress',
		'$randomZipCode',
	]);

	const extractTemplateVariables = (input?: string): string[] => {
		if (!input) return [];
		const matches = input.match(/\{\{([^}]+)\}\}/g) || [];
		return matches.map((match) => match.replace('{{', '').replace('}}', '').trim());
	};

	const validateTemplateVariables = (values: string[], currentPath: string): void => {
		values.forEach((value) => {
			if (value.startsWith('$')) {
				if (!postmanBuiltins.has(value)) {
					issues.addWarning('TEMPLATE_BUILTIN_UNKNOWN', 'Unknown Postman built-in variable.', {
						currentPath,
						value,
					});
				}
				return;
			}
			if (!variableKeys.has(value)) {
				issues.addError(
					'TEMPLATE_VAR_UNKNOWN',
					'Template variable is not defined in variables list.',
					{
						currentPath,
						value,
					}
				);
			}
		});
	};

	if (!collection.info?.name?.trim()) {
		issues.addError('COLLECTION_NAME_MISSING', 'Collection name is missing.', { contextLabel });
	}
	if (!collection.info?.schema?.trim()) {
		issues.addError('COLLECTION_SCHEMA_MISSING', 'Collection schema is missing.', { contextLabel });
	}

	const validateItem = (item: PostmanCollectionItem, path: string): void => {
		const currentPath = `${path}/${item.name}`;
		if (!item.name?.trim()) {
			issues.addError('ITEM_NAME_MISSING', 'Collection item name is missing.', { currentPath });
		}
		if (item.request) {
			if (!item.request.method?.trim()) {
				issues.addError('REQUEST_METHOD_MISSING', 'Request method is missing.', { currentPath });
			}
			const rawUrl = item.request.url?.raw?.trim() ?? '';
			if (!rawUrl) {
				issues.addError('REQUEST_URL_MISSING', 'Request URL is missing.', { currentPath });
			}
			if (/^https?:\/\/($|\/|\?)/.test(rawUrl)) {
				issues.addError('REQUEST_URL_INVALID', 'Request URL is missing a host.', {
					currentPath,
					rawUrl,
				});
			}
			if (rawUrl.includes('{{authPath}}') && !rawUrl.includes('{{envID}}')) {
				issues.addError(
					'REQUEST_URL_MISSING_ENV',
					'Request URL uses {{authPath}} without {{envID}}.',
					{
						currentPath,
						rawUrl,
					}
				);
			}
			validateTemplateVariables(extractTemplateVariables(rawUrl), currentPath);
			if (item.request.header) {
				item.request.header.forEach((header) => {
					if (!header.key?.trim()) {
						issues.addError('HEADER_KEY_MISSING', 'Header key is missing.', {
							currentPath,
							header,
						});
					}
					const lowerKey = header.key?.toLowerCase() ?? '';
					const headerValue = header.value?.trim() ?? '';
					if (
						lowerKey === 'authorization' &&
						headerValue.startsWith('Bearer') &&
						!headerValue.includes('{{')
					) {
						issues.addWarning('HEADER_BEARER_BLANK', 'Authorization header is missing a token.', {
							currentPath,
							header,
						});
					}
					validateTemplateVariables(
						extractTemplateVariables(header.value),
						`${currentPath} [header:${header.key}]`
					);
				});
			}
			if (item.request.body?.raw) {
				validateTemplateVariables(
					extractTemplateVariables(item.request.body.raw),
					`${currentPath} [body.raw]`
				);
			}
			if (item.request.body?.urlencoded) {
				item.request.body.urlencoded.forEach((entry) => {
					validateTemplateVariables(
						extractTemplateVariables(entry.value),
						`${currentPath} [body.urlencoded:${entry.key}]`
					);
				});
			}
			if (item.event) {
				item.event.forEach((event) => {
					event.script.exec.forEach((line, index) => {
						validateTemplateVariables(
							extractTemplateVariables(line),
							`${currentPath} [script:${event.listen}:${index}]`
						);
						const envKeys = extractEnvironmentScriptKeys(line);
						envKeys.forEach(({ action, key }) => {
							if (!variableKeys.has(key) && !RUNTIME_SET_VARIABLES.has(key)) {
								issues.addError(
									'ENV_SCRIPT_VAR_UNKNOWN',
									'Environment variable is referenced in script but not defined.',
									{
										currentPath,
										action,
										key,
									}
								);
							}
						});
					});
				});
			}
		}
		if (item.item) {
			for (const nested of item.item) {
				validateItem(nested, currentPath);
			}
		}
	};

	for (const item of collection.item) {
		validateItem(item, collection.info.name);
	}
};

/**
 * Validate environment invariants before output.
 */
export const validateEnvironment = (
	variables: Array<{ key: string; value: string; type?: string; description?: string }>,
	issues: GenerationIssues,
	contextLabel: string
): void => {
	const variableKeys = new Set(variables.map((variable) => variable.key));
	getRequiredVariableKeys().forEach((key) => {
		if (!variableKeys.has(key)) {
			issues.addError('ENV_VAR_REQUIRED_MISSING', 'Required environment variable is missing.', {
				contextLabel,
				key,
			});
		}
	});

	variables.forEach((variable) => {
		if (!variable.key?.trim()) {
			issues.addError('ENV_VAR_KEY_MISSING', 'Environment variable key is missing.', {
				contextLabel,
				variable,
			});
		}
		const policy = resolveVariablePolicy(variable.key);
		if (policy === 'required' && isBlank(variable.value)) {
			issues.addError('ENV_VAR_REQUIRED_BLANK', 'Required environment variable is blank.', {
				contextLabel,
				key: variable.key,
			});
		}
		if (policy !== 'required' && isBlank(variable.value)) {
			issues.addWarning('ENV_VAR_BLANK', 'Environment variable is intentionally blank.', {
				contextLabel,
				key: variable.key,
				policy,
			});
		}
	});
};

/**
 * Validate variable coverage against an expected registry.
 */
export const validateVariableCoverage = (
	variables: Array<{ key: string; value: string; type?: string; description?: string }>,
	issues: GenerationIssues,
	contextLabel: string,
	expectedKeys: string[]
): void => {
	const actualKeys = new Set(variables.map((variable) => variable.key));
	const expectedKeySet = new Set(expectedKeys);

	expectedKeys.forEach((key) => {
		if (!actualKeys.has(key)) {
			issues.addWarning('ENV_VAR_EXPECTED_MISSING', 'Expected environment variable is missing.', {
				contextLabel,
				key,
			});
		}
	});

	actualKeys.forEach((key) => {
		if (!expectedKeySet.has(key)) {
			issues.addWarning('ENV_VAR_UNEXPECTED', 'Unexpected environment variable was emitted.', {
				contextLabel,
				key,
			});
		}
	});
};

/**
 * Validate unresolved placeholders in output JSON.
 */
export const validatePlaceholders = (
	serialized: string,
	issues: GenerationIssues,
	contextLabel: string
): void => {
	if (serialized.includes('{{}}')) {
		issues.addError('PLACEHOLDER_EMPTY', 'Found empty placeholder {{}} in output.', {
			contextLabel,
		});
	}
	if (serialized.includes('{{undefined}}') || serialized.includes('{{null}}')) {
		issues.addError('PLACEHOLDER_INVALID', 'Found undefined/null placeholders in output.', {
			contextLabel,
		});
	}
	if (
		serialized.includes('<<REQUIRED_VALUE_MISSING>>') ||
		serialized.includes('<<MISSING_VALUE>>')
	) {
		issues.addError('PLACEHOLDER_SENTINEL', 'Found required/missing value sentinels in output.', {
			contextLabel,
		});
	}
	if (serialized.includes('"undefined"') || serialized.includes('"null"')) {
		issues.addError('PLACEHOLDER_LITERAL', 'Found literal "undefined"/"null" strings in output.', {
			contextLabel,
		});
	}
};
