// src/services/postmanTypes.ts

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
	item?: PostmanCollectionItem[];
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
		description?: string;
	}>;
	item: PostmanCollectionItem[];
}

export interface PostmanEnvironment {
	id: string;
	name: string;
	values: Array<{
		key: string;
		value: string;
		type: 'default' | 'secret';
		enabled: boolean;
	}>;
	_postman_variable_scope: string;
	_postman_exported_at?: string;
	_postman_exported_using?: string;
}
