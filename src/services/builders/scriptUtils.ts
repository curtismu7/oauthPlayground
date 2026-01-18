// src/services/builders/scriptUtils.ts

import type { PostmanCollectionItem } from '../postmanTypes';

/**
 * Helper function to extract environment keys from script lines.
 */
export const extractEnvironmentScriptKeys = (
	input: string
): Array<{ action: 'get' | 'set'; key: string }> => {
	const keys: Array<{ action: 'get' | 'set'; key: string }> = [];
	const regex = /pm\.environment\.(get|set)\(["']([^"']+)["']/g;
	let match: RegExpExecArray | null = null;
	while (true) {
		match = regex.exec(input);
		if (match === null) break;
		const action = match[1] === 'get' ? 'get' : 'set';
		const key = match[2]?.trim();
		if (key) keys.push({ action, key });
	}
	return keys;
};

/**
 * Helper function to extract variables saved from test scripts in a Postman item (current item only, not nested)
 */
export const extractVariablesFromItem = (item: PostmanCollectionItem): string[] => {
	const variables: string[] = [];

	// Only extract from current item's events (not nested items - those are handled separately)
	if (item.event) {
		item.event.forEach((event) => {
			// Check both test and pre-request scripts for variable extraction
			if ((event.listen === 'test' || event.listen === 'prerequest') && event.script.exec) {
				event.script.exec.forEach((line) => {
					const keys = extractEnvironmentScriptKeys(line);
					keys.forEach(({ action, key }) => {
						if (action === 'set') variables.push(key);
					});
				});
			}
		});
	}

	return [...new Set(variables)];
};
