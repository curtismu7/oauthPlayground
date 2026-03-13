/**
 * Shared AI Assistant Configuration
 * This file keeps both the main app and standalone AI Assistant in sync
 */

export interface AIMessage {
	id: string;
	type: 'user' | 'assistant';
	content: string;
	links?: Array<{
		title: string;
		path: string;
		type: string;
		external?: boolean;
	}>;
	mcpResult?: Record<string, unknown>;
	webResult?: Record<string, unknown>;
	groqUsed?: boolean;
	streaming?: boolean;
	timestamp: Date;
}

export interface AIAssistantConfig {
	// Welcome message
	welcomeMessage: string;

	// Feature prompts
	featurePrompts: string[];

	// Default settings
	defaultSettings: {
		includeWeb: boolean;
		includeLive: boolean;
		includeApiDocs: boolean;
		includeSpecs: boolean;
		includeWorkflows: boolean;
		includeUserGuide: boolean;
	};

	// UI Configuration
	ui: {
		assistantName: string;
		assistantIcon: string;
		headerTitle: string;
		maxMessages: number;
		messageTTL: number; // in minutes
	};

	// Branding
	branding: {
		appName: string;
		companyName: string;
		logo: string;
		primaryColor: string;
		secondaryColor: string;
	};
}

export const AI_ASSISTANT_CONFIG: AIAssistantConfig = {
	welcomeMessage:
		"Hi! I'm your MasterFlow API assistant. I can help you:\n\n• Find the right OAuth flow for your needs\n• Explain OAuth and OIDC concepts\n• Guide you through configuration\n• Troubleshoot issues\n\nWhat would you like to know?",

	featurePrompts: [
		'Get worker token',
		'List applications',
		'Create application',
		'Get user info',
		'List environments',
		'List subscriptions',
		'Show org licenses',
		'Get OIDC discovery document',
		'What can I do in chat?',
		'What is PKCE?',
		"What's the difference between OAuth and OIDC?",
	],

	defaultSettings: {
		includeWeb: true,
		includeLive: true,
		includeApiDocs: false,
		includeSpecs: false,
		includeWorkflows: false,
		includeUserGuide: false,
	},

	ui: {
		assistantName: 'MasterFlow Assistant',
		assistantIcon: '🤖',
		headerTitle: 'MasterFlow API Assistant',
		maxMessages: 100,
		messageTTL: 30, // 30 minutes
	},

	branding: {
		appName: 'MasterFlow API',
		companyName: 'Ping Identity',
		logo: '🤖',
		primaryColor: '#667eea',
		secondaryColor: '#764ba2',
	},
};

// Helper functions to sync configurations
export const getWelcomeMessage = (): string => AI_ASSISTANT_CONFIG.welcomeMessage;

export const getFeaturePrompts = (): string[] => AI_ASSISTANT_CONFIG.featurePrompts;

export const getDefaultSettings = () => AI_ASSISTANT_CONFIG.defaultSettings;

export const getUIConfig = () => AI_ASSISTANT_CONFIG.ui;

export const getBranding = () => AI_ASSISTANT_CONFIG.branding;

// Message utilities
export const createAIMessage = (
	type: 'user' | 'assistant',
	content: string,
	links?: AIMessage['links']
): AIMessage => ({
	id: Math.random().toString(36).substr(2, 9),
	type,
	content,
	links,
	timestamp: new Date(),
});

export const isMessageExpired = (
	message: AIMessage,
	ttlMinutes: number = AI_ASSISTANT_CONFIG.ui.messageTTL
): boolean => {
	const now = new Date();
	const messageAge = now.getTime() - message.timestamp.getTime();
	const ttlMs = ttlMinutes * 60 * 1000;
	return messageAge > ttlMs;
};
