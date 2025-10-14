// src/services/samlAssertionService.tsx
// SAML Assertion Service for OAuth 2.0 SAML Bearer Assertion Flow

import React from 'react';
import { v4ToastManager } from '../utils/v4ToastMessages';

export interface SAMLAssertionData {
	issuer: string;
	subject: string;
	audience: string;
	conditions: {
		notBefore: string;
		notOnOrAfter: string;
	};
	attributes: Record<string, string>;
}

export interface SAMLAssertionConfig {
	clientId: string;
	tokenEndpoint: string;
	identityProvider: string;
	scopes: string;
	samlAssertion: SAMLAssertionData;
}

export class SAMLAssertionService {
	private static readonly STORAGE_KEY = 'saml-bearer-assertion-v6-config';

	/**
	 * Generate a mock SAML assertion for educational purposes
	 */
	static generateSAMLAssertion(config: SAMLAssertionConfig): string {
		const { samlAssertion } = config;
		const assertionId = `_${Math.random().toString(36).substr(2, 9)}`;
		const issueInstant = new Date().toISOString();

		return `<?xml version="1.0" encoding="UTF-8"?>
<saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                xmlns:xs="http://www.w3.org/2001/XMLSchema"
                ID="${assertionId}"
                IssueInstant="${issueInstant}"
                Version="2.0">
  <saml:Issuer>${samlAssertion.issuer}</saml:Issuer>
  <saml:Subject>
    <saml:NameID Format="urn:oasis:names:tc:SAML:2.0:nameid-format:entity">${samlAssertion.subject}</saml:NameID>
    <saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
      <saml:SubjectConfirmationData NotOnOrAfter="${samlAssertion.conditions.notOnOrAfter}"/>
    </saml:SubjectConfirmation>
  </saml:Subject>
  <saml:Conditions NotBefore="${samlAssertion.conditions.notBefore}" NotOnOrAfter="${samlAssertion.conditions.notOnOrAfter}">
    <saml:AudienceRestriction>
      <saml:Audience>${samlAssertion.audience}</saml:Audience>
    </saml:AudienceRestriction>
  </saml:Conditions>
  <saml:AttributeStatement>
    <saml:Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name">
      <saml:AttributeValue>${samlAssertion.subject}</saml:AttributeValue>
    </saml:Attribute>
    ${Object.entries(samlAssertion.attributes).map(([name, value]) => `
    <saml:Attribute Name="${name}">
      <saml:AttributeValue>${value}</saml:AttributeValue>
    </saml:Attribute>`).join('')}
  </saml:AttributeStatement>
</saml:Assertion>`;
	}

	/**
	 * Validate SAML configuration
	 */
	static validateConfiguration(config: Partial<SAMLAssertionConfig>): { isValid: boolean; errors: string[] } {
		const errors: string[] = [];

		if (!config.clientId?.trim()) {
			errors.push('Client ID is required');
		}

		if (!config.tokenEndpoint?.trim()) {
			errors.push('Token Endpoint is required');
		}

		if (!config.samlAssertion?.issuer?.trim()) {
			errors.push('SAML Issuer is required');
		}

		if (!config.samlAssertion?.subject?.trim()) {
			errors.push('SAML Subject is required');
		}

		if (!config.samlAssertion?.audience?.trim()) {
			errors.push('SAML Audience is required');
		}

		return {
			isValid: errors.length === 0,
			errors
		};
	}

	/**
	 * Save SAML configuration to localStorage
	 */
	static saveConfiguration(config: SAMLAssertionConfig): Promise<void> {
		return new Promise((resolve, reject) => {
			try {
				const configWithTimestamp = {
					...config,
					timestamp: new Date().toISOString()
				};
				localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configWithTimestamp));
				v4ToastManager.showSuccess('SAML configuration saved successfully!');
				resolve();
			} catch (error) {
				console.error('[SAML Assertion Service] Error saving configuration:', error);
				v4ToastManager.showError('Failed to save SAML configuration');
				reject(error);
			}
		});
	}

	/**
	 * Load SAML configuration from localStorage
	 */
	static loadConfiguration(): SAMLAssertionConfig | null {
		try {
			const saved = localStorage.getItem(this.STORAGE_KEY);
			if (saved) {
				const config = JSON.parse(saved);
				// Return config without timestamp
				const { timestamp, ...configWithoutTimestamp } = config;
				return configWithoutTimestamp;
			}
		} catch (error) {
			console.error('[SAML Assertion Service] Error loading configuration:', error);
		}
		return null;
	}

	/**
	 * Clear saved SAML configuration
	 */
	static clearConfiguration(): void {
		try {
			localStorage.removeItem(this.STORAGE_KEY);
			v4ToastManager.showInfo('SAML configuration cleared');
		} catch (error) {
			console.error('[SAML Assertion Service] Error clearing configuration:', error);
			v4ToastManager.showError('Failed to clear SAML configuration');
		}
	}

	/**
	 * Get default SAML assertion template
	 */
	static getDefaultSAMLAssertion(): SAMLAssertionData {
		const now = new Date();
		const notBefore = new Date(now.getTime() - 60000); // 1 minute ago
		const notOnOrAfter = new Date(now.getTime() + 3600000); // 1 hour from now

		return {
			issuer: 'https://idp.example.com',
			subject: 'demo.user@example.com',
			audience: 'https://auth.example.com/oauth/token',
			conditions: {
				notBefore: notBefore.toISOString(),
				notOnOrAfter: notOnOrAfter.toISOString()
			},
			attributes: {}
		};
	}

	/**
	 * Create token request form data
	 */
	static createTokenRequestFormData(samlAssertion: string, clientId: string, scopes?: string): URLSearchParams {
		const formData = new URLSearchParams();
		formData.append('grant_type', 'urn:ietf:params:oauth:grant-type:saml2-bearer');
		formData.append('assertion', btoa(samlAssertion));
		formData.append('client_id', clientId);
		
		if (scopes?.trim()) {
			formData.append('scope', scopes.trim());
		}

		return formData;
	}

	/**
	 * Format SAML assertion for display
	 */
	static formatSAMLForDisplay(samlAssertion: string): { xml: string; base64: string } {
		return {
			xml: samlAssertion,
			base64: btoa(samlAssertion)
		};
	}
}

export default SAMLAssertionService;




