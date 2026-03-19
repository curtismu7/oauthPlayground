/**
 * @file postmanTypes.ts
 * @description Postman collection type definitions
 * @version 9.0.0
 */

// Collection version - update this when making breaking changes or major updates
export const COLLECTION_VERSION = '9.0.0';

export interface PostmanCollectionItem {
	name: string;
	request?: {
		method: string;
		header?: Array<{ key: string; value: string; type?: string }>;
		body?: {
			mode: string;
			raw?: string;
			urlencoded?: Array<{ key: string; value: string }>;
			options?: {
				raw?: {
					language?: string;
				};
			};
		};
		url: {
			raw: string;
			protocol?: string;
			host?: string[];
			port?: string;
			path?: string[];
			query?: Array<{ key: string; value: string }>;
		};
		description?: string;
	};
	item?: PostmanCollectionItem[]; // For folders/nested collections
	response?: Array<unknown>;
	event?: Array<{
		listen: 'prerequest' | 'test';
		script: {
			exec: string[];
			type: string;
		};
	}>;
	description?: string;
}

export interface PostmanCollection {
	info: {
		name: string;
		description: string;
		schema: string;
		version?: string;
	};
	variable: Array<{
		key: string;
		value: string;
		type?: string;
	}>;
	item: PostmanCollectionItem[];
}

export interface PostmanEnvironment {
	id: string;
	name: string;
	values: Array<{
		key: string;
		value: string;
		enabled: boolean;
	}>;
}
