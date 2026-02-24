/**
 * @file iconMapping.ts
 * @module components
 * @description Icon mapping from MDI to Bootstrap Icons for Bootstrap migration
 * @version 1.0.0
 * 
 * This provides mapping between MDI icon names and Bootstrap Icons
 * for the PingOne UI Bootstrap migration, with PingOne-specific icon preferences.
 */

/**
 * PingOne UI Bootstrap Icon mapping
 * Maps Material Design Icons to Bootstrap Icons equivalents
 * with PingOne design system preferences
 */
export const MDIToBootstrapMapping: Record<string, string> = {
	// Navigation & Actions - PingOne UI preferred
	'home': 'house-door-fill',
	'settings': 'gear-fill',
	'cog': 'gear-fill',
	'chevron-down': 'chevron-down',
	'chevron-up': 'chevron-up',
	'chevron-left': 'chevron-left',
	'chevron-right': 'chevron-right',
	'arrow-left': 'arrow-left',
	'arrow-right': 'arrow-right',
	'arrow-up': 'arrow-up',
	'arrow-down': 'arrow-down',
	'arrow-clockwise': 'arrow-clockwise',
	'refresh-cw': 'arrow-clockwise',
	'refresh': 'arrow-clockwise',
	
	// Authentication & Security - PingOne branding
	'shield-outline': 'shield',
	'shield-check': 'shield-check',
	'shield-fill': 'shield-fill',
	'account': 'person-fill',
	'account-lock': 'person-lock',
	'key': 'key-fill',
	'lock': 'lock-fill',
	'eye': 'eye',
	'eye-off': 'eye-slash',
	'certificate': 'award-fill',
	'devices': 'phone-laptop',
	'fingerprint': 'fingerprint',
	'security': 'shield-lock',
	
	// PingOne Specific Icons
	'pingone': 'building',
	'ping': 'broadcast',
	'one': '1-circle-fill',
	'worker': 'person-workspace',
	'token': 'key',
	'api': 'diagram-3',
	'oauth': 'shield-lock',
	'oidc': 'person-badge',
	'mfa': 'shield-exclamation',
	'sso': 'arrow-left-right',
	
	// Content & Media
	'file-document': 'file-earmark-text-fill',
	'file-text': 'file-earmark-text-fill',
	'download': 'download',
	'upload': 'upload',
	'book': 'book-fill',
	'package': 'box-seam',
	'information': 'info-circle-fill',
	'info': 'info-circle-fill',
	'alert': 'exclamation-triangle-fill',
	'warning': 'exclamation-triangle-fill',
	'error': 'x-circle-fill',
	'success': 'check-circle-fill',
	'check-circle': 'check-circle-fill',
	'check': 'check-lg',
	
	// System & Status - PingOne status colors
	'server': 'server',
	'database': 'database',
	'cpu': 'cpu',
	'activity': 'activity',
	'close': 'x-lg',
	'x-circle': 'x-circle-fill',
	'menu': 'list',
	'more': 'three-dots',
	'ellipsis': 'three-dots',
	'status': 'circle-fill',
	'online': 'circle-fill',
	'offline': 'circle',
	'pending': 'half-circle',
	
	// Communication
	'mail': 'envelope-fill',
	'phone': 'telephone-fill',
	'message-text': 'chat-dots',
	'notification': 'bell-fill',
	'bell': 'bell-fill',
	
	// Social & Sharing
	'share': 'share',
	'link': 'link',
	'external-link': 'box-arrow-up-right',
	'open-in-new': 'box-arrow-up-right',
	'content-copy': 'clipboard',
	'clipboard-text': 'clipboard',
	'copy': 'clipboard',
	
	// Media & Entertainment
	'play-circle': 'play-circle-fill',
	'pause-circle': 'pause-circle-fill',
	'stop-circle': 'stop-circle-fill',
	'volume-high': 'volume-up-fill',
	'volume-low': 'volume-down',
	'volume-off': 'volume-mute-fill',
	
	// Editing & Tools
	'pencil': 'pencil-fill',
	'pencil-outline': 'pencil',
	'trash-can': 'trash-fill',
	'delete-outline': 'trash',
	'content-save': 'save',
	'save-outline': 'save',
	'content-cut': 'scissors',
	'content-paste': 'clipboard',
	
	// Flow & Process - PingOne flow icons
	'flow': 'diagram-3',
	'process': 'gear-wide-connected',
	'pipeline': 'diagram-3',
	'workflow': 'diagram-3',
	'step': '1-square',
	'steps': 'list-ol',
	'progress': 'arrow-repeat',
	'loading': 'arrow-repeat',
	'spinner': 'arrow-repeat',
	
	// Enterprise & Business
	'business': 'building',
	'enterprise': 'building',
	'organization': 'building',
	'company': 'building',
	'corporate': 'building',
	'portal': 'door-open',
	'dashboard': 'speedometer2',
	'analytics': 'graph-up',
	'reports': 'file-bar-graph',
	'metrics': 'speedometer2',
	
	// Developer & Technical
	'code': 'code-slash',
	'developer': 'code-slash',
	'terminal': 'terminal',
	'console': 'terminal',
	'debug': 'bug',
	'test': 'check2-square',
	'deploy': 'cloud-upload',
	'build': 'gear-wide-connected',
	'integration': 'link',
	
	// User & Access Management
	'user': 'person-fill',
	'users': 'people-fill',
	'group': 'people-fill',
	'team': 'people-fill',
	'role': 'person-badge',
	'permission': 'key',
	'access': 'key',
	'login': 'box-arrow-in-right',
	'logout': 'box-arrow-right',
	'signup': 'person-plus',
	'register': 'person-plus',
	
	// Data & Storage
	'data': 'database',
	'storage': 'database',
	'backup': 'shield-check',
	'archive': 'archive',
	'export': 'download',
	'import': 'upload',
	'sync': 'arrow-repeat',
	'cloud': 'cloud',
	'cloud-download': 'cloud-download',
	'cloud-upload': 'cloud-upload',
	
	// Search & Filter
	'search': 'search',
	'filter': 'funnel',
	'sort': 'sort-down',
	'find': 'search',
	'locate': 'geo-alt',
	'browse': 'folder',
	'explore': 'compass',
	
	// Time & Calendar
	'time': 'clock',
	'clock': 'clock',
	'calendar': 'calendar',
	'date': 'calendar',
	'schedule': 'calendar-check',
	'recent': 'clock-history',
	'history': 'clock-history',
	'future': 'calendar-week',
	
	// Location & Geography
	'location': 'geo-alt',
	'map': 'map',
	'globe': 'globe',
	'world': 'globe',
	'region': 'geo',
	'area': 'square',
	
	// Configuration & Settings
	'config': 'gear-fill',
	'preferences': 'sliders',
	'options': 'three-dots',
	'tools': 'gear-wide-connected',
	'customize': 'palette',
	'theme': 'palette',
	'layout': 'grid',
	
	// Help & Support
	'help': 'question-circle',
	'support': 'headset',
	'faq': 'question-circle',
	'documentation': 'book',
	'guide': 'signpost',
	'tutorial': 'play-circle',
	'learn': 'mortarboard',
	
	// Status Indicators - PingOne status colors
	'valid': 'check-circle-fill',
	'invalid': 'x-circle-fill',
	'active': 'circle-fill',
	'inactive': 'circle',
	'enabled': 'toggle-on',
	'disabled': 'toggle-off',
	'connected': 'wifi',
	'disconnected': 'wifi-off',
	'synced': 'check-circle',
	'unsynced': 'x-circle',
	'updated': 'arrow-clockwise',
	'outdated': 'exclamation-triangle',
	'current': 'circle-fill',
	'expired': 'x-circle',
	'required': 'asterisk',
	'optional': 'circle',
};

/**
 * Get Bootstrap icon name from MDI icon name
 * @param mdiIconName - MDI icon name (with or without 'mdi-' prefix) or Fi icon name (with 'Fi' prefix)
 * @returns Bootstrap icon name (without 'bi-' prefix)
 */
export const getBootstrapIconName = (mdiIconName: string): string => {
	// Remove 'mdi-' prefix if present
	let cleanName = mdiIconName.startsWith('mdi-') 
		? mdiIconName.substring(4) 
		: mdiIconName;
	
	// Remove 'Fi' prefix and convert to lowercase if present (for react-icons compatibility)
	if (cleanName.startsWith('Fi')) {
		cleanName = cleanName.substring(2).toLowerCase();
	}
	
	// Return mapped Bootstrap icon or fallback
	return MDIToBootstrapMapping[cleanName] || 'question-circle';
};

/**
 * PingOne UI Common icon mappings for quick reference
 */
export const CommonIconMappings = {
	// Most frequently used icons in the app - PingOne UI preferred
	'home': 'house-door-fill',
	'settings': 'gear-fill',
	'user': 'person-fill',
	'key': 'key-fill',
	'shield': 'shield-check',
	'security': 'shield-lock',
	'download': 'download',
	'upload': 'upload',
	'info': 'info-circle-fill',
	'warning': 'exclamation-triangle-fill',
	'error': 'x-circle-fill',
	'success': 'check-circle-fill',
	'edit': 'pencil-fill',
	'delete': 'trash-fill',
	'save': 'save',
	'copy': 'clipboard',
	'share': 'share',
	'link': 'link',
	'menu': 'list',
	'search': 'search',
	'filter': 'funnel',
	'close': 'x-lg',
	'expand': 'arrows-expand',
	'collapse': 'arrows-collapse',
	
	// PingOne specific icons
	'pingone': 'building',
	'oauth': 'shield-lock',
	'oidc': 'person-badge',
	'mfa': 'shield-exclamation',
	'worker': 'person-workspace',
	'token': 'key-fill',
	'api': 'diagram-3',
	'flow': 'diagram-3',
	'enterprise': 'building',
	'portal': 'door-open',
	'dashboard': 'speedometer2',
} as const;
