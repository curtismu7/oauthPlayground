/**
 * @file educationalContentService.ts
 * @module protect-portal/services
 * @description Educational content service for Protect Portal
 * @version 9.6.5
 * @since 2026-02-10
 *
 * This service provides educational content about risk evaluation,
 * MFA, and OIDC tokens to help users understand the security concepts.
 */

import type {
	EducationalContent,
	MFAExplanation,
	RiskEvaluationExplanation,
	TokenExplanation,
} from '../types/protectPortal.types';

const MODULE_TAG = '[📚 EDUCATIONAL-CONTENT-SERVICE]';

// ============================================================================
// EDUCATIONAL CONTENT SERVICE
// ============================================================================

export class EducationalContentService {
	/**
	 * Get educational content for risk evaluation
	 */
	static getRiskEvaluationContent(
		riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH'
	): RiskEvaluationExplanation {
		const baseContent = {
			title: 'Risk Evaluation',
			description: 'We evaluate your login attempt to determine the appropriate security measures.',
			keyPoints: [
				'Risk evaluation analyzes multiple factors including IP address, device information, and login patterns',
				'Higher risk scores trigger additional security measures like multi-factor authentication',
				'Low risk allows immediate access while protecting against potential threats',
			],
			learnMore: {
				title: 'Understanding Risk Evaluation',
				url: '#risk-evaluation',
				description: 'Learn how risk evaluation protects your account',
			},
		};

		switch (riskLevel) {
			case 'LOW':
				return {
					...baseContent,
					title: 'Low Risk - Access Granted',
					description:
						'Your login attempt shows minimal risk indicators. Access granted immediately.',
					keyPoints: [
						'✅ Your login patterns are consistent with normal behavior',
						'✅ Device and location are recognized',
						'✅ No suspicious activity detected',
						'✅ Security checks passed successfully',
					],
					learnMore: {
						...baseContent.learnMore,
						title: 'Why Low Risk?',
						description: 'Understand what makes a login low risk',
					},
				};

			case 'MEDIUM':
				return {
					...baseContent,
					title: 'Medium Risk - Additional Verification Required',
					description:
						'Your login attempt shows some risk indicators. Multi-factor authentication required.',
					keyPoints: [
						'⚠️ Unusual device or location detected',
						'⚠️ Login patterns differ from normal behavior',
						'⚠️ Additional verification needed for security',
						'⚠️ MFA helps protect your account from unauthorized access',
					],
					learnMore: {
						...baseContent.learnMore,
						title: 'Why Medium Risk?',
						description: 'Understand what triggers medium risk evaluation',
					},
				};

			case 'HIGH':
				return {
					...baseContent,
					title: 'High Risk - Access Blocked',
					description:
						'Your login attempt shows significant risk indicators. Access blocked for security.',
					keyPoints: [
						'❌ Multiple risk indicators detected',
						'❌ Suspicious login patterns identified',
						'❌ Unrecognized device or location',
						'❌ Access blocked to protect your account',
					],
					learnMore: {
						...baseContent.learnMore,
						title: 'Why High Risk?',
						description: 'Understand what causes high risk evaluation',
					},
				};

			default:
				return baseContent;
		}
	}

	/**
	 * Get educational content for MFA authentication
	 */
	static getMFAContent(deviceType?: 'OTP' | 'FIDO2' | 'SMS' | 'EMAIL'): MFAExplanation {
		const baseContent = {
			title: 'Multi-Factor Authentication',
			description:
				'MFA adds an extra layer of security to protect your account from unauthorized access.',
			keyPoints: [
				'MFA requires two or more verification methods to prove your identity',
				'Even if someone steals your password, they cannot access your account without the second factor',
				'MFA significantly reduces the risk of account takeover and data breaches',
			],
			learnMore: {
				title: 'Understanding MFA',
				url: '#mfa-authentication',
				description: 'Learn how multi-factor authentication protects you',
			},
		};

		switch (deviceType) {
			case 'OTP':
				return {
					...baseContent,
					title: 'One-Time Password (OTP)',
					description: 'A temporary code sent to your device for additional verification.',
					keyPoints: [
						'🔢 OTP codes are typically valid for a short time (5-10 minutes)',
						'🔢 Codes are sent via SMS, email, or authenticator app',
						'🔢 Each code can only be used once',
						'🔢 OTP provides strong protection against replay attacks',
					],
					learnMore: {
						...baseContent.learnMore,
						title: 'How OTP Works',
						description: 'Learn about one-time password authentication',
					},
				};

			case 'FIDO2':
				return {
					...baseContent,
					title: 'FIDO2/WebAuthn Authentication',
					description: 'Passwordless authentication using biometrics or security keys.',
					keyPoints: [
						'🔐 FIDO2 uses biometrics (fingerprint, face) or security keys',
						'🔐 No passwords to remember or steal',
						'🔐 Phishing-resistant authentication',
						'🔐 Most secure form of MFA available',
					],
					learnMore: {
						...baseContent.learnMore,
						title: 'How FIDO2 Works',
						description: 'Learn about passwordless authentication',
					},
				};

			case 'SMS':
				return {
					...baseContent,
					title: 'SMS Authentication',
					description: 'Verification codes sent via text message to your phone.',
					keyPoints: [
						'📱 Codes sent directly to your mobile device',
						'📱 Convenient and widely supported',
						'📱 Requires mobile network coverage',
						'📱 Less secure than authenticator apps but better than passwords alone',
					],
					learnMore: {
						...baseContent.learnMore,
						title: 'How SMS MFA Works',
						description: 'Learn about SMS-based multi-factor authentication',
					},
				};

			case 'EMAIL':
				return {
					...baseContent,
					title: 'Email Authentication',
					description: 'Verification codes sent to your email address.',
					keyPoints: [
						'📧 Codes sent directly to your email inbox',
						'📧 Easy to implement and widely available',
						'📧 Less secure than other MFA methods',
						'📧 Good for backup authentication method',
					],
					learnMore: {
						...baseContent.learnMore,
						title: 'How Email MFA Works',
						description: 'Learn about email-based multi-factor authentication',
					},
				};

			default:
				return baseContent;
		}
	}

	/**
	 * Get educational content for OIDC tokens
	 */
	static getTokenContent(
		tokenType?: 'ID_TOKEN' | 'ACCESS_TOKEN' | 'REFRESH_TOKEN'
	): TokenExplanation {
		const baseContent = {
			title: 'OpenID Connect Tokens',
			description:
				'Tokens are digital credentials that prove your identity and grant access to resources.',
			keyPoints: [
				'Tokens are issued by the identity provider after successful authentication',
				'Tokens contain information about you and your permissions',
				'Tokens are digitally signed to prevent tampering',
				'Tokens have limited lifetimes for enhanced security',
			],
			learnMore: {
				title: 'Understanding OIDC Tokens',
				url: '#oidc-tokens',
				description: 'Learn about OpenID Connect token types',
			},
		};

		switch (tokenType) {
			case 'ID_TOKEN':
				return {
					...baseContent,
					title: 'ID Token',
					description: 'Contains information about you (the user) and your authentication.',
					keyPoints: [
						'👤 Contains user information like name, email, and unique identifier',
						'👤 Digitally signed by the identity provider',
						'👤 Used to verify your identity to applications',
						'👤 Contains claims about your authentication and session',
					],
					learnMore: {
						...baseContent.learnMore,
						title: 'Understanding ID Tokens',
						description: 'Learn about OpenID Connect ID tokens',
					},
				};

			case 'ACCESS_TOKEN':
				return {
					...baseContent,
					title: 'Access Token',
					description: 'Grants permission to access protected resources on your behalf.',
					keyPoints: [
						'🔑 Allows applications to access APIs and resources',
						'🔑 Limited scope - only grants specific permissions',
						'🔑 Short-lived for security (typically 1 hour)',
						'🔑 Never share access tokens with others',
					],
					learnMore: {
						...baseContent.learnMore,
						title: 'Understanding Access Tokens',
						description: 'Learn about OAuth 2.0 access tokens',
					},
				};

			case 'REFRESH_TOKEN':
				return {
					...baseContent,
					title: 'Refresh Token',
					description: 'Allows obtaining new access tokens without re-authenticating.',
					keyPoints: [
						'🔄 Long-lived token for obtaining new access tokens',
						'🔄 Reduces need for repeated login prompts',
						'🔄 Must be stored securely and protected',
						'🔄 Can be revoked if compromised',
					],
					learnMore: {
						...baseContent.learnMore,
						title: 'Understanding Refresh Tokens',
						description: 'Learn about OAuth 2.0 refresh tokens',
					},
				};

			default:
				return baseContent;
		}
	}

	/**
	 * Get general security tips
	 */
	static getSecurityTips(): EducationalContent {
		return {
			title: 'Security Best Practices',
			description: 'Tips to keep your account secure and protect your personal information.',
			keyPoints: [
				'🛡️ Use strong, unique passwords for each account',
				'🛡️ Enable multi-factor authentication whenever available',
				'🛡️ Be cautious of phishing emails and suspicious links',
				'🛡️ Keep your software and devices updated',
				'🛡️ Review your account activity regularly',
				'🛡️ Use secure networks for sensitive transactions',
			],
			learnMore: {
				title: 'Security Best Practices',
				url: '#security-tips',
				description: 'Learn more about online security',
			},
		};
	}

	/**
	 * Get content for a specific step in the Protect Portal flow
	 */
	static getStepContent(
		step: string
	): EducationalContent | RiskEvaluationExplanation | MFAExplanation | TokenExplanation | null {
		switch (step) {
			case 'portal-home':
				return {
					title: 'Protect Portal',
					description:
						'Welcome to the Protect Portal - your secure gateway to protected resources.',
					keyPoints: [
						'🔐 This portal uses advanced risk evaluation to protect your account',
						'🔐 Multi-factor authentication adds an extra layer of security',
						'🔐 All authentication happens through secure, encrypted channels',
						'🔐 Your privacy and security are our top priorities',
					],
					learnMore: {
						title: 'About Protect Portal',
						url: '#about-portal',
						description: 'Learn more about the Protect Portal security features',
					},
				};

			case 'custom-login':
				return {
					title: 'Secure Login Process',
					description: 'Enter your credentials to begin the secure authentication process.',
					keyPoints: [
						'🔐 Your credentials are encrypted and sent securely',
						'🔐 We use risk evaluation to detect suspicious activity',
						'🔐 Embedded login provides a seamless experience',
						'🔐 Your login data is never stored in plain text',
					],
					learnMore: {
						title: 'Secure Login',
						url: '#secure-login',
						description: 'Learn about our secure authentication process',
					},
				};

			case 'risk-evaluation':
				return EducationalContentService.getRiskEvaluationContent();

			case 'mfa-authentication':
				return EducationalContentService.getMFAContent();

			case 'portal-success':
				return EducationalContentService.getTokenContent();

			default:
				return null;
		}
	}

	/**
	 * Format educational content for display
	 */
	static formatContent(content: EducationalContent): string {
		const sections = [
			`## ${content.title}`,
			'',
			content.description,
			'',
			'### Key Points:',
			...content.keyPoints.map((point) => `- ${point}`),
			'',
			`📚 [Learn More](${content.learnMore.url}): ${content.learnMore.description}`,
		];

		return sections.join('\n');
	}
}
