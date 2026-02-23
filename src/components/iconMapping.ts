/**
 * @file iconMapping.ts
 * @module components
 * @description Icon mapping from MDI to Bootstrap Icons for Bootstrap migration
 * @version 1.0.0
 * 
 * This provides mapping between MDI icon names and Bootstrap Icons
 * for the PingOne UI Bootstrap migration.
 */

/**
 * MDI to Bootstrap Icon mapping
 * Maps Material Design Icons to Bootstrap Icons equivalents
 */
export const MDIToBootstrapMapping: Record<string, string> = {
	// Navigation & Actions
	'home': 'house',
	'settings': 'gear',
	'cog': 'gear',
	'chevron-down': 'chevron-down',
	'chevron-up': 'chevron-up',
	'chevron-left': 'chevron-left',
	'chevron-right': 'chevron-right',
	'arrow-left': 'arrow-left',
	'arrow-right': 'arrow-right',
	'arrow-up': 'arrow-up',
	'arrow-down': 'arrow-down',
	
	// Authentication & Security
	'shield-outline': 'shield',
	'shield-check': 'shield-check',
	'account': 'person',
	'account-lock': 'person-lock',
	'key': 'key',
	'lock': 'lock',
	'eye': 'eye',
	'eye-off': 'eye-slash',
	'certificate': 'award',
	'devices': 'devices',
	
	// Content & Media
	'file-document': 'file-earmark-text',
	'file-text': 'file-earmark-text',
	'download': 'download',
	'upload': 'upload',
	'book': 'book',
	'package': 'box',
	'information': 'info-circle',
	'info': 'info-circle',
	'alert': 'exclamation-triangle',
	'warning': 'exclamation-triangle',
	'error': 'x-circle',
	'success': 'check-circle',
	'check-circle': 'check-circle',
	
	// System & Status
	'server': 'server',
	'database': 'database',
	'cpu': 'cpu',
	'activity': 'activity',
	'refresh': 'arrow-clockwise',
	'refresh-cw': 'arrow-clockwise',
	'close': 'x',
	'x-circle': 'x-circle',
	'menu': 'list',
	'more': 'three-dots',
	'ellipsis': 'three-dots',
	
	// Communication
	'mail': 'envelope',
	'phone': 'telephone',
	'message-text': 'chat',
	'notification': 'bell',
	
	// Social & Sharing
	'share': 'share',
	'link': 'link',
	'external-link': 'box-arrow-up-right',
	'open-in-new': 'box-arrow-up-right',
	'content-copy': 'clipboard',
	'clipboard-text': 'clipboard',
	
	// Media & Entertainment
	'play-circle': 'play-circle',
	'pause-circle': 'pause-circle',
	'stop-circle': 'stop-circle',
	'volume-high': 'volume-up',
	'volume-low': 'volume-down',
	'volume-off': 'volume-mute',
	
	// Editing & Tools
	'pencil': 'pencil',
	'pencil-outline': 'pencil',
	'trash-can': 'trash',
	'delete-outline': 'trash',
	'content-save': 'save',
	'save-outline': 'save',
	'content-cut': 'scissors',
	'content-paste': 'clipboard',
	
	// View & Layout
	'view-module': 'grid',
	'view-list': 'list',
	'view-column': 'columns',
	'arrow-expand': 'arrows-expand',
	'arrow-collapse': 'arrows-collapse',
	'fullscreen': 'fullscreen',
	'fullscreen-exit': 'fullscreen-exit',
	
	// Time & Date
	'clock-outline': 'clock',
	'calendar-today': 'calendar-today',
	'alarm': 'alarm',
	
	// Location & Geography
	'map-marker': 'map',
	'pin-drop': 'geo-alt',
	'location-on': 'geo-alt',
	'navigation': 'compass',
	
	// Shopping & Commerce
	'shopping-cart': 'cart',
	'credit-card-outline': 'credit-card',
	'tag-outline': 'tag',
	'tags-outline': 'tags',
	'barcode-scan': 'upc-scan',
	
	// Transportation
	'car-outline': 'car-front',
	'truck-outline': 'truck',
	'airplane': 'airplane',
	'train-outline': 'train-front',
	'ship-outline': 'boat',
	
	// Weather & Environment
	'weather-sunny': 'sun',
	'weather-cloudy': 'cloud',
	'weather-rainy': 'cloud-rain',
	'weather-snowy': 'snow',
	'weather-lightning': 'cloud-lightning',
	'weather-windy': 'wind',
	
	// Health & Medical
	'heart-outline': 'heart',
	'heart-pulse': 'heart-pulse',
	'hospital-building': 'hospital',
	'pill-outline': 'capsule',
	
	// Education & Learning
	'school-outline': 'mortarboard',
	'graduation-cap': 'mortarboard',
	'book-open-page-variant': 'book',
	'library-outline': 'book',
	
	// Finance & Business
	'currency-usd': 'currency-dollar',
	'dollar-outline': 'currency-dollar',
	'credit-card': 'credit-card',
	'bank-outline': 'bank',
	'trending-up': 'graph-up',
	'trending-down': 'graph-down',
	
	// Gaming & Entertainment
	'gamepad': 'controller',
	'joystick-outline': 'controller',
	'trophy-outline': 'trophy',
	'medal-outline': 'award',
	
	// Miscellaneous
	'star-outline': 'star',
	'heart': 'heart',
	'thumb-up-outline': 'hand-thumbs-up',
	'thumb-down-outline': 'hand-thumbs-down',
	'bookmark-outline': 'bookmark',
	'bookmark': 'bookmark',
	'filter-outline': 'funnel',
	'magnify': 'search',
	'magnify-plus': 'zoom-in',
	'magnify-minus': 'zoom-out',
	'qrcode': 'qr-code',
	'barcode': 'upc-scan',
};

/**
 * Get Bootstrap icon name from MDI icon name
 * @param mdiIconName - MDI icon name (with or without 'mdi-' prefix)
 * @returns Bootstrap icon name (without 'bi-' prefix)
 */
export const getBootstrapIconName = (mdiIconName: string): string => {
	// Remove 'mdi-' prefix if present
	const cleanName = mdiIconName.startsWith('mdi-') 
		? mdiIconName.substring(4) 
		: mdiIconName;
	
	// Return mapped Bootstrap icon or fallback
	return MDIToBootstrapMapping[cleanName] || 'question-circle';
};

/**
 * Common icon mappings for quick reference
 */
export const CommonIconMappings = {
	// Most frequently used icons in the app
	'home': 'house',
	'settings': 'gear',
	'user': 'person',
	'key': 'key',
	'shield': 'shield',
	'download': 'download',
	'upload': 'upload',
	'info': 'info-circle',
	'warning': 'exclamation-triangle',
	'error': 'x-circle',
	'success': 'check-circle',
	'edit': 'pencil',
	'delete': 'trash',
	'save': 'save',
	'copy': 'clipboard',
	'share': 'share',
	'link': 'link',
	'menu': 'list',
	'search': 'search',
	'filter': 'funnel',
	'close': 'x',
	'expand': 'arrows-expand',
	'collapse': 'arrows-collapse',
} as const;
