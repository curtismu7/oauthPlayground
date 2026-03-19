/**
 * @file index.ts
 * @description Main export file for Postman collection generator modules
 * @version 9.0.0
 *
 * This file provides backward-compatible exports for the refactored
 * Postman collection generator modules.
 */

// Types
export type { PostmanCollection, PostmanCollectionItem, PostmanEnvironment } from './postmanTypes';
export { COLLECTION_VERSION } from './postmanTypes';

// URL Utilities
export { convertEndpointToPostman, parseUrl } from './postmanUrlUtils';

// Request Utilities
export { convertRequestBody, extractHeaders } from './postmanRequestUtils';

// Scripts
export {
	generatePasswordScript,
	generateRandomBaseballPlayerScript,
	generateTokenExtractionScript,
	getDefaultScopes,
} from './postmanScripts';
