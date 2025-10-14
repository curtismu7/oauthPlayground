// src/services/deviceTypeService.tsx
// Device Type Configuration Service for Device Authorization Flows

export interface DeviceTypeConfig {
	id: string;
	name: string;
	displayName: string;
	brandName: string;
	icon: string;
	emoji: string;
	description: string;
	color: string;
	secondaryColor: string;
	scenario: string;
	useCase: string;
}

export const DEVICE_TYPES: Record<string, DeviceTypeConfig> = {
	'streaming-tv': {
		id: 'streaming-tv',
		name: 'Smart TV',
		displayName: 'Smart TV - Living Room',
		brandName: 'STREAMINGTV',
		icon: '📺',
		emoji: '📺',
		description: 'Stream your favorite shows and movies',
		color: '#dc2626', // Red
		secondaryColor: '#991b1b',
		scenario: 'Home Entertainment',
		useCase: 'Perfect for streaming apps, smart TVs, and media players'
	},
	'gas-pump': {
		id: 'gas-pump',
		name: 'Gas Pump',
		displayName: 'Pump #7 - Station 4215',
		brandName: 'FASTFUEL',
		icon: '⛽',
		emoji: '⛽',
		description: 'Quick and secure fuel payment',
		color: '#22c55e', // Green
		secondaryColor: '#16a34a',
		scenario: 'Fuel Payment',
		useCase: 'Ideal for gas stations, charging stations, and unattended payment terminals'
	},
	'iot-device': {
		id: 'iot-device',
		name: 'Industrial IoT Controller',
		displayName: 'Pump Control Unit #4 - Sector A',
		brandName: 'SMARTVALVE',
		icon: '⚙️',
		emoji: '⚙️',
		description: 'Industrial automation control',
		color: '#3b82f6', // Blue
		secondaryColor: '#2563eb',
		scenario: 'Industrial IoT',
		useCase: 'Built for industrial controllers, pump valves, SCADA systems, and factory automation'
	},
	'gaming-console': {
		id: 'gaming-console',
		name: 'Gaming Console',
		displayName: 'Gaming Console - Family Room',
		brandName: 'GAMESTATION',
		icon: '🎮',
		emoji: '🎮',
		description: 'Play your favorite games',
		color: '#8b5cf6', // Purple
		secondaryColor: '#7c3aed',
		scenario: 'Gaming & Entertainment',
		useCase: 'Designed for gaming consoles, cloud gaming, and entertainment systems'
	},
	'fitness-wearable': {
		id: 'fitness-wearable',
		name: 'Fitness Tracker',
		displayName: 'Fitness Watch - Model X',
		brandName: 'FITTRACK',
		icon: '⌚',
		emoji: '⌚',
		description: 'Track your fitness journey',
		color: '#f97316', // Orange
		secondaryColor: '#ea580c',
		scenario: 'Health & Fitness',
		useCase: 'Optimized for wearables, fitness trackers, and health monitoring devices'
	},
	'smart-printer': {
		id: 'smart-printer',
		name: 'Smart Printer',
		displayName: 'Printer - Office HP1200',
		brandName: 'PRINTPRO',
		icon: '🖨️',
		emoji: '🖨️',
		description: 'Secure document printing',
		color: '#06b6d4', // Cyan
		secondaryColor: '#0891b2',
		scenario: 'Office Equipment',
		useCase: 'Built for printers, scanners, and office document management'
	},
	'airport-kiosk': {
		id: 'airport-kiosk',
		name: 'Airport Kiosk',
		displayName: 'Check-In Kiosk - Gate B12',
		brandName: 'AIRCHECK',
		icon: '✈️',
		emoji: '✈️',
		description: 'Quick self-service check-in',
		color: '#0ea5e9', // Sky Blue
		secondaryColor: '#0284c7',
		scenario: 'Travel & Transportation',
		useCase: 'Perfect for airport kiosks, train stations, and travel check-in systems'
	},
	'pos-terminal': {
		id: 'pos-terminal',
		name: 'POS Terminal',
		displayName: 'Register #3 - Store 2418',
		brandName: 'QUICKPAY',
		icon: '💳',
		emoji: '💳',
		description: 'Secure payment processing',
		color: '#10b981', // Emerald
		secondaryColor: '#059669',
		scenario: 'Retail & Commerce',
		useCase: 'Ideal for point-of-sale systems, retail terminals, and payment kiosks'
	},
	'ai-agent': {
		id: 'ai-agent',
		name: 'AI Agent',
		displayName: 'AI Assistant - Enterprise Portal',
		brandName: 'NEXUS AI',
		icon: '🤖',
		emoji: '🤖',
		description: 'Autonomous AI agent authorization',
		color: '#a855f7', // Purple
		secondaryColor: '#9333ea',
		scenario: 'Artificial Intelligence',
		useCase: 'Perfect for AI agents, chatbots, autonomous systems, and LLM-powered applications'
	},
	'mcp-server': {
		id: 'mcp-server',
		name: 'MCP Server',
		displayName: 'MCP Server - Context Bridge v2.1',
		brandName: 'CONTEXTLINK',
		icon: '🔗',
		emoji: '🔗',
		description: 'Model Context Protocol server',
		color: '#ec4899', // Pink
		secondaryColor: '#db2777',
		scenario: 'AI Infrastructure',
		useCase: 'Designed for MCP servers, AI context providers, and model integration systems'
	},
	'smart-speaker': {
		id: 'smart-speaker',
		name: 'Smart Speaker',
		displayName: 'Echo Pro - Living Room',
		brandName: 'VOICELINK',
		icon: '🔊',
		emoji: '🔊',
		description: 'Voice-activated smart assistant',
		color: '#0891b2', // Cyan
		secondaryColor: '#0e7490',
		scenario: 'Voice & IoT',
		useCase: 'Built for smart speakers, voice assistants, and ambient computing devices'
	},
	'smart-vehicle': {
		id: 'smart-vehicle',
		name: 'Smart Vehicle',
		displayName: 'Model S - Dashboard System',
		brandName: 'AUTODRIVE',
		icon: '🚗',
		emoji: '🚗',
		description: 'Connected vehicle authorization',
		color: '#ef4444', // Red
		secondaryColor: '#dc2626',
		scenario: 'Automotive & Transport',
		useCase: 'Optimized for connected cars, vehicle infotainment, and automotive IoT systems'
	}
};

export const DEFAULT_DEVICE_TYPE = 'streaming-tv';

class DeviceTypeService {
	/**
	 * Get all device types
	 */
	getAllDeviceTypes(): DeviceTypeConfig[] {
		return Object.values(DEVICE_TYPES);
	}

	/**
	 * Get a specific device type config
	 */
	getDeviceType(deviceId: string): DeviceTypeConfig {
		return DEVICE_TYPES[deviceId] || DEVICE_TYPES[DEFAULT_DEVICE_TYPE];
	}

	/**
	 * Get device type options for dropdown
	 */
	getDeviceTypeOptions(): Array<{ value: string; label: string; emoji: string }> {
		return Object.values(DEVICE_TYPES).map(device => ({
			value: device.id,
			label: device.name,
			emoji: device.emoji
		}));
	}

	/**
	 * Get device-specific welcome message
	 */
	getWelcomeMessage(deviceId: string): string {
		const device = this.getDeviceType(deviceId);
		return `You are now logged in to ${device.brandName}!`;
	}

	/**
	 * Get device-specific waiting message
	 */
	getWaitingMessage(deviceId: string): string {
		const device = this.getDeviceType(deviceId);
		
		const messages: Record<string, string> = {
			'streaming-tv': 'WAITING FOR AUTHORIZATION',
			'gas-pump': 'AWAITING PAYMENT APPROVAL',
			'iot-device': 'CONTROLLER PAIRING',
			'gaming-console': 'CONNECTING ACCOUNT',
			'fitness-wearable': 'SYNCING DEVICE',
			'smart-printer': 'CONNECTING TO ACCOUNT',
			'airport-kiosk': 'AWAITING CHECK-IN',
			'pos-terminal': 'AWAITING AUTHORIZATION',
			'ai-agent': 'AGENT AUTHENTICATION',
			'mcp-server': 'CONTEXT AUTHORIZATION',
			'smart-speaker': 'VOICE PAIRING',
			'smart-vehicle': 'VEHICLE SYNC'
		};
		
		return messages[deviceId] || 'WAITING FOR AUTHORIZATION';
	}

	/**
	 * Get device-specific instruction message
	 */
	getInstructionMessage(deviceId: string): string {
		const messages: Record<string, string> = {
			'streaming-tv': 'Scan this QR code to activate your StreamingTV account on this TV',
			'gas-pump': 'Scan to authorize payment and start pumping',
			'iot-device': 'Scan to authorize this industrial controller and connect to SCADA network',
			'gaming-console': 'Scan to link your gaming account to this console',
			'fitness-wearable': 'Scan to sync your fitness tracker with your mobile app',
			'smart-printer': 'Scan to connect this printer to your account',
			'airport-kiosk': 'Scan to complete your check-in process',
			'pos-terminal': 'Scan to authorize this payment terminal',
			'ai-agent': 'Scan to authorize this AI agent and grant it access to your resources',
			'mcp-server': 'Scan to authorize MCP server connection and enable context sharing',
			'smart-speaker': 'Scan to link your voice assistant to your account',
			'smart-vehicle': 'Scan to connect your vehicle infotainment system'
		};
		
		return messages[deviceId] || 'Scan this QR code to authorize this device';
	}

	/**
	 * Get device-specific apps/features for the success screen
	 */
	getDeviceApps(deviceId: string): Array<{ label: string; icon: string; color: string }> {
		const apps: Record<string, Array<{ label: string; icon: string; color: string }>> = {
			'streaming-tv': [
				{ label: 'Movies', icon: '🎬', color: '#dc2626' },
				{ label: 'Series', icon: '📺', color: '#3b82f6' },
				{ label: 'Music', icon: '🎵', color: '#22c55e' },
				{ label: 'Games', icon: '🎮', color: '#f97316' },
				{ label: 'Kids', icon: '👶', color: '#6366f1' },
				{ label: 'Live', icon: '🎤', color: '#a855f7' },
				{ label: 'Featured', icon: '⭐', color: '#eab308' },
				{ label: 'Settings', icon: '⚙️', color: '#64748b' }
			],
			'gas-pump': [
				{ label: 'Regular', icon: '⛽', color: '#22c55e' },
				{ label: 'Premium', icon: '⛽', color: '#3b82f6' },
				{ label: 'Diesel', icon: '⛽', color: '#fbbf24' },
				{ label: 'Receipt', icon: '📄', color: '#64748b' }
			],
		'iot-device': [
			{ label: 'System Status', icon: '📊', color: '#3b82f6' },
			{ label: 'Valve Control', icon: '⚙️', color: '#10b981' },
			{ label: 'Pressure', icon: '🔧', color: '#ef4444' },
			{ label: 'Flow Rate', icon: '💧', color: '#0ea5e9' },
			{ label: 'Alarms', icon: '🚨', color: '#f59e0b' },
			{ label: 'Diagnostics', icon: '🔍', color: '#8b5cf6' },
			{ label: 'Logs', icon: '📝', color: '#06b6d4' },
			{ label: 'Settings', icon: '⚙️', color: '#64748b' }
		],
			'gaming-console': [
				{ label: 'Play', icon: '🎮', color: '#8b5cf6' },
				{ label: 'Store', icon: '🛒', color: '#3b82f6' },
				{ label: 'Friends', icon: '👥', color: '#22c55e' },
				{ label: 'Library', icon: '📚', color: '#f97316' },
				{ label: 'Achievements', icon: '🏆', color: '#fbbf24' },
				{ label: 'Party', icon: '🎉', color: '#ec4899' },
				{ label: 'Streaming', icon: '📡', color: '#06b6d4' },
				{ label: 'Settings', icon: '⚙️', color: '#64748b' }
			],
			'fitness-wearable': [
				{ label: 'Activity', icon: '🏃', color: '#22c55e' },
				{ label: 'Heart Rate', icon: '❤️', color: '#ef4444' },
				{ label: 'Sleep', icon: '😴', color: '#8b5cf6' },
				{ label: 'Nutrition', icon: '🍎', color: '#f97316' }
			],
			'smart-printer': [
				{ label: 'Print', icon: '🖨️', color: '#3b82f6' },
				{ label: 'Scan', icon: '📷', color: '#22c55e' },
				{ label: 'Copy', icon: '📋', color: '#f97316' },
				{ label: 'Queue', icon: '📄', color: '#64748b' }
			],
			'airport-kiosk': [
				{ label: 'Check In', icon: '✅', color: '#22c55e' },
				{ label: 'Baggage', icon: '🧳', color: '#3b82f6' },
				{ label: 'Boarding', icon: '🎫', color: '#f97316' },
				{ label: 'Help', icon: 'ℹ️', color: '#64748b' }
			],
			'pos-terminal': [
				{ label: 'Pay', icon: '💳', color: '#22c55e' },
				{ label: 'Refund', icon: '↩️', color: '#f97316' },
				{ label: 'Receipt', icon: '📄', color: '#3b82f6' },
				{ label: 'Help', icon: 'ℹ️', color: '#64748b' }
			],
			'ai-agent': [
				{ label: 'Chat', icon: '💬', color: '#a855f7' },
				{ label: 'Tasks', icon: '✓', color: '#22c55e' },
				{ label: 'Memory', icon: '🧠', color: '#3b82f6' },
				{ label: 'Tools', icon: '🔧', color: '#f59e0b' },
				{ label: 'Context', icon: '📚', color: '#06b6d4' },
				{ label: 'Analytics', icon: '📊', color: '#8b5cf6' },
				{ label: 'History', icon: '📜', color: '#ec4899' },
				{ label: 'Settings', icon: '⚙️', color: '#64748b' }
			],
			'mcp-server': [
				{ label: 'Contexts', icon: '🔗', color: '#ec4899' },
				{ label: 'Models', icon: '🤖', color: '#a855f7' },
				{ label: 'Resources', icon: '📦', color: '#3b82f6' },
				{ label: 'Tools', icon: '🔧', color: '#f59e0b' },
				{ label: 'Logs', icon: '📝', color: '#06b6d4' },
				{ label: 'Monitor', icon: '📊', color: '#22c55e' },
				{ label: 'Config', icon: '⚙️', color: '#64748b' },
				{ label: 'Docs', icon: '📖', color: '#8b5cf6' }
			],
			'smart-speaker': [
				{ label: 'Music', icon: '🎵', color: '#22c55e' },
				{ label: 'News', icon: '📰', color: '#3b82f6' },
				{ label: 'Weather', icon: '🌤️', color: '#0ea5e9' },
				{ label: 'Smart Home', icon: '🏠', color: '#f97316' },
				{ label: 'Reminders', icon: '⏰', color: '#8b5cf6' },
				{ label: 'Shopping', icon: '🛒', color: '#ec4899' },
				{ label: 'Skills', icon: '✨', color: '#fbbf24' },
				{ label: 'Settings', icon: '⚙️', color: '#64748b' }
			],
			'smart-vehicle': [
				{ label: 'Navigation', icon: '🗺️', color: '#3b82f6' },
				{ label: 'Media', icon: '🎵', color: '#22c55e' },
				{ label: 'Climate', icon: '🌡️', color: '#ef4444' },
				{ label: 'Vehicle Info', icon: '🚗', color: '#06b6d4' },
				{ label: 'Charging', icon: '🔋', color: '#10b981' },
				{ label: 'Apps', icon: '📱', color: '#a855f7' },
				{ label: 'Garage', icon: '🏠', color: '#f59e0b' },
				{ label: 'Settings', icon: '⚙️', color: '#64748b' }
			]
		};
		
		return apps[deviceId] || apps['streaming-tv'];
	}
}

export const deviceTypeService = new DeviceTypeService();
export default deviceTypeService;

