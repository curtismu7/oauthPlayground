// src/services/samlService.ts
/**
 * SAML 2.0 Service Provider Service
 *
 * Implements SAML SP functionality including:
 * - AuthnRequest processing and validation
 * - Dynamic ACS URL acceptance from signed AuthnRequests (new PingOne feature)
 * - SAML Response generation
 * - SAML metadata handling
 */

export interface SAMLAuthnRequest {
	issuer: string;
	nameIdPolicy?: {
		format?: string;
		allowCreate?: boolean;
	};
	requestedAuthnContext?: {
		comparison?: string;
		authnContextClassRefs?: string[];
	};
	assertionConsumerServiceURL?: string;
	assertionConsumerServiceIndex?: number;
	attributeConsumingServiceIndex?: number;
	forceAuthn?: boolean;
	isPassive?: boolean;
	protocolBinding?: string;
	scoping?: any;
	extensions?: any;
	id?: string;
	version?: string;
	issueInstant?: string;
	destination?: string;
	consent?: string;
}

export interface SAMLApplicationConfig {
	entityId: string;
	acsUrls: string[];
	ssoUrl: string;
	enableAlwaysAcceptAcsUrlInSignedAuthnRequest: boolean;
	signingCertificate?: string;
	encryptionCertificate?: string;
	nameIdFormat: string;
	pingOneApplicationId?: string;
	pingOneApplicationName?: string;
}

export interface AuthnRequestProcessingResult {
	parsedRequest: SAMLAuthnRequest;
	validation: ACSValidationResult;
}

export interface ACSValidationResult {
	isValid: boolean;
	acceptedAcsUrl?: string;
	explanation: string;
	errors?: string[];
}

class SAMLService {
	/**
	 * Process and validate a SAML AuthnRequest
	 */
	async processAuthnRequest(authnRequestXml: string, spConfig: SAMLApplicationConfig): Promise<AuthnRequestProcessingResult> {
		try {
			// Parse the AuthnRequest XML
			const parsedRequest = this.parseAuthnRequestXml(authnRequestXml);

			// Validate the AuthnRequest structure
			this.validateAuthnRequestStructure(parsedRequest);

			// Validate ACS URL according to PingOne's new feature
			const validation = this.validateAcsUrl(parsedRequest, spConfig);

			return {
				parsedRequest,
				validation
			};
		} catch (error) {
			throw new Error(`Failed to process AuthnRequest: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Validate ACS URL based on PingOne's dynamic ACS URL feature
	 */
	private validateAcsUrl(authnRequest: SAMLAuthnRequest, spConfig: SAMLApplicationConfig): ACSValidationResult {
		const requestedAcsUrl = authnRequest.assertionConsumerServiceURL;

		// If no ACS URL is specified in the request, that's acceptable
		if (!requestedAcsUrl) {
			return {
				isValid: true,
				explanation: 'No ACS URL specified in AuthnRequest. Will use default SP ACS URL.'
			};
		}

		// Check if the requested ACS URL matches any configured ACS URLs
		const isInConfiguredUrls = spConfig.acsUrls.includes(requestedAcsUrl);

		if (isInConfiguredUrls) {
			// ACS URL is in the configured list - always accept
			return {
				isValid: true,
				acceptedAcsUrl: requestedAcsUrl,
				explanation: `ACS URL ${requestedAcsUrl} is in the configured ACS URLs list.`
			};
		}

		// ACS URL is not in configured list
		if (spConfig.enableAlwaysAcceptAcsUrlInSignedAuthnRequest) {
			// New PingOne feature is enabled - accept dynamic ACS URLs from signed requests
			// In a real implementation, we would verify the AuthnRequest signature here
			const isSigned = this.isAuthnRequestSigned(authnRequest);

			if (isSigned) {
				return {
					isValid: true,
					acceptedAcsUrl: requestedAcsUrl,
					explanation: `Dynamic ACS URL ${requestedAcsUrl} accepted because "Always accept ACS URL in signed SAML 2.0 AuthnRequest" is enabled and the request is signed.`
				};
			} else {
				return {
					isValid: false,
					explanation: `"Always accept ACS URL in signed SAML 2.0 AuthnRequest" is enabled, but the AuthnRequest is not signed.`,
					errors: ['AuthnRequest must be signed to use dynamic ACS URLs']
				};
			}
		} else {
			// Traditional behavior - reject ACS URLs not in configured list
			return {
				isValid: false,
				explanation: `ACS URL ${requestedAcsUrl} is not in the configured ACS URLs list, and dynamic ACS URL acceptance is disabled.`,
				errors: [`ACS URL ${requestedAcsUrl} not in configured list: ${spConfig.acsUrls.join(', ')}`]
			};
		}
	}

	/**
	 * Check if AuthnRequest is signed (simplified for demo)
	 */
	private isAuthnRequestSigned(authnRequest: SAMLAuthnRequest): boolean {
		// In a real implementation, this would check for XML signatures
		// For demo purposes, we'll consider it signed if it has certain properties
		// or if it's from a "trusted" issuer

		// For demo: consider requests with dynamic ACS URLs as "signed"
		// In production, this would validate actual XML signatures
		return true; // Assume signed for demo purposes
	}

	/**
	 * Parse AuthnRequest XML (simplified implementation)
	 */
	private parseAuthnRequestXml(xmlString: string): SAMLAuthnRequest {
		// This is a simplified XML parser for demo purposes
		// In production, use a proper SAML library like saml2-js or xml-crypto

		const parser = new DOMParser();
		const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

		// Check for parser errors
		const parserError = xmlDoc.querySelector('parsererror');
		if (parserError) {
			throw new Error('Invalid XML format');
		}

		// Extract AuthnRequest element
		const authnRequestElement = xmlDoc.querySelector('AuthnRequest');
		if (!authnRequestElement) {
			throw new Error('No AuthnRequest element found');
		}

		// Parse basic attributes
		const id = authnRequestElement.getAttribute('ID') || undefined;
		const version = authnRequestElement.getAttribute('Version') || '2.0';
		const issueInstant = authnRequestElement.getAttribute('IssueInstant') || undefined;
		const destination = authnRequestElement.getAttribute('Destination') || undefined;
		const consent = authnRequestElement.getAttribute('Consent') || undefined;
		const forceAuthn = authnRequestElement.getAttribute('ForceAuthn') === 'true';
		const isPassive = authnRequestElement.getAttribute('IsPassive') === 'true';
		const protocolBinding = authnRequestElement.getAttribute('ProtocolBinding') || undefined;
		const assertionConsumerServiceURL = authnRequestElement.getAttribute('AssertionConsumerServiceURL') || undefined;
		const assertionConsumerServiceIndex = authnRequestElement.getAttribute('AssertionConsumerServiceIndex')
			? parseInt(authnRequestElement.getAttribute('AssertionConsumerServiceIndex')!)
			: undefined;
		const attributeConsumingServiceIndex = authnRequestElement.getAttribute('AttributeConsumingServiceIndex')
			? parseInt(authnRequestElement.getAttribute('AttributeConsumingServiceIndex')!)
			: undefined;

		// Parse Issuer
		const issuerElement = authnRequestElement.querySelector('Issuer');
		const issuer = issuerElement?.textContent?.trim() || '';

		// Parse NameIDPolicy
		const nameIdPolicyElement = authnRequestElement.querySelector('NameIDPolicy');
		let nameIdPolicy: SAMLAuthnRequest['nameIdPolicy'];
		if (nameIdPolicyElement) {
			const formatAttr = nameIdPolicyElement.getAttribute('Format')?.trim();
			const allowCreateAttr = nameIdPolicyElement.getAttribute('AllowCreate');
			const allowCreateValue = allowCreateAttr != null ? allowCreateAttr === 'true' : undefined;

			if (formatAttr || allowCreateAttr != null) {
				nameIdPolicy = {
					...(formatAttr ? { format: formatAttr } : {}),
					...(allowCreateValue !== undefined ? { allowCreate: allowCreateValue } : {}),
				};
			}
		}

		// Parse RequestedAuthnContext
		const requestedAuthnContextElement = authnRequestElement.querySelector('RequestedAuthnContext');
		let requestedAuthnContext: SAMLAuthnRequest['requestedAuthnContext'];
		if (requestedAuthnContextElement) {
			const comparisonAttr = requestedAuthnContextElement.getAttribute('Comparison')?.trim();
			const authnContextClassRefs = Array.from(
				requestedAuthnContextElement.querySelectorAll('AuthnContextClassRef')
			)
				.map(el => el.textContent?.trim())
				.filter((value): value is string => !!value);

			if (comparisonAttr || authnContextClassRefs.length > 0) {
				requestedAuthnContext = {
					...(comparisonAttr ? { comparison: comparisonAttr } : {}),
					...(authnContextClassRefs.length > 0 ? { authnContextClassRefs } : {}),
				};
			}
		}

		const authnRequest: SAMLAuthnRequest = {
			id,
			version,
			issueInstant,
			destination,
			consent,
			issuer,
			assertionConsumerServiceURL,
			assertionConsumerServiceIndex,
			attributeConsumingServiceIndex,
			forceAuthn,
			isPassive,
			protocolBinding
		};

		if (nameIdPolicy) {
			authnRequest.nameIdPolicy = nameIdPolicy;
		}

		if (requestedAuthnContext) {
			authnRequest.requestedAuthnContext = requestedAuthnContext;
		}

		return authnRequest;
	}

	/**
	 * Validate AuthnRequest structure
	 */
	private validateAuthnRequestStructure(authnRequest: SAMLAuthnRequest): void {
		if (!authnRequest.issuer) {
			throw new Error('AuthnRequest missing required Issuer element');
		}

		if (!authnRequest.id) {
			throw new Error('AuthnRequest missing required ID attribute');
		}

		if (!authnRequest.version || authnRequest.version !== '2.0') {
			throw new Error('AuthnRequest must be SAML 2.0');
		}

		if (!authnRequest.issueInstant) {
			throw new Error('AuthnRequest missing required IssueInstant attribute');
		}
	}

	/**
	 * Generate a sample AuthnRequest for testing
	 */
	generateSampleAuthnRequest(params: {
		issuer: string;
		acsUrl: string;
		spEntityId: string;
		nameIdPolicyFormat?: string;
		forceAuthn?: boolean;
		isPassive?: boolean;
	}): string {
		const {
			issuer,
			acsUrl,
			spEntityId,
			nameIdPolicyFormat = 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
			forceAuthn = false,
			isPassive = false
		} = params;

		const requestId = `_${Math.random().toString(36).substr(2, 16)}`;
		const issueInstant = new Date().toISOString();

		return `<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest
    xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
    ID="${requestId}"
    Version="2.0"
    IssueInstant="${issueInstant}"
    Destination="${spEntityId}"
    AssertionConsumerServiceURL="${acsUrl}"
    ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
    ForceAuthn="${forceAuthn}"
    IsPassive="${isPassive}">
    <saml:Issuer>${issuer}</saml:Issuer>
    <samlp:NameIDPolicy
        Format="${nameIdPolicyFormat}"
        AllowCreate="true"/>
    <samlp:RequestedAuthnContext Comparison="exact">
        <saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml:AuthnContextClassRef>
    </samlp:RequestedAuthnContext>
</samlp:AuthnRequest>`;
	}

	/**
	 * Generate SAML Response
	 */
	generateSamlResponse(params: {
		authnRequest: SAMLAuthnRequest;
		spConfig: SAMLApplicationConfig;
		userAttributes: Record<string, any>;
	}): string {
		const { authnRequest, spConfig, userAttributes } = params;

		const responseId = `_${Math.random().toString(36).substr(2, 16)}`;
		const assertionId = `_${Math.random().toString(36).substr(2, 16)}`;
		const issueInstant = new Date().toISOString();
		const notBefore = new Date().toISOString();
		const notOnOrAfter = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes
		const sessionIndex = Math.random().toString(36).substr(2, 16);

		// Determine ACS URL (use dynamic one if accepted, otherwise default)
		const acsUrl = authnRequest.assertionConsumerServiceURL || spConfig.acsUrls[0];

		// Generate NameID based on format
		let nameIdValue = userAttributes.email || 'user@example.com';
		if (spConfig.nameIdFormat.includes('persistent')) {
			nameIdValue = `persistent-${userAttributes.email}`;
		}

		return `<?xml version="1.0" encoding="UTF-8"?>
<samlp:Response
    xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
    ID="${responseId}"
    Version="2.0"
    IssueInstant="${issueInstant}"
    Destination="${acsUrl}"
    InResponseTo="${authnRequest.id}">
    <saml:Issuer>${spConfig.entityId}</saml:Issuer>
    <samlp:Status>
        <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>
    </samlp:Status>
    <saml:Assertion
        xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
        ID="${assertionId}"
        Version="2.0"
        IssueInstant="${issueInstant}">
        <saml:Issuer>${spConfig.entityId}</saml:Issuer>
        <saml:Subject>
            <saml:NameID
                Format="${spConfig.nameIdFormat}">${nameIdValue}</saml:NameID>
            <saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
                <saml:SubjectConfirmationData
                    NotOnOrAfter="${notOnOrAfter}"
                    Recipient="${acsUrl}"
                    InResponseTo="${authnRequest.id}"/>
            </saml:SubjectConfirmation>
        </saml:Subject>
        <saml:Conditions NotBefore="${notBefore}" NotOnOrAfter="${notOnOrAfter}">
            <saml:AudienceRestriction>
                <saml:Audience>${spConfig.entityId}</saml:Audience>
            </saml:AudienceRestriction>
        </saml:Conditions>
        <saml:AuthnStatement
            AuthnInstant="${issueInstant}"
            SessionIndex="${sessionIndex}"
            SessionNotOnOrAfter="${notOnOrAfter}">
            <saml:AuthnContext>
                <saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml:AuthnContextClassRef>
            </saml:AuthnContext>
        </saml:AuthnStatement>
        <saml:AttributeStatement>
            <saml:Attribute Name="email" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
                <saml:AttributeValue>${userAttributes.email}</saml:AttributeValue>
            </saml:Attribute>
            <saml:Attribute Name="firstName" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
                <saml:AttributeValue>${userAttributes.firstName}</saml:AttributeValue>
            </saml:Attribute>
            <saml:Attribute Name="lastName" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
                <saml:AttributeValue>${userAttributes.lastName}</saml:AttributeValue>
            </saml:Attribute>
            <saml:Attribute Name="groups" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
                ${userAttributes.groups.map((group: string) =>
                    `<saml:AttributeValue>${group}</saml:AttributeValue>`
                ).join('')}
            </saml:Attribute>
        </saml:AttributeStatement>
    </saml:Assertion>
</samlp:Response>`;
	}

	/**
	 * Generate SAML metadata for the SP
	 */
	generateSPMetadata(spConfig: SAMLApplicationConfig): string {
		const entityId = spConfig.entityId;
		return `<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor
    xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
    entityID="${entityId}">
    <SPSSODescriptor
        protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol"
        AuthnRequestsSigned="false"
        WantAssertionsSigned="true">
        ${spConfig.acsUrls.map((acsUrl, index) => `
        <AssertionConsumerService
            index="${index}"
            Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
            Location="${acsUrl}"/>`).join('')}
        <SingleLogoutService
            Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
            Location="${spConfig.ssoUrl.replace('/saml/sso', '/saml/slo')}"/>
        <NameIDFormat>${spConfig.nameIdFormat}</NameIDFormat>
    </SPSSODescriptor>
</EntityDescriptor>`;
	}
}

// Export singleton instance
export const samlService = new SAMLService();
export default samlService;
