/**
 * @file FeaturesSection.tsx
 * @module protect-portal/components/Shared
 * @description Configurable features section component
 * @version 9.11.58
 * @since 2026-02-15
 *
 * Universal features section that adapts to different company styles and industries.
 */

import React from 'react';
import styled from 'styled-components';
import type { CorporatePortalConfig } from '../../types/CorporatePortalConfig';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const FeaturesSection = styled.section<{ $backgroundColor: string }>`
  padding: 4rem 2rem;
  background: ${({ $backgroundColor }) => $backgroundColor};
`;

const FeaturesContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const FeaturesTitle = styled.h2<{ $brandColor: string; $tone: string }>`
  text-align: center;
  font-size: ${({ $tone }) => ($tone === 'friendly' ? '2rem' : '2.5rem')};
  font-weight: 700;
  color: ${({ $brandColor }) => $brandColor};
  margin: 0 0 3rem 0;
  
  @media (max-width: 768px) {
    font-size: ${({ $tone }) => ($tone === 'friendly' ? '1.75rem' : '2rem')};
  }
`;

const FeaturesGrid = styled.div<{ $tone: string }>`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${({ $tone }) => ($tone === 'friendly' ? '1.5rem' : '2rem')};
`;

const FeatureCard = styled.div<{ $tone: string }>`
  background: white;
  padding: ${({ $tone }) => ($tone === 'friendly' ? '1.5rem' : '2rem')};
  border-radius: ${({ $tone }) => ($tone === 'friendly' ? '16px' : '8px')};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: ${({ $tone }) => ($tone === 'friendly' ? 'translateY(-4px)' : 'translateY(-2px)')};
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
`;

const FeatureIcon = styled.div<{ $brandColor: string; $tone: string }>`
  width: ${({ $tone }) => ($tone === 'friendly' ? '56px' : '64px')};
  height: ${({ $tone }) => ($tone === 'friendly' ? '56px' : '64px')};
  background: ${({ $brandColor }) => $brandColor};
  border-radius: ${({ $tone }) => ($tone === 'friendly' ? '16px' : '50%')};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  color: white;
  font-size: ${({ $tone }) => ($tone === 'friendly' ? '1.25rem' : '1.5rem')};
  font-weight: 600;
`;

const FeatureTitle = styled.h3<{ $brandColor: string; $tone: string }>`
  font-size: ${({ $tone }) => ($tone === 'friendly' ? '1.125rem' : '1.25rem')};
  font-weight: 600;
  color: ${({ $brandColor }) => $brandColor};
  margin: 0 0 1rem 0;
`;

const FeatureDescription = styled.p<{ $tone: string }>`
  color: #666;
  line-height: 1.6;
  margin: 0;
  font-size: ${({ $tone }) => ($tone === 'friendly' ? '0.95rem' : '1rem')};
`;

const FeatureLink = styled.a<{ $brandColor: string }>`
  color: ${({ $brandColor }) => $brandColor};
  text-decoration: none;
  font-weight: 600;
  margin-top: 1rem;
  display: inline-block;
  
  &:hover {
    text-decoration: underline;
  }
`;

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface FeaturesSectionProps {
	config: CorporatePortalConfig;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const FeaturesSectionComponent: React.FC<FeaturesSectionProps> = ({ config }) => {
	const brandColor = config.branding.colors.primary;
	const backgroundColor = config.branding.colors.background || '#f8f9fa';
	const tone = config.content.tone;

	// Get icon based on feature icon name
	const getIconContent = (iconName: string) => {
		// Simple text-based icons for now
		const iconMap: Record<string, string> = {
			plane: '✈',
			calendar: '📅',
			support: '💬',
			account: '👤',
			shield: '🛡',
			api: '🔌',
			code: '💻',
			docs: '📚',
			tracking: '📦',
			shipping: '🚚',
			global: '🌍',
			transfer: '💸',
			cards: '💳',
			investments: '📈',
			book: '📖',
			travel: '🌎',
			trips: '🧳',
			mileageplus: '⭐',
			products: '📦',
			solutions: '🔧',
			services: '⚙',
			about: 'ℹ',
			contact: '📞',
			home: '🏠',
		};
		return iconMap[iconName] || '📋';
	};

	return (
		<FeaturesSection $backgroundColor={backgroundColor}>
			<FeaturesContainer>
				<FeaturesTitle $brandColor={brandColor} $tone={tone}>
					{config.content.customerTerminology ? 'Customer Resources' : 'Employee Resources'}
				</FeaturesTitle>

				<FeaturesGrid $tone={tone}>
					{config.content.features.map((feature, index) => (
						<FeatureCard key={index} $tone={tone}>
							<FeatureIcon $brandColor={brandColor} $tone={tone}>
								{getIconContent(feature.icon)}
							</FeatureIcon>

							<FeatureTitle $brandColor={brandColor} $tone={tone}>
								{feature.title}
							</FeatureTitle>

							<FeatureDescription $tone={tone}>{feature.description}</FeatureDescription>

							{feature.link && (
								<FeatureLink href={feature.link} $brandColor={brandColor}>
									Learn More →
								</FeatureLink>
							)}
						</FeatureCard>
					))}
				</FeaturesGrid>
			</FeaturesContainer>
		</FeaturesSection>
	);
};

export default FeaturesSectionComponent;
