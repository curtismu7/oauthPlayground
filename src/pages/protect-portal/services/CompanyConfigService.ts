/**
 * @file CompanyConfigService.ts
 * @module protect-portal/services
 * @description Service for managing company configurations with validation and persistence
 * @version 9.3.6
 * @since 2026-02-15
 */

import type { CompanyConfig, CompanyConfigDraft, CompanyConfigValidation, Industry } from '../types/CompanyConfig';
import { COMPANY_CONFIG_STORAGE_KEY, COMPANY_REGISTRY_KEY, INDUSTRIES } from '../types/CompanyConfig';

export class CompanyConfigService {
	private static instance: CompanyConfigService;

	private constructor() {}

	public static getInstance(): CompanyConfigService {
		if (!CompanyConfigService.instance) {
			CompanyConfigService.instance = new CompanyConfigService();
		}
		return CompanyConfigService.instance;
	}

	/**
	 * Validate company configuration
	 */
	public validateConfig(config: CompanyConfigDraft): CompanyConfigValidation {
		const errors: CompanyConfigValidation['errors'] = {};

		// Name validation
		if (!config.name || config.name.trim().length === 0) {
			errors.name = 'Company name is required';
		} else if (config.name.trim().length > 100) {
			errors.name = 'Company name must be less than 100 characters';
		}

		// Industry validation
		if (!config.industry || !INDUSTRIES.includes(config.industry as Industry)) {
			errors.industry = 'Valid industry is required';
		}

		// Colors validation
		if (!config.colors) {
			errors.colors = {
				button: 'Button color is required',
				headers: 'Header color is required',
				text: 'Text color is required',
				background: 'Background color is required',
			};
		} else {
			const colorErrors = errors.colors || {};
			
			if (!this.isValidColor(config.colors.button)) {
				colorErrors.button = 'Invalid button color format';
			}
			if (!this.isValidColor(config.colors.headers)) {
				colorErrors.headers = 'Invalid header color format';
			}
			if (!this.isValidColor(config.colors.text)) {
				colorErrors.text = 'Invalid text color format';
			}
			if (!this.isValidColor(config.colors.background)) {
				colorErrors.background = 'Invalid background color format';
			}
			
			if (Object.keys(colorErrors).length > 0) {
				errors.colors = colorErrors;
			}
		}

		// Logo validation
		if (!config.assets.logoUrl || config.assets.logoUrl.trim().length === 0) {
			errors.logoUrl = 'Logo is required';
		} else if (!this.isValidImageUrl(config.assets.logoUrl)) {
			errors.logoUrl = 'Logo must be a valid image URL';
		}

		// Footer validation (optional)
		if (config.assets.footerUrl && !this.isValidImageUrl(config.assets.footerUrl)) {
			errors.footerUrl = 'Footer must be a valid image URL';
		}

		const isValid = Object.keys(errors).length === 0;

		return {
			isValid,
			errors,
		};
	}

	/**
	 * Save company draft to local storage
	 */
	public async saveDraft(config: CompanyConfigDraft): Promise<void> {
		try {
			this.logEvent('company_config_save_attempt', { 
				companyName: config.name,
				industry: config.industry,
			});

			const validation = this.validateConfig(config);
			if (!validation.isValid) {
				const errorMessage = `Validation failed: ${JSON.stringify(validation.errors)}`;
				this.logEvent('company_config_save_failure', { 
					companyName: config.name,
					errors: validation.errors,
				});
				throw new Error(errorMessage);
			}

			const draftKey = `${COMPANY_CONFIG_STORAGE_KEY}:${this.generateSlug(config.name)}`;
			const draftData = {
				...config,
				updatedAt: new Date().toISOString(),
			};

			localStorage.setItem(draftKey, JSON.stringify(draftData));

			this.logEvent('company_config_save_success', { 
				companyName: config.name,
				draftKey,
			});
		} catch (error) {
			this.logEvent('company_config_save_failure', { 
				companyName: config.name,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Create new company in registry
	 */
	public async createCompany(config: CompanyConfigDraft): Promise<CompanyConfig> {
		try {
			this.logEvent('company_create_attempt', { 
				companyName: config.name,
				industry: config.industry,
			});

			const validation = this.validateConfig(config);
			if (!validation.isValid) {
				const errorMessage = `Validation failed: ${JSON.stringify(validation.errors)}`;
				this.logEvent('company_create_failure', { 
					companyName: config.name,
					errors: validation.errors,
				});
				throw new Error(errorMessage);
			}

			// Check for name collision
			const registry = this.getRegistry();
			const existingCompany = registry.find(c => 
				c.name.toLowerCase() === config.name.toLowerCase().trim()
			);

			if (existingCompany) {
				const errorMessage = 'Company with this name already exists';
				this.logEvent('company_create_failure', { 
					companyName: config.name,
					reason: 'name_collision',
				});
				throw new Error(errorMessage);
			}

			const now = new Date().toISOString();
			const id = this.generateId();
			const slug = this.generateSlug(config.name);

			const newCompany: CompanyConfig = {
				...config,
				id,
				createdAt: now,
				updatedAt: now,
			};

			// Add to registry
			registry.push(newCompany);
			localStorage.setItem(COMPANY_REGISTRY_KEY, JSON.stringify(registry));

			// Remove draft if it exists
			const draftKey = `${COMPANY_CONFIG_STORAGE_KEY}:${slug}`;
			localStorage.removeItem(draftKey);

			this.logEvent('company_create_success', { 
				companyId: id,
				companyName: config.name,
				slug,
			});

			return newCompany;
		} catch (error) {
			this.logEvent('company_create_failure', { 
				companyName: config.name,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Get all companies from registry
	 */
	public getRegistry(): CompanyConfig[] {
		try {
			const registryData = localStorage.getItem(COMPANY_REGISTRY_KEY);
			return registryData ? JSON.parse(registryData) : [];
		} catch (error) {
			this.logEvent('company_registry_load_failure', { 
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			return [];
		}
	}

	/**
	 * Get company by ID
	 */
	public getCompany(id: string): CompanyConfig | null {
		const registry = this.getRegistry();
		return registry.find(company => company.id === id) || null;
	}

	/**
	 * Get draft by name
	 */
	public getDraft(name: string): CompanyConfigDraft | null {
		try {
			const draftKey = `${COMPANY_CONFIG_STORAGE_KEY}:${this.generateSlug(name)}`;
			const draftData = localStorage.getItem(draftKey);
			return draftData ? JSON.parse(draftData) : null;
		} catch (error) {
			this.logEvent('company_draft_load_failure', { 
				companyName: name,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			return null;
		}
	}

	/**
	 * Generate unique ID for company
	 */
	private generateId(): string {
		return `company_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * Generate URL-friendly slug from name
	 */
	private generateSlug(name: string): string {
		return name
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}

	/**
	 * Validate color format (hex or rgb)
	 */
	private isValidColor(color: string): boolean {
		// Hex format: #RRGGBB or #RGB
		const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
		// RGB format: rgb(r, g, b)
		const rgbRegex = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/;
		
		return hexRegex.test(color) || rgbRegex.test(color);
	}

	/**
	 * Validate image URL
	 */
	private isValidImageUrl(url: string): boolean {
		try {
			// Handle blob URLs from file uploads
			if (url.startsWith('blob:')) {
				return true; // Blob URLs are always valid images from file inputs
			}
			
			// Handle regular URLs with file extensions
			const urlObj = new URL(url);
			return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(urlObj.pathname);
		} catch {
			return false;
		}
	}

	/**
	 * Log events to persistent storage
	 */
	private logEvent(event: string, data: Record<string, unknown>): void {
		const logEntry = {
			timestamp: new Date().toISOString(),
			event,
			data,
		};

		// Get existing logs or initialize
		const logsKey = 'companyEditorLogs';
		const existingLogs = localStorage.getItem(logsKey);
		const logs = existingLogs ? JSON.parse(existingLogs) : [];

		// Add new log entry
		logs.push(logEntry);

		// Keep only last 1000 log entries
		if (logs.length > 1000) {
			logs.splice(0, logs.length - 1000);
		}

		// Save back to storage
		localStorage.setItem(logsKey, JSON.stringify(logs));
	}
}
