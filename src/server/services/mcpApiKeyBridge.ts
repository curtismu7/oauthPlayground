/**
 * @file mcpApiKeyBridge.ts
 * @module server/services
 * @description Bridge service for MCP servers to access stored API keys
 * @version 1.0.0
 * @since 2026-03-11
 */

import { apiKeyServiceServer } from './apiKeyServiceServer';

/**
 * MCP API Key Bridge
 * Provides a way for MCP servers to access stored API keys
 */
export class McpApiKeyBridge {
	/**
	 * Get API key for MCP server
	 */
	public static async getApiKey(service: string): Promise<string | null> {
		return await apiKeyServiceServer.getApiKey(service);
	}

	/**
	 * Check if API key exists for MCP server
	 */
	public static async hasApiKey(service: string): Promise<boolean> {
		return await apiKeyServiceServer.hasApiKey(service);
	}

	/**
	 * Get all available API keys info (without exposing actual keys)
	 */
	public static async getAvailableServices(): Promise<string[]> {
		// For now, return known services
		// In the future, this could be dynamic based on stored keys
		return ['brave-search', 'github'];
	}
}

// Export for use in MCP server configuration
export default McpApiKeyBridge;
