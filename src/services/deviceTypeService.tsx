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
		name: 'Samsung Smart TV',
		displayName: 'Samsung 65" QLED 4K Smart TV',
		brandName: 'SAMSUNG',
		icon: '📺',
		emoji: '📺',
		description: 'Stream Netflix, Disney+, Hulu, and more',
		color: '#1e40af', // Samsung Blue
		secondaryColor: '#1e3a8a',
		scenario: 'Home Entertainment',
		useCase: 'Perfect for streaming apps, smart TVs, and media players'
	},
	'gas-pump': {
		id: 'gas-pump',
		name: 'Shell Gas Pump',
		displayName: 'Shell Fuel Center - Pump #7',
		brandName: 'SHELL',
		icon: '⛽',
		emoji: '⛽',
		description: 'Pay with Shell Fuel Rewards and mobile app',
		color: '#fbbf24', // Shell Yellow
		secondaryColor: '#f59e0b',
		scenario: 'Fuel Payment',
		useCase: 'Ideal for gas stations, charging stations, and unattended payment terminals'
	},
	'iot-device': {
		id: 'iot-device',
		name: 'Siemens IoT Controller',
		displayName: 'Siemens SIMATIC S7-1500 PLC',
		brandName: 'SIEMENS',
		icon: '⚙️',
		emoji: '⚙️',
		description: 'Industrial automation control system',
		color: '#0ea5e9', // Siemens Blue
		secondaryColor: '#0284c7',
		scenario: 'Industrial IoT',
		useCase: 'Built for industrial controllers, pump valves, SCADA systems, and factory automation'
	},
	'gaming-console': {
		id: 'gaming-console',
		name: 'Xbox Controller',
		displayName: 'Xbox Wireless Controller',
		brandName: 'MICROSOFT',
		icon: '🎮',
		emoji: '🎮',
		description: 'Connect to Xbox Game Pass and cloud gaming',
		color: '#10b981', // Xbox Green
		secondaryColor: '#059669',
		scenario: 'Gaming & Entertainment',
		useCase: 'Designed for gaming consoles, cloud gaming, and entertainment systems'
	},
	'fitness-wearable': {
		id: 'fitness-wearable',
		name: 'Apple Watch',
		displayName: 'Apple Watch Series 9 - Health & Fitness',
		brandName: 'APPLE',
		icon: '⌚',
		emoji: '⌚',
		description: 'Sync workouts, heart rate, and health data',
		color: '#1d4ed8', // Apple Blue
		secondaryColor: '#1e40af',
		scenario: 'Health & Fitness',
		useCase: 'Optimized for wearables, fitness trackers, and health monitoring devices'
	},
	'smart-printer': {
		id: 'smart-printer',
		name: 'Canon Printer',
		displayName: 'Canon PIXMA TR8620 All-in-One',
		brandName: 'CANON',
		icon: '🖨️',
		emoji: '🖨️',
		description: 'Print, scan, copy from Canon PRINT app',
		color: '#dc2626', // Canon Red
		secondaryColor: '#b91c1c',
		scenario: 'Office Equipment',
		useCase: 'Built for printers, scanners, and office document management'
	},
	'airport-kiosk': {
		id: 'airport-kiosk',
		name: 'American Airlines Kiosk',
		displayName: 'American Airlines Terminal C - Gate C15',
		brandName: 'AMERICAN',
		icon: '✈️',
		emoji: '✈️',
		description: 'American Airlines self-service check-in',
		color: '#dc2626', // American Red
		secondaryColor: '#b91c1c',
		scenario: 'Travel & Transportation',
		useCase: 'Perfect for airport kiosks, train stations, and travel check-in systems'
	},
	'pos-terminal': {
		id: 'pos-terminal',
		name: 'Clover POS',
		displayName: 'Clover Station - Register #3',
		brandName: 'CLOVER',
		icon: '💳',
		emoji: '💳',
		description: 'Secure payment processing',
		color: '#059669', // Clover Green
		secondaryColor: '#047857',
		scenario: 'Retail & Commerce',
		useCase: 'Ideal for point-of-sale systems, retail terminals, and payment kiosks'
	},
	'ai-agent': {
		id: 'ai-agent',
		name: 'OpenAI Agent',
		displayName: 'OpenAI GPT-4 Assistant',
		brandName: 'OPENAI',
		icon: '🤖',
		emoji: '🤖',
		description: 'Autonomous AI agent authorization',
		color: '#10b981', // OpenAI Green
		secondaryColor: '#059669',
		scenario: 'Artificial Intelligence',
		useCase: 'Perfect for AI agents, chatbots, autonomous systems, and LLM-powered applications'
	},
	'mcp-server': {
		id: 'mcp-server',
		name: 'Anthropic MCP Server',
		displayName: 'Anthropic Claude MCP Server v2.1',
		brandName: 'ANTHROPIC',
		icon: '🔗',
		emoji: '🔗',
		description: 'Model Context Protocol server',
		color: '#8b5cf6', // Anthropic Purple
		secondaryColor: '#7c3aed',
		scenario: 'AI Infrastructure',
		useCase: 'Designed for MCP servers, AI context providers, and model integration systems'
	},
	'smart-speaker': {
		id: 'smart-speaker',
		name: 'Amazon Echo',
		displayName: 'Amazon Echo Dot - Kitchen Counter',
		brandName: 'AMAZON',
		icon: '🔊',
		emoji: '🔊',
		description: 'Stream Spotify, Apple Music, and more',
		color: '#f59e0b', // Amazon Orange
		secondaryColor: '#d97706',
		scenario: 'Voice & IoT',
		useCase: 'Built for smart speakers, voice assistants, and ambient computing devices'
	},
	'smartphone': {
		id: 'smartphone',
		name: 'Samsung Galaxy',
		displayName: 'Samsung Galaxy S24 Ultra - Personal Device',
		brandName: 'SAMSUNG',
		icon: '📱',
		emoji: '📱',
		description: 'Access apps, Samsung Pay, and biometrics',
		color: '#1e40af', // Samsung Blue
		secondaryColor: '#1e3a8a',
		scenario: 'Mobile Auth',
		useCase: 'Perfect for smartphones, companion apps, and mobile-first experiences'
	},
	'smart-vehicle': {
		id: 'smart-vehicle',
		name: 'BMW iX',
		displayName: 'BMW iX Electric SUV - Infotainment',
		brandName: 'BMW',
		icon: '🚗',
		emoji: '🚗',
		description: 'Connected vehicle authorization',
		color: '#1f2937', // BMW Dark
		secondaryColor: '#111827',
		scenario: 'Automotive & Transport',
		useCase: 'Optimized for connected cars, vehicle infotainment, and automotive IoT systems'
	},
	'smart-doorbell': {
		id: 'smart-doorbell',
		name: 'Smart Doorbell',
		displayName: 'Ring Video Doorbell Pro 2',
		brandName: 'RING',
		icon: '🔔',
		emoji: '🔔',
		description: 'Smart home security device',
		color: '#0ea5e9', // Sky Blue
		secondaryColor: '#0284c7',
		scenario: 'Smart Home Security',
		useCase: 'Perfect for smart doorbells, security cameras, and home monitoring systems'
	},
	'ring-doorbell': {
		id: 'ring-doorbell',
		name: 'Ring Doorbell',
		displayName: 'Ring Video Doorbell Pro 2',
		brandName: 'RING',
		icon: '🔔',
		emoji: '🔔',
		description: 'Smart home security device',
		color: '#0ea5e9', // Sky Blue
		secondaryColor: '#0284c7',
		scenario: 'Smart Home Security',
		useCase: 'Perfect for smart doorbells, security cameras, and home monitoring systems'
	},
	'vizio-tv': {
		id: 'vizio-tv',
		name: 'Vizio TV',
		displayName: 'VIZIO V-Series 4K UHD Smart TV',
		brandName: 'VIZIO',
		icon: '📺',
		emoji: '📺',
		description: 'Stream Netflix, Disney+, Hulu, and more',
		color: '#dc2626', // Red
		secondaryColor: '#991b1b',
		scenario: 'Home Entertainment',
		useCase: 'Perfect for streaming apps, smart TVs, and media players'
	},
	'sony-controller': {
		id: 'sony-controller',
		name: 'Sony Controller',
		displayName: 'Sony DualSense Wireless Controller',
		brandName: 'SONY',
		icon: '🎮',
		emoji: '🎮',
		description: 'Connect to PlayStation Network and game library',
		color: '#8b5cf6', // Purple
		secondaryColor: '#7c3aed',
		scenario: 'Gaming & Entertainment',
		useCase: 'Designed for gaming consoles, cloud gaming, and entertainment systems'
	},
	'bose-speaker': {
		id: 'bose-speaker',
		name: 'Bose Speaker',
		displayName: 'Bose Smart Speaker 500',
		brandName: 'BOSE',
		icon: '🔊',
		emoji: '🔊',
		description: 'Stream Spotify, Apple Music, and more',
		color: '#0891b2', // Cyan
		secondaryColor: '#0e7490',
		scenario: 'Voice & IoT',
		useCase: 'Built for smart speakers, voice assistants, and ambient computing devices'
	},
	'square-pos': {
		id: 'square-pos',
		name: 'Square POS',
		displayName: 'Square Point of Sale Terminal',
		brandName: 'SQUARE',
		icon: '💳',
		emoji: '💳',
		description: 'Secure payment processing',
		color: '#10b981', // Emerald
		secondaryColor: '#059669',
		scenario: 'Retail & Commerce',
		useCase: 'Ideal for point-of-sale systems, retail terminals, and payment kiosks'
	},
	'ev-charger': {
		id: 'ev-charger',
		name: 'EV Charging Station',
		displayName: 'Tesla Supercharger V4 - Stall 8A',
		brandName: 'SUPERCHARGER',
		icon: '🔌',
		emoji: '🔌',
		description: 'Electric vehicle fast charging',
		color: '#22c55e', // Green
		secondaryColor: '#16a34a',
		scenario: 'Electric Vehicle Infrastructure',
		useCase: 'Built for EV charging stations, fast chargers, and electric vehicle infrastructure'
	},
	'smart-thermostat': {
		id: 'smart-thermostat',
		name: 'Smart Thermostat',
		displayName: 'Nest Learning Thermostat 4th Gen',
		brandName: 'NEST',
		icon: '🌡️',
		emoji: '🌡️',
		description: 'Intelligent climate control',
		color: '#f97316', // Orange
		secondaryColor: '#ea580c',
		scenario: 'Smart Home Climate',
		useCase: 'Designed for smart thermostats, HVAC systems, and climate control devices'
	},
	'digital-signage': {
		id: 'digital-signage',
		name: 'Digital Signage',
		displayName: 'Samsung The Wall - Lobby Display',
		brandName: 'SAMSUNG',
		icon: '📢',
		emoji: '📢',
		description: 'Interactive digital display',
		color: '#8b5cf6', // Purple
		secondaryColor: '#7c3aed',
		scenario: 'Digital Advertising',
		useCase: 'Perfect for digital billboards, interactive displays, and public information systems'
	},
	'drone-controller': {
		id: 'drone-controller',
		name: 'Drone Controller',
		displayName: 'DJI Air 3 Remote Controller',
		brandName: 'DJI',
		icon: '🚁',
		emoji: '🚁',
		description: 'Autonomous drone system',
		color: '#06b6d4', // Cyan
		secondaryColor: '#0891b2',
		scenario: 'Autonomous Vehicles',
		useCase: 'Built for drones, UAVs, and autonomous aerial vehicle systems'
	},
	'vr-headset': {
		id: 'vr-headset',
		name: 'VR Headset',
		displayName: 'Meta Quest 3 - Gaming Setup',
		brandName: 'META',
		icon: '🥽',
		emoji: '🥽',
		description: 'Virtual reality experience',
		color: '#a855f7', // Purple
		secondaryColor: '#9333ea',
		scenario: 'Virtual & Augmented Reality',
		useCase: 'Optimized for VR headsets, AR glasses, and immersive reality devices'
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
			'smartphone': 'MOBILE SIGN-IN',
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
			'smartphone': 'Scan to authorize this mobile device immediately',
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
				{ label: 'Netflix', icon: '🎬', color: '#e50914' },
				{ label: 'Disney+', icon: '🏰', color: '#113ccf' },
				{ label: 'Hulu', icon: '📺', color: '#1ce783' },
				{ label: 'Prime Video', icon: '📹', color: '#00a8e1' },
				{ label: 'YouTube TV', icon: '📺', color: '#ff0000' },
				{ label: 'Apple TV+', icon: '🍎', color: '#000000' },
				{ label: 'HBO Max', icon: '🎭', color: '#673ab7' },
				{ label: 'SmartCast', icon: '⚙️', color: '#64748b' }
			],
			'gas-pump': [
				{ label: 'Kroger Pay', icon: '💳', color: '#004c91' },
				{ label: 'Kroger Plus Card', icon: '🏪', color: '#004c91' },
				{ label: 'Shell Rewards', icon: '⛽', color: '#ffde00' },
				{ label: 'GasBuddy', icon: '📱', color: '#7b68ee' },
				{ label: 'Fuel Rewards', icon: '💰', color: '#ff6b35' },
				{ label: 'Regular 87', icon: '⛽', color: '#22c55e' },
				{ label: 'Premium 93', icon: '⛽', color: '#3b82f6' },
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
				{ label: 'Call of Duty', icon: '🎮', color: '#000000' },
				{ label: 'FIFA 24', icon: '⚽', color: '#326295' },
				{ label: 'Fortnite', icon: '🏗️', color: '#9146ff' },
				{ label: 'Minecraft', icon: '🧱', color: '#62b47a' },
				{ label: 'Spider-Man 2', icon: '🕷️', color: '#c41e3a' },
				{ label: 'PlayStation Store', icon: '🛒', color: '#003791' },
				{ label: 'PlayStation Plus', icon: '➕', color: '#f59e0b' },
				{ label: 'Settings', icon: '⚙️', color: '#64748b' }
			],
			'fitness-wearable': [
				{ label: 'Strava', icon: '🏃', color: '#fc4c02' },
				{ label: 'MyFitnessPal', icon: '🍎', color: '#0072ce' },
				{ label: 'Nike Run Club', icon: '👟', color: '#000000' },
				{ label: 'Fitbit Today', icon: '⌚', color: '#00b0b9' },
				{ label: 'Apple Health', icon: '❤️', color: '#ff2d92' },
				{ label: 'Sleep Score', icon: '😴', color: '#8b5cf6' },
				{ label: 'Heart Rate', icon: '💓', color: '#ef4444' },
				{ label: 'Settings', icon: '⚙️', color: '#64748b' }
			],
			'smart-printer': [
				{ label: 'HP Smart', icon: '🖨️', color: '#0096d6' },
				{ label: 'HP Print Service', icon: '📄', color: '#0096d6' },
				{ label: 'Microsoft Office', icon: '📊', color: '#d83b01' },
				{ label: 'Google Docs', icon: '📝', color: '#4285f4' },
				{ label: 'Adobe Acrobat', icon: '📋', color: '#dc143c' },
				{ label: 'Print Queue', icon: '📄', color: '#64748b' },
				{ label: 'Scan to Email', icon: '📧', color: '#22c55e' },
				{ label: 'Settings', icon: '⚙️', color: '#64748b' }
			],
			'airport-kiosk': [
				{ label: 'American Airlines', icon: '✈️', color: '#c8102e' },
				{ label: 'Delta', icon: '🛫', color: '#003366' },
				{ label: 'United', icon: '🌐', color: '#0e4194' },
				{ label: 'Southwest', icon: '❤️', color: '#304cb2' },
				{ label: 'TSA PreCheck', icon: '🛂', color: '#1f4e79' },
				{ label: 'Check Baggage', icon: '🧳', color: '#3b82f6' },
				{ label: 'Print Boarding Pass', icon: '🎫', color: '#f97316' },
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
				{ label: 'Spotify', icon: '🎵', color: '#1db954' },
				{ label: 'Apple Music', icon: '🎶', color: '#fa243c' },
				{ label: 'Amazon Music', icon: '🎧', color: '#ff9900' },
				{ label: 'Pandora', icon: '📻', color: '#005483' },
				{ label: 'YouTube Music', icon: '🎤', color: '#ff0000' },
				{ label: 'Sonos Radio', icon: '📡', color: '#000000' },
				{ label: 'TuneIn', icon: '🌐', color: '#14d9c4' },
				{ label: 'Settings', icon: '⚙️', color: '#64748b' }
			],
			'smartphone': [
				{ label: 'Instagram', icon: '📷', color: '#e4405f' },
				{ label: 'WhatsApp', icon: '💬', color: '#25d366' },
				{ label: 'TikTok', icon: '🎵', color: '#000000' },
				{ label: 'Uber', icon: '🚗', color: '#000000' },
				{ label: 'Venmo', icon: '💸', color: '#3d95ce' },
				{ label: 'Apple Wallet', icon: '💳', color: '#007aff' },
				{ label: 'Face ID', icon: '🔐', color: '#f59e0b' },
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

