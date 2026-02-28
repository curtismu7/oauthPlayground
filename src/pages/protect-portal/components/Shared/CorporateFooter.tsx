/**
 * @file CorporateFooter.tsx
 * @module protect-portal/components/Shared
 * @description Authentic footer component matching real company websites
 * @version 9.11.67
 * @since 2026-02-15
 *
 * Professional footer with industry-specific links and company information.
 */

import React from 'react';
import {
	FiFacebook,
	FiInstagram,
	FiLinkedin,
	FiMail,
	FiMapPin,
	FiPhone,
	FiTwitter,
	FiYoutube,
} from '@icons';
import styled from 'styled-components';
import type { CorporatePortalConfig } from '../../types/CorporatePortalConfig';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const FooterContainer = styled.footer<{ $brandColor: string; $industry: string }>`
  background: ${({ $industry }) => {
		switch ($industry) {
			case 'banking':
				return 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)';
			case 'aviation':
				return 'linear-gradient(180deg, #f1f3f5 0%, #dee2e6 100%)';
			case 'logistics':
				return 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)';
			case 'tech':
				return 'linear-gradient(180deg, #1a1d23 0%, #0f1115 100%)';
			default:
				return 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)';
		}
	}};
  color: ${({ $industry }) => ($industry === 'tech' ? '#e9ecef' : '#212529')};
  padding: 3rem 2rem 1rem;
  border-top: 1px solid ${({ $industry }) => ($industry === 'tech' ? '#343a40' : '#dee2e6')};
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const FooterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const FooterSection = styled.div`
  h3 {
    font-size: 0.875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 0 1rem 0;
    opacity: 0.9;
  }
  
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  li {
    margin-bottom: 0.5rem;
  }
`;

const FooterLink = styled.a<{ $industry: string }>`
  color: ${({ $industry }) => ($industry === 'tech' ? '#adb5bd' : '#495057')};
  text-decoration: none;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  display: inline-block;
  
  &:hover {
    color: ${({ $industry }) => ($industry === 'tech' ? '#f8f9fa' : '#212529')};
    transform: translateX(4px);
  }
`;

const FooterBottom = styled.div<{ $industry: string }>`
  border-top: 1px solid ${({ $industry }) => ($industry === 'tech' ? '#343a40' : '#dee2e6')};
  padding-top: 1.5rem;
  margin-top: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`;

const Copyright = styled.p`
  font-size: 0.75rem;
  margin: 0;
  opacity: 0.7;
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const SocialLink = styled.a<{ $brandColor: string; $industry: string }>`
  color: ${({ $industry }) => ($industry === 'tech' ? '#adb5bd' : '#495057')};
  font-size: 1.25rem;
  transition: all 0.2s ease;
  
  &:hover {
    color: ${({ $brandColor }) => $brandColor};
    transform: translateY(-2px);
  }
`;

const LegalLinks = styled.div`
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const LegalLink = styled.a<{ $industry: string }>`
  color: ${({ $industry }) => ($industry === 'tech' ? '#adb5bd' : '#495057')};
  text-decoration: none;
  font-size: 0.75rem;
  transition: all 0.2s ease;
  
  &:hover {
    color: ${({ $industry }) => ($industry === 'tech' ? '#f8f9fa' : '#212529')};
    text-decoration: underline;
  }
`;

const ContactInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ContactItem = styled.div<{ $industry: string }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: ${({ $industry }) => ($industry === 'tech' ? '#adb5bd' : '#495057')};
  
  svg {
    opacity: 0.7;
  }
`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getFooterLinks = (industry: string) => {
	switch (industry) {
		case 'banking':
			return {
				'Products & Services': [
					{ label: 'Checking Accounts', href: '#' },
					{ label: 'Savings Accounts', href: '#' },
					{ label: 'Credit Cards', href: '#' },
					{ label: 'Loans & Mortgages', href: '#' },
					{ label: 'Investing', href: '#' },
				],
				Support: [
					{ label: 'Help Center', href: '#' },
					{ label: 'Contact Us', href: '#' },
					{ label: 'Security Center', href: '#' },
					{ label: 'Find a Branch', href: '#' },
					{ label: 'Report Fraud', href: '#' },
				],
				'About Us': [
					{ label: 'About Our Company', href: '#' },
					{ label: 'Careers', href: '#' },
					{ label: 'Press Room', href: '#' },
					{ label: 'Investor Relations', href: '#' },
					{ label: 'Sustainability', href: '#' },
				],
			};

		case 'aviation':
			return {
				'Travel Information': [
					{ label: 'Flight Status', href: '#' },
					{ label: 'Check-in', href: '#' },
					{ label: 'Baggage Information', href: '#' },
					{ label: 'Travel Requirements', href: '#' },
					{ label: 'Airport Information', href: '#' },
				],
				'Loyalty Program': [
					{ label: 'Join Now', href: '#' },
					{ label: 'Earn Miles', href: '#' },
					{ label: 'Redeem Miles', href: '#' },
					{ label: 'Elite Status', href: '#' },
					{ label: 'Partners', href: '#' },
				],
				Support: [
					{ label: 'Help Center', href: '#' },
					{ label: 'Contact Us', href: '#' },
					{ label: 'Refunds', href: '#' },
					{ label: 'Special Assistance', href: '#' },
					{ label: 'Feedback', href: '#' },
				],
			};

		case 'logistics':
			return {
				Shipping: [
					{ label: 'Create Shipment', href: '#' },
					{ label: 'Schedule Pickup', href: '#' },
					{ label: 'Get Rates', href: '#' },
					{ label: 'Shipping Tools', href: '#' },
					{ label: 'International Shipping', href: '#' },
				],
				'Tracking & Managing': [
					{ label: 'Track Packages', href: '#' },
					{ label: 'Manage Delivery', href: '#' },
					{ label: 'Hold at Location', href: '#' },
					{ label: 'Delivery Manager', href: '#' },
					{ label: 'Service Alerts', href: '#' },
				],
				Support: [
					{ label: 'Help Center', href: '#' },
					{ label: 'Contact Us', href: '#' },
					{ label: 'Claims', href: '#' },
					{ label: 'Billing', href: '#' },
					{ label: 'Find Locations', href: '#' },
				],
			};

		case 'tech':
			return {
				Products: [
					{ label: 'PingOne', href: '#' },
					{ label: 'PingFederate', href: '#' },
					{ label: 'PingDirectory', href: '#' },
					{ label: 'PingAccess', href: '#' },
					{ label: 'All Products', href: '#' },
				],
				Developers: [
					{ label: 'Documentation', href: '#' },
					{ label: 'APIs', href: '#' },
					{ label: 'SDKs', href: '#' },
					{ label: 'Developer Portal', href: '#' },
					{ label: 'Community', href: '#' },
				],
				Resources: [
					{ label: 'Blog', href: '#' },
					{ label: 'Webinars', href: '#' },
					{ label: 'Case Studies', href: '#' },
					{ label: 'White Papers', href: '#' },
					{ label: 'Support', href: '#' },
				],
			};

		default:
			return {
				Company: [
					{ label: 'About Us', href: '#' },
					{ label: 'Careers', href: '#' },
					{ label: 'Press', href: '#' },
					{ label: 'Investors', href: '#' },
				],
				Support: [
					{ label: 'Help Center', href: '#' },
					{ label: 'Contact Us', href: '#' },
					{ label: 'FAQs', href: '#' },
				],
			};
	}
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface CorporateFooterProps {
	config: CorporatePortalConfig;
}

const CorporateFooter: React.FC<CorporateFooterProps> = ({ config }) => {
	const brandColor = config.branding.colors.primary;
	const industry = config.company.industry;
	const currentYear = new Date().getFullYear();
	const footerLinks = getFooterLinks(industry);

	return (
		<FooterContainer $brandColor={brandColor} $industry={industry}>
			<FooterContent>
				<FooterGrid>
					{Object.entries(footerLinks).map(([section, links]) => (
						<FooterSection key={section}>
							<h3>{section}</h3>
							<ul>
								{links.map((link) => (
									<li key={link.label}>
										<FooterLink href={link.href} $industry={industry}>
											{link.label}
										</FooterLink>
									</li>
								))}
							</ul>
						</FooterSection>
					))}

					<FooterSection>
						<h3>Contact</h3>
						<ContactInfo>
							{industry === 'banking' && (
								<>
									<ContactItem $industry={industry}>
										<FiPhone />
										<span>1-800-432-1000</span>
									</ContactItem>
									<ContactItem $industry={industry}>
										<FiMail />
										<span>support@bankofamerica.com</span>
									</ContactItem>
									<ContactItem $industry={industry}>
										<FiMapPin />
										<span>Find a Branch</span>
									</ContactItem>
								</>
							)}
							{industry === 'aviation' && (
								<>
									<ContactItem $industry={industry}>
										<FiPhone />
										<span>1-800-UNITED-1</span>
									</ContactItem>
									<ContactItem $industry={industry}>
										<FiMail />
										<span>customercare@united.com</span>
									</ContactItem>
									<ContactItem $industry={industry}>
										<FiMapPin />
										<span>Airport Locations</span>
									</ContactItem>
								</>
							)}
							{industry === 'logistics' && (
								<>
									<ContactItem $industry={industry}>
										<FiPhone />
										<span>1-800-GO-FEDEX</span>
									</ContactItem>
									<ContactItem $industry={industry}>
										<FiMail />
										<span>support@fedex.com</span>
									</ContactItem>
									<ContactItem $industry={industry}>
										<FiMapPin />
										<span>Find a Location</span>
									</ContactItem>
								</>
							)}
							{industry === 'tech' && (
								<>
									<ContactItem $industry={industry}>
										<FiPhone />
										<span>1-888-PING-ID</span>
									</ContactItem>
									<ContactItem $industry={industry}>
										<FiMail />
										<span>support@pingidentity.com</span>
									</ContactItem>
									<ContactItem $industry={industry}>
										<FiMapPin />
										<span>Global Offices</span>
									</ContactItem>
								</>
							)}
						</ContactInfo>
					</FooterSection>
				</FooterGrid>

				<FooterBottom $industry={industry}>
					<Copyright>
						© {currentYear} {config.company.displayName}. All rights reserved.
					</Copyright>

					<LegalLinks>
						<LegalLink href="#" $industry={industry}>
							Privacy Policy
						</LegalLink>
						<LegalLink href="#" $industry={industry}>
							Terms of Service
						</LegalLink>
						<LegalLink href="#" $industry={industry}>
							Cookie Policy
						</LegalLink>
						<LegalLink href="#" $industry={industry}>
							Accessibility
						</LegalLink>
						<LegalLink href="#" $industry={industry}>
							Legal Notices
						</LegalLink>
					</LegalLinks>

					<SocialLinks>
						<SocialLink
							href="#"
							$brandColor={brandColor}
							$industry={industry}
							aria-label="Facebook"
						>
							<FiFacebook />
						</SocialLink>
						<SocialLink href="#" $brandColor={brandColor} $industry={industry} aria-label="Twitter">
							<FiTwitter />
						</SocialLink>
						<SocialLink
							href="#"
							$brandColor={brandColor}
							$industry={industry}
							aria-label="LinkedIn"
						>
							<FiLinkedin />
						</SocialLink>
						<SocialLink
							href="#"
							$brandColor={brandColor}
							$industry={industry}
							aria-label="Instagram"
						>
							<FiInstagram />
						</SocialLink>
						<SocialLink href="#" $brandColor={brandColor} $industry={industry} aria-label="YouTube">
							<FiYoutube />
						</SocialLink>
					</SocialLinks>
				</FooterBottom>
			</FooterContent>
		</FooterContainer>
	);
};

export default CorporateFooter;
