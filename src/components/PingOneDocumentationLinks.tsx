// src/components/PingOneDocumentationLinks.tsx
/**
 * PingOne Documentation Links Component
 *
 * Provides references to key PingOne documentation for users
 */

import React, { useState } from 'react';
import { FiBook, FiChevronDown, FiChevronUp, FiExternalLink } from 'react-icons/fi';
import styled from 'styled-components';

const DocsContainer = styled.div`
	background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
	border: 1px solid #bae6fd;
	border-radius: 12px;
	padding: 1.5rem;
	margin: 1.5rem 0;
`;

const DocsHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	cursor: pointer;
	margin-bottom: ${(props) => (props.$expanded ? '1rem' : '0')};
	transition: margin-bottom 0.2s;
`;

const DocsTitle = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 600;
	font-size: 1.1rem;
	color: #1e40af;
`;

const DocsContent = styled.div<{ $expanded: boolean }>`
	display: ${(props) => (props.$expanded ? 'block' : 'none')};
	animation: ${(props) => (props.$expanded ? 'fadeIn 0.3s ease-in' : 'none')};
	
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
`;

const DocsSection = styled.div`
	margin-bottom: 1rem;
`;

const DocsSectionTitle = styled.div`
	font-weight: 600;
	font-size: 0.95rem;
	color: #1e3a8a;
	margin-bottom: 0.5rem;
`;

const DocsLink = styled.a`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem;
	background: white;
	border: 1px solid #dbeafe;
	border-radius: 6px;
	margin-bottom: 0.5rem;
	text-decoration: none;
	color: #1e40af;
	font-size: 0.9rem;
	transition: all 0.2s;
	
	&:hover {
		background: #eff6ff;
		border-color: #3b82f6;
		transform: translateX(4px);
	}
	
	&:visited {
		color: #7c3aed;
	}
`;

const DocsDescription = styled.div`
	font-size: 0.85rem;
	color: #475569;
	margin-left: 2rem;
	margin-top: 0.25rem;
	font-style: italic;
`;

interface DocumentationLink {
	title: string;
	url: string;
	description?: string;
}

interface DocumentationSection {
	title: string;
	links: DocumentationLink[];
}

const DOCUMENTATION_SECTIONS: DocumentationSection[] = [
	{
		title: 'Native SDKs',
		links: [
			{
				title: 'PingOne Native SDKs Overview',
				url: 'https://apidocs.pingidentity.com/pingone/native-sdks/v1/api/#pingone-mfa-native-sdks',
				description: 'Native SDKs for iOS and Android (MFA, Protect, Verify, Wallet)',
			},
			{
				title: 'PingOne MFA Native SDK Flows',
				url: 'https://apidocs.pingidentity.com/pingone/native-sdks/v1/api/#pingone-mfa-native-sdks',
				description: 'Automatic enrollment, device pairing, and device authorization flows',
			},
		],
	},
	{
		title: 'Authentication & Authorization',
		links: [
			{
				title: 'Redirect and Non-Redirect Authentication Flows',
				url: 'https://apidocs.pingidentity.com/pingone/auth/v1/api/#redirect-and-non-redirect-authentication-flows',
				description: 'OAuth 2.0 and OIDC flows including redirectless (pi.flow)',
			},
			{
				title: 'PingOne Auth APIs',
				url: 'https://apidocs.pingidentity.com/pingone/auth/v1/api/',
				description: 'Complete Auth API reference',
			},
		],
	},
	{
		title: 'JWT & Security',
		links: [
			{
				title: 'Create a login_hint_token JWT',
				url: 'https://apidocs.pingidentity.com/pingone/auth/v1/api/#create-a-login_hint_token-jwt',
				description: 'JWT creation guide for login hints',
			},
			{
				title: 'Create a request property JWT',
				url: 'https://apidocs.pingidentity.com/pingone/auth/v1/api/#create-a-request-property-jwt',
				description: 'JWT creation guide for request properties',
			},
			{
				title: 'Create a private key JWT',
				url: 'https://apidocs.pingidentity.com/pingone/auth/v1/api/#create-a-private-key-jwt',
				description: 'JWT creation guide for private key authentication',
			},
		],
	},
];

export const PingOneDocumentationLinks: React.FC = () => {
	const [expanded, setExpanded] = useState(false);

	return (
		<DocsContainer>
			<DocsHeader $expanded={expanded} onClick={() => setExpanded(!expanded)}>
				<DocsTitle>
					<FiBook /> PingOne Documentation References
				</DocsTitle>
				{expanded ? <FiChevronUp /> : <FiChevronDown />}
			</DocsHeader>
			<DocsContent $expanded={expanded}>
				{DOCUMENTATION_SECTIONS.map((section, sectionIndex) => (
					<DocsSection key={sectionIndex}>
						<DocsSectionTitle>{section.title}</DocsSectionTitle>
						{section.links.map((link, linkIndex) => (
							<div key={linkIndex}>
								<DocsLink href={link.url} target="_blank" rel="noopener noreferrer">
									<FiExternalLink size={16} />
									<span>{link.title}</span>
								</DocsLink>
								{link.description && <DocsDescription>{link.description}</DocsDescription>}
							</div>
						))}
					</DocsSection>
				))}
			</DocsContent>
		</DocsContainer>
	);
};
