/**
 * @file globalEnvironmentService.ts
 * @module v8/services
 * @description Global Environment ID Service - Single source of truth for Environment ID
 * @version 9.2.0
 */

import { environmentIdPersistenceService } from '@/services/environmentIdPersistenceService';

type EnvironmentIdListener = (id: string | null) => void;

/**
 * Global Environment Service
 * 
 * Manages Environment ID as a global singleton with:
 * - Single source of truth across the app
 * - Automatic persistence to localStorage
 * - Cross-tab synchronization via storage events
 * - Observable pattern for reactive updates
 */
export class GlobalEnvironmentService {
	private static instance: GlobalEnvironmentService;
	private environmentId: string | null = null;
	private listeners: Set<EnvironmentIdListener> = new Set();

	private constructor() {
		this.setupStorageListener();
	}

	/**
	 * Get singleton instance
	 */
	static getInstance(): GlobalEnvironmentService {
		if (!GlobalEnvironmentService.instance) {
			GlobalEnvironmentService.instance = new GlobalEnvironmentService();
		}
		return GlobalEnvironmentService.instance;
	}

	/**
	 * Initialize the service (load from persistence)
	 */
	initialize(): void {
		console.log('[GlobalEnvironmentService] Initializing...');
		this.environmentId = environmentIdPersistenceService.loadEnvironmentId();
		console.log('[GlobalEnvironmentService] Loaded Environment ID:', this.environmentId);
		this.notifyListeners();
	}

	/**
	 * Set Environment ID and persist it
	 */
	setEnvironmentId(id: string): void {
		if (!id || !id.trim()) {
			console.warn('[GlobalEnvironmentService] Cannot set empty environment ID');
			return;
		}

		const trimmedId = id.trim();
		console.log('[GlobalEnvironmentService] Setting Environment ID:', trimmedId);
		
		this.environmentId = trimmedId;
		environmentIdPersistenceService.saveEnvironmentId(trimmedId, 'manual');
		this.notifyListeners();
	}

	/**
	 * Get current Environment ID
	 */
	getEnvironmentId(): string | null {
		return this.environmentId;
	}

	/**
	 * Check if Environment ID is configured
	 */
	isConfigured(): boolean {
		return !!this.environmentId;
	}

	/**
	 * Clear Environment ID
	 */
	clearEnvironmentId(): void {
		console.log('[GlobalEnvironmentService] Clearing Environment ID');
		this.environmentId = null;
		environmentIdPersistenceService.clearEnvironmentId();
		this.notifyListeners();
	}

	/**
	 * Subscribe to Environment ID changes
	 * @returns Unsubscribe function
	 */
	subscribe(listener: EnvironmentIdListener): () => void {
		this.listeners.add(listener);
		// Immediately call with current value
		listener(this.environmentId);
		return () => this.listeners.delete(listener);
	}

	/**
	 * Notify all listeners of Environment ID change
	 */
	private notifyListeners(): void {
		console.log('[GlobalEnvironmentService] Notifying listeners:', this.listeners.size);
		this.listeners.forEach(listener => listener(this.environmentId));
	}

	/**
	 * Setup cross-tab synchronization via storage events
	 */
	private setupStorageListener(): void {
		if (typeof window === 'undefined') return;

		window.addEventListener('storage', (event) => {
			if (event.key === 'pingone_environment_id_persistence') {
				console.log('[GlobalEnvironmentService] Storage event detected, reloading...');
				this.environmentId = environmentIdPersistenceService.loadEnvironmentId();
				this.notifyListeners();
			}
		});
	}
}

// Export singleton instance
export const globalEnvironmentService = GlobalEnvironmentService.getInstance();

// Expose to window for debugging
if (typeof window !== 'undefined') {
	(window as unknown as Window & { globalEnvironmentService: GlobalEnvironmentService }).globalEnvironmentService = globalEnvironmentService;
}
