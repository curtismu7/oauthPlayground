/**
 * @file CompanyConfig.ts
 * @module protect-portal/types
 * @description Company configuration types for the Company Editor utility
 * @version 9.3.6
 * @since 2026-02-15
 */

export interface CompanyColors {
	button: string;
	headers: string;
	text: string;
	background: string;
}

export interface CompanyAssets {
	logoUrl: string;
	footerUrl?: string;
}

export interface CompanyConfig {
	id: string;
	name: string;
	industry: string;
	colors: CompanyColors;
	assets: CompanyAssets;
	createdAt: string;
	updatedAt: string;
}

export interface CompanyConfigDraft extends Omit<CompanyConfig, 'id' | 'createdAt' | 'updatedAt'> {
	// Draft can be saved without ID and timestamps
	// Add a marker to distinguish from full CompanyConfig
	_isDraft?: true;
}

export interface CompanyConfigValidation {
	isValid: boolean;
	errors: {
		name?: string;
		industry?: string;
		colors?: {
			button?: string;
			headers?: string;
			text?: string;
			background?: string;
		};
		logoUrl?: string;
		footerUrl?: string;
	};
}

export interface CompanyEditorState {
	config: CompanyConfigDraft;
	validation: CompanyConfigValidation;
	isSaving: boolean;
	isCreating: boolean;
	saveStatus: 'idle' | 'success' | 'error';
	createStatus: 'idle' | 'success' | 'error';
	lastError?: string;
}

export const INDUSTRIES = [
	'aviation',
	'banking',
	'tech',
	'healthcare',
	'retail',
	'manufacturing',
	'consulting',
	'education',
	'government',
	'other',
] as const;

export type Industry = typeof INDUSTRIES[number];

export const DEFAULT_COMPANY_COLORS: CompanyColors = {
	button: '#3b82f6',
	headers: '#1f2937',
	text: '#374151',
	background: '#ffffff',
};

export const COMPANY_CONFIG_STORAGE_KEY = 'companyDraft';

export const COMPANY_REGISTRY_KEY = 'companyRegistry';
