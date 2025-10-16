// src/services/samlIssuerService.tsx
// SAML Issuer Service for managing common SAML identity providers

import React from 'react';

export interface SAMLIssuer {
	id: string;
	name: string;
	issuerUrl: string;
	description: string;
	category: 'enterprise' | 'cloud' | 'government' | 'education' | 'custom';
	commonAudiences: string[];
	exampleSubject: string;
	documentationUrl?: string;
}

export class SAMLIssuerService {
	private static readonly COMMON_ISSUERS: SAMLIssuer[] = [
		{
			id: 'pingone',
			name: 'PingOne',
			issuerUrl: 'https://sso.connect.pingidentity.com/sso/idp/SSO.saml2',
			description: 'Ping Identity PingOne cloud identity platform',
			category: 'cloud',
			commonAudiences: [
				'https://sso.connect.pingidentity.com/sso/sp',
				'https://auth.pingone.com'
			],
			exampleSubject: 'user@company.com',
			documentationUrl: 'https://docs.pingidentity.com/bundle/pingone/page/kxd1564027202198.html'
		},
		{
			id: 'okta',
			name: 'Okta',
			issuerUrl: 'https://dev-123456.okta.com',
			description: 'Okta identity and access management platform',
			category: 'cloud',
			commonAudiences: [
				'https://dev-123456.okta.com',
				'urn:okta:dev-123456'
			],
			exampleSubject: 'user@company.com'
		},
		{
			id: 'azure-ad',
			name: 'Azure Active Directory',
			issuerUrl: 'https://sts.windows.net/tenant-id/',
			description: 'Microsoft Azure Active Directory',
			category: 'cloud',
			commonAudiences: [
				'https://sts.windows.net/tenant-id/',
				'https://graph.microsoft.com'
			],
			exampleSubject: 'user@company.onmicrosoft.com'
		},
		{
			id: 'aws-cognito',
			name: 'AWS Cognito',
			issuerUrl: 'https://cognito-idp.region.amazonaws.com/user-pool-id',
			description: 'Amazon Web Services Cognito identity provider',
			category: 'cloud',
			commonAudiences: [
				'https://cognito-idp.region.amazonaws.com/user-pool-id',
				'arn:aws:cognito-idp:region:account:userpool/user-pool-id'
			],
			exampleSubject: 'user@company.com'
		},
		{
			id: 'auth0',
			name: 'Auth0',
			issuerUrl: 'https://tenant.auth0.com/',
			description: 'Auth0 identity platform',
			category: 'cloud',
			commonAudiences: [
				'https://tenant.auth0.com/',
				'urn:auth0:tenant:api'
			],
			exampleSubject: 'auth0|user-id'
		},
		{
			id: 'adfs',
			name: 'Active Directory Federation Services (ADFS)',
			issuerUrl: 'https://adfs.company.com/adfs/services/trust',
			description: 'Microsoft Active Directory Federation Services',
			category: 'enterprise',
			commonAudiences: [
				'https://adfs.company.com/adfs/services/trust',
				'urn:company:adfs'
			],
			exampleSubject: 'user@company.com'
		},
		{
			id: 'shibboleth',
			name: 'Shibboleth IdP',
			issuerUrl: 'https://idp.university.edu/idp/shibboleth',
			description: 'Shibboleth identity provider (common in education)',
			category: 'education',
			commonAudiences: [
				'https://sp.university.edu/shibboleth',
				'urn:university:sp'
			],
			exampleSubject: 'user@university.edu'
		},
		{
			id: 'google-workspace',
			name: 'Google Workspace',
			issuerUrl: 'https://accounts.google.com/o/saml2?idpid=tenant-id',
			description: 'Google Workspace SAML SSO',
			category: 'cloud',
			commonAudiences: [
				'https://accounts.google.com/o/saml2?idpid=tenant-id',
				'urn:google:workspace'
			],
			exampleSubject: 'user@company.com'
		},
		{
			id: 'salesforce',
			name: 'Salesforce',
			issuerUrl: 'https://company.salesforce.com',
			description: 'Salesforce identity provider',
			category: 'cloud',
			commonAudiences: [
				'https://company.salesforce.com',
				'https://login.salesforce.com'
			],
			exampleSubject: 'user@company.com'
		},
		{
			id: 'custom',
			name: 'Custom Identity Provider',
			issuerUrl: '',
			description: 'Custom SAML identity provider',
			category: 'custom',
			commonAudiences: [],
			exampleSubject: 'user@company.com'
		}
	];

	/**
	 * Get all available SAML issuers
	 */
	static getAllIssuers(): SAMLIssuer[] {
		return [...SAMLIssuerService.COMMON_ISSUERS];
	}

	/**
	 * Get issuers by category
	 */
	static getIssuersByCategory(category: SAMLIssuer['category']): SAMLIssuer[] {
		return SAMLIssuerService.COMMON_ISSUERS.filter(issuer => issuer.category === category);
	}

	/**
	 * Find issuer by ID
	 */
	static getIssuerById(id: string): SAMLIssuer | undefined {
		return SAMLIssuerService.COMMON_ISSUERS.find(issuer => issuer.id === id);
	}

	/**
	 * Get categories
	 */
	static getCategories(): Array<{ value: SAMLIssuer['category']; label: string }> {
		return [
			{ value: 'cloud', label: 'Cloud Providers' },
			{ value: 'enterprise', label: 'Enterprise' },
			{ value: 'education', label: 'Education' },
			{ value: 'government', label: 'Government' },
			{ value: 'custom', label: 'Custom' }
		];
	}

	/**
	 * Validate issuer URL format
	 */
	static validateIssuerUrl(url: string): { isValid: boolean; error?: string } {
		if (!url.trim()) {
			return { isValid: false, error: 'Issuer URL is required' };
		}

		try {
			new URL(url);
			return { isValid: true };
		} catch {
			return { isValid: false, error: 'Invalid URL format' };
		}
	}

	/**
	 * Generate example configuration for an issuer
	 */
	static generateExampleConfig(issuerId: string): Partial<{
		issuer: string;
		audience: string;
		subject: string;
	}> {
		const issuer = SAMLIssuerService.getIssuerById(issuerId);
		if (!issuer) {
			return {};
		}

		return {
			issuer: issuer.issuerUrl,
			audience: issuer.commonAudiences[0] || issuer.issuerUrl,
			subject: issuer.exampleSubject
		};
	}

	/**
	 * Get issuer suggestions based on partial input
	 */
	static getIssuerSuggestions(input: string): SAMLIssuer[] {
		if (!input.trim()) {
			return SAMLIssuerService.COMMON_ISSUERS.slice(0, 5); // Return top 5 by default
		}

		const lowerInput = input.toLowerCase();
		return SAMLIssuerService.COMMON_ISSUERS.filter(issuer => 
			issuer.name.toLowerCase().includes(lowerInput) ||
			issuer.issuerUrl.toLowerCase().includes(lowerInput) ||
			issuer.description.toLowerCase().includes(lowerInput)
		).slice(0, 10);
	}
}

export default SAMLIssuerService;




