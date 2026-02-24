/**
 * @file HeroSection.PingUI.tsx
 * @module protect-portal/components/Shared
 * @description Ping UI migrated configurable hero section component with industry-specific experiences
 * @version 9.11.66
 * @since 2026-02-15
 *
 * Universal hero section that adapts to different company styles and provides authentic industry experiences.
 * Migrated to Ping UI with MDI icons and CSS variables.
 */

import React from 'react';
import styled from 'styled-components';
import type { CorporatePortalConfig } from '../../types/CorporatePortalConfig';

// Bootstrap Icon Component (migrated from MDI)
import BootstrapIcon from '@/components/BootstrapIcon';
import { getBootstrapIconName } from '@/components/iconMapping';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const HeroSectionStyled = styled.section<{
	$brandColor: string;
	$brandSecondary: string;
	$pattern: string;
}>`
  background: ${({ $pattern, $brandColor, $brandSecondary }) => {
		switch ($pattern) {
			case 'gradient-light':
				return `linear-gradient(135deg, ${$brandColor}15 0%, ${$brandSecondary}10 100%)`;
			case 'gradient-medium':
				return `linear-gradient(135deg, ${$brandColor}25 0%, ${$brandSecondary}20 100%)`;
			case 'gradient-dark':
				return `linear-gradient(135deg, ${$brandColor}35 0%, ${$brandSecondary}30 100%)`;
			default:
				return `linear-gradient(135deg, ${$brandColor}25 0%, ${$brandSecondary}20 100%)`;
		}
	}};
  padding: var(--ping-spacing-xxl, 6rem) var(--ping-spacing-xl, 2rem);
  position: relative;
  overflow: hidden;
`;

const HeroContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--ping-spacing-xxl, 4rem);
  align-items: center;
  position: relative;
  z-index: 2;
`;

const HeroContent = styled.div`
  color: var(--ping-text-primary, #1e293b);
`;

const HeroTitle = styled.h1`
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: var(--ping-spacing-lg, 1.5rem);
  color: var(--ping-text-primary, #1e293b);
`;

const HeroSubtitle = styled.p`
  font-size: clamp(1rem, 2vw, 1.25rem);
  line-height: 1.6;
  margin-bottom: var(--ping-spacing-xl, 2rem);
  color: var(--ping-text-secondary, #64748b);
`;

const HeroActions = styled.div`
  display: flex;
  gap: var(--ping-spacing-md, 1rem);
  flex-wrap: wrap;
`;

const PrimaryButton = styled.button<{ $brandColor: string }>`
  background: ${({ $brandColor }) => $brandColor};
  color: white;
  border: none;
  padding: var(--ping-spacing-md, 1rem) var(--ping-spacing-lg, 1.5rem);
  border-radius: var(--ping-border-radius-md, 8px);
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all var(--ping-transition-fast, 0.15s) ease-in-out;
  display: flex;
  align-items: center;
  gap: var(--ping-spacing-sm, 0.5rem);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
`;

const SecondaryButton = styled.button<{ $brandColor: string }>`
  background: transparent;
  color: ${({ $brandColor }) => $brandColor};
  border: 2px solid ${({ $brandColor }) => $brandColor};
  padding: var(--ping-spacing-md, 1rem) var(--ping-spacing-lg, 1.5rem);
  border-radius: var(--ping-border-radius-md, 8px);
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all var(--ping-transition-fast, 0.15s) ease-in-out;
  display: flex;
  align-items: center;
  gap: var(--ping-spacing-sm, 0.5rem);

  &:hover {
    background: ${({ $brandColor }) => $brandColor};
    color: white;
    transform: translateY(-2px);
  }
`;

const HeroVisual = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const HeroCard = styled.div<{ $brandColor: string; $delay: number }>`
  background: white;
  border-radius: var(--ping-border-radius-lg, 16px);
  padding: var(--ping-spacing-lg, 1.5rem);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  position: absolute;
  animation: floatUp 0.6s ease-out ${({ $delay }) => $delay}s backwards;
  border: 1px solid rgba(0, 0, 0, 0.05);

  @keyframes floatUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--ping-spacing-md, 1rem);
  margin-top: var(--ping-spacing-xl, 2rem);
`;

const StatItem = styled.div`
  text-align: center;
  padding: var(--ping-spacing-md, 1rem);
  background: rgba(255, 255, 255, 0.5);
  border-radius: var(--ping-border-radius-md, 8px);
  backdrop-filter: blur(10px);
`;

const StatValue = styled.div<{ $brandColor: string }>`
  font-size: 2rem;
  font-weight: 800;
  color: ${({ $brandColor }) => $brandColor};
  margin-bottom: var(--ping-spacing-xs, 0.25rem);
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: var(--ping-text-secondary, #64748b);
  font-weight: 500;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--ping-spacing-md, 1rem);
  margin-top: var(--ping-spacing-xl, 2rem);
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--ping-spacing-sm, 0.75rem);
  padding: var(--ping-spacing-md, 1rem);
  background: rgba(255, 255, 255, 0.5);
  border-radius: var(--ping-border-radius-md, 8px);
  backdrop-filter: blur(10px);
`;

const FeatureIcon = styled.div<{ $brandColor: string }>`
  color: ${({ $brandColor }) => $brandColor};
  flex-shrink: 0;
  margin-top: 2px;
`;

const FeatureText = styled.div`
  flex: 1;
`;

const FeatureTitle = styled.div`
  font-weight: 600;
  color: var(--ping-text-primary, #1e293b);
  margin-bottom: var(--ping-spacing-xs, 0.25rem);
`;

const FeatureDescription = styled.div`
  font-size: 0.875rem;
  color: var(--ping-text-secondary, #64748b);
  line-height: 1.4;
`;

// ============================================================================
// INTERFACES
// ============================================================================

interface HeroSectionProps {
	config: CorporatePortalConfig;
	onPrimaryAction?: () => void;
	onSecondaryAction?: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const HeroSectionPingUI: React.FC<HeroSectionProps> = ({
	config,
	onPrimaryAction,
	onSecondaryAction,
}) => {
	const renderIndustrySpecificContent = () => {
		switch (config.industry) {
			case 'airlines':
				return renderAirlinesContent();
			case 'banking':
				return renderBankingContent();
			case 'logistics':
				return renderLogisticsContent();
			case 'healthcare':
				return renderHealthcareContent();
			case 'retail':
				return renderRetailContent();
			default:
				return renderGenericContent();
		}
	};

	const renderAirlinesContent = () => (
		<>
			<HeroContent>
				<HeroTitle>{config.hero.title}</HeroTitle>
				<HeroSubtitle>{config.hero.subtitle}</HeroSubtitle>
				<HeroActions>
					<PrimaryButton $brandColor={config.branding.primaryColor} onClick={onPrimaryAction}>
						{config.hero.primaryAction.text}
						<BootstrapIcon icon={getBootstrapIconName("FiArrowRight")} size={16} aria-label="Arrow Right" />
					</PrimaryButton>
					{config.hero.secondaryAction && (
						<SecondaryButton $brandColor={config.branding.primaryColor} onClick={onSecondaryAction}>
							{config.hero.secondaryAction.text}
						</SecondaryButton>
					)}
				</HeroActions>
			</HeroContent>
			<HeroVisual>
				<HeroCard
					$brandColor={config.branding.primaryColor}
					$delay={0.2}
					style={{ top: '0', left: '0' }}
				>
					<BootstrapIcon icon={getBootstrapIconName("FiGlobe")} size={32} aria-label="Global Network" />
					<h4 style={{ margin: '1rem 0 0.5rem', color: config.branding.primaryColor }}>
						Global Network
					</h4>
					<p
						style={{
							margin: 0,
							fontSize: '0.875rem',
							color: 'var(--ping-text-secondary, #64748b)',
						}}
					>
						{config.stats?.destinations || 200}+ Destinations
					</p>
				</HeroCard>
				<HeroCard
					$brandColor={config.branding.secondaryColor}
					$delay={0.4}
					style={{ top: '80px', right: '0' }}
				>
					<BootstrapIcon icon={getBootstrapIconName("FiCalendar")} size={32} aria-label="Daily Flights" />
					<h4 style={{ margin: '1rem 0 0.5rem', color: config.branding.secondaryColor }}>
						Daily Flights
					</h4>
					<p
						style={{
							margin: 0,
							fontSize: '0.875rem',
							color: 'var(--ping-text-secondary, #64748b)',
						}}
					>
						{config.stats?.dailyFlights || 5000}+ Flights
					</p>
				</HeroCard>
				<HeroCard
					$brandColor={config.branding.primaryColor}
					$delay={0.6}
					style={{ bottom: '0', left: '50%', transform: 'translateX(-50%)' }}
				>
					<BootstrapIcon icon={getBootstrapIconName("FiUsers")} size={32} aria-label="Passengers" />
					<h4 style={{ margin: '1rem 0 0.5rem', color: config.branding.primaryColor }}>
						Million Passengers
					</h4>
					<p
						style={{
							margin: 0,
							fontSize: '0.875rem',
							color: 'var(--ping-text-secondary, #64748b)',
						}}
					>
						{config.stats?.passengers || 100}M+ Annually
					</p>
				</HeroCard>
			</HeroVisual>
		</>
	);

	const renderBankingContent = () => (
		<>
			<HeroContent>
				<HeroTitle>{config.hero.title}</HeroTitle>
				<HeroSubtitle>{config.hero.subtitle}</HeroSubtitle>
				<HeroActions>
					<PrimaryButton $brandColor={config.branding.primaryColor} onClick={onPrimaryAction}>
						{config.hero.primaryAction.text}
						<BootstrapIcon icon={getBootstrapIconName("FiArrowRight")} size={16} aria-label="Arrow Right" />
					</PrimaryButton>
					{config.hero.secondaryAction && (
						<SecondaryButton $brandColor={config.branding.primaryColor} onClick={onSecondaryAction}>
							{config.hero.secondaryAction.text}
						</SecondaryButton>
					)}
				</HeroActions>
			</HeroContent>
			<HeroVisual>
				<HeroCard
					$brandColor={config.branding.primaryColor}
					$delay={0.2}
					style={{ top: '0', left: '0' }}
				>
					<BootstrapIcon icon={getBootstrapIconName("FiCreditCard")} size={32} aria-label="Credit Cards" />
					<h4 style={{ margin: '1rem 0 0.5rem', color: config.branding.primaryColor }}>
						Digital Banking
					</h4>
					<p
						style={{
							margin: 0,
							fontSize: '0.875rem',
							color: 'var(--ping-text-secondary, #64748b)',
						}}
					>
						{config.stats?.accounts || 50}M+ Accounts
					</p>
				</HeroCard>
				<HeroCard
					$brandColor={config.branding.secondaryColor}
					$delay={0.4}
					style={{ top: '80px', right: '0' }}
				>
					<BootstrapIcon icon={getBootstrapIconName("FiShield")} size={32} aria-label="Security" />
					<h4 style={{ margin: '1rem 0 0.5rem', color: config.branding.secondaryColor }}>
						Secure Transactions
					</h4>
					<p
						style={{
							margin: 0,
							fontSize: '0.875rem',
							color: 'var(--ping-text-secondary, #64748b)',
						}}
					>
						{config.stats?.transactions || 100}M+ Daily
					</p>
				</HeroCard>
				<HeroCard
					$brandColor={config.branding.primaryColor}
					$delay={0.6}
					style={{ bottom: '0', left: '50%', transform: 'translateX(-50%)' }}
				>
					<BootstrapIcon icon={getBootstrapIconName("FiAward")} size={32} aria-label="Awards" />
					<h4 style={{ margin: '1rem 0 0.5rem', color: config.branding.primaryColor }}>
						Trusted Platform
					</h4>
					<p
						style={{
							margin: 0,
							fontSize: '0.875rem',
							color: 'var(--ping-text-secondary, #64748b)',
						}}
					>
						{config.stats?.awards || 25}+ Awards
					</p>
				</HeroCard>
			</HeroVisual>
		</>
	);

	const renderLogisticsContent = () => (
		<>
			<HeroContent>
				<HeroTitle>{config.hero.title}</HeroTitle>
				<HeroSubtitle>{config.hero.subtitle}</HeroSubtitle>
				<HeroActions>
					<PrimaryButton $brandColor={config.branding.primaryColor} onClick={onPrimaryAction}>
						{config.hero.primaryAction.text}
						<BootstrapIcon icon={getBootstrapIconName("FiArrowRight")} size={16} aria-label="Arrow Right" />
					</PrimaryButton>
					{config.hero.secondaryAction && (
						<SecondaryButton $brandColor={config.branding.primaryColor} onClick={onSecondaryAction}>
							{config.hero.secondaryAction.text}
						</SecondaryButton>
					)}
				</HeroActions>
			</HeroContent>
			<HeroVisual>
				<HeroCard
					$brandColor={config.branding.primaryColor}
					$delay={0.2}
					style={{ top: '0', left: '0' }}
				>
					<BootstrapIcon icon={getBootstrapIconName("FiPackage")} size={32} aria-label="Packages" />
					<h4 style={{ margin: '1rem 0 0.5rem', color: config.branding.primaryColor }}>
						Package Delivery
					</h4>
					<p
						style={{
							margin: 0,
							fontSize: '0.875rem',
							color: 'var(--ping-text-secondary, #64748b)',
						}}
					>
						{config.stats?.packages || 10}M+ Daily
					</p>
				</HeroCard>
				<HeroCard
					$brandColor={config.branding.secondaryColor}
					$delay={0.4}
					style={{ top: '80px', right: '0' }}
				>
					<BootstrapIcon icon={getBootstrapIconName("FiMapPin")} size={32} aria-label="Locations" />
					<h4 style={{ margin: '1rem 0 0.5rem', color: config.branding.secondaryColor }}>
						Global Coverage
					</h4>
					<p
						style={{
							margin: 0,
							fontSize: '0.875rem',
							color: 'var(--ping-text-secondary, #64748b)',
						}}
					>
						{config.stats?.locations || 220}+ Countries
					</p>
				</HeroCard>
				<HeroCard
					$brandColor={config.branding.primaryColor}
					$delay={0.6}
					style={{ bottom: '0', left: '50%', transform: 'translateX(-50%)' }}
				>
					<BootstrapIcon icon={getBootstrapIconName("FiTrendingUp")} size={32} aria-label="Growth" />
					<h4 style={{ margin: '1rem 0 0.5rem', color: config.branding.primaryColor }}>
						Growth Rate
					</h4>
					<p
						style={{
							margin: 0,
							fontSize: '0.875rem',
							color: 'var(--ping-text-secondary, #64748b)',
						}}
					>
						{config.stats?.growth || 25}% YoY
					</p>
				</HeroCard>
			</HeroVisual>
		</>
	);

	const renderHealthcareContent = () => (
		<>
			<HeroContent>
				<HeroTitle>{config.hero.title}</HeroTitle>
				<HeroSubtitle>{config.hero.subtitle}</HeroSubtitle>
				<HeroActions>
					<PrimaryButton $brandColor={config.branding.primaryColor} onClick={onPrimaryAction}>
						{config.hero.primaryAction.text}
						<BootstrapIcon icon={getBootstrapIconName("FiArrowRight")} size={16} aria-label="Arrow Right" />
					</PrimaryButton>
					{config.hero.secondaryAction && (
						<SecondaryButton $brandColor={config.branding.primaryColor} onClick={onSecondaryAction}>
							{config.hero.secondaryAction.text}
						</SecondaryButton>
					)}
				</HeroActions>
			</HeroContent>
			<HeroVisual>
				<HeroCard
					$brandColor={config.branding.primaryColor}
					$delay={0.2}
					style={{ top: '0', left: '0' }}
				>
					<BootstrapIcon icon={getBootstrapIconName("FiUsers")} size={32} aria-label="Patients" />
					<h4 style={{ margin: '1rem 0 0.5rem', color: config.branding.primaryColor }}>
						Patient Care
					</h4>
					<p
						style={{
							margin: 0,
							fontSize: '0.875rem',
							color: 'var(--ping-text-secondary, #64748b)',
						}}
					>
						{config.stats?.patients || 5}M+ Patients
					</p>
				</HeroCard>
				<HeroCard
					$brandColor={config.branding.secondaryColor}
					$delay={0.4}
					style={{ top: '80px', right: '0' }}
				>
					<BootstrapIcon icon={getBootstrapIconName("FiSearch")} size={32} aria-label="Research" />
					<h4 style={{ margin: '1rem 0 0.5rem', color: config.branding.secondaryColor }}>
						Medical Research
					</h4>
					<p
						style={{
							margin: 0,
							fontSize: '0.875rem',
							color: 'var(--ping-text-secondary, #64748b)',
						}}
					>
						{config.stats?.research || 1000}+ Studies
					</p>
				</HeroCard>
				<HeroCard
					$brandColor={config.branding.primaryColor}
					$delay={0.6}
					style={{ bottom: '0', left: '50%', transform: 'translateX(-50%)' }}
				>
					<BootstrapIcon icon={getBootstrapIconName("FiStar")} size={32} aria-label="Quality" />
					<h4 style={{ margin: '1rem 0 0.5rem', color: config.branding.primaryColor }}>
						Quality Rating
					</h4>
					<p
						style={{
							margin: 0,
							fontSize: '0.875rem',
							color: 'var(--ping-text-secondary, #64748b)',
						}}
					>
						{config.stats?.rating || 4.9}/5.0 Stars
					</p>
				</HeroCard>
			</HeroVisual>
		</>
	);

	const renderRetailContent = () => (
		<>
			<HeroContent>
				<HeroTitle>{config.hero.title}</HeroTitle>
				<HeroSubtitle>{config.hero.subtitle}</HeroSubtitle>
				<HeroActions>
					<PrimaryButton $brandColor={config.branding.primaryColor} onClick={onPrimaryAction}>
						{config.hero.primaryAction.text}
						<BootstrapIcon icon={getBootstrapIconName("FiArrowRight")} size={16} aria-label="Arrow Right" />
					</PrimaryButton>
					{config.hero.secondaryAction && (
						<SecondaryButton $brandColor={config.branding.primaryColor} onClick={onSecondaryAction}>
							{config.hero.secondaryAction.text}
						</SecondaryButton>
					)}
				</HeroActions>
			</HeroContent>
			<HeroVisual>
				<HeroCard
					$brandColor={config.branding.primaryColor}
					$delay={0.2}
					style={{ top: '0', left: '0' }}
				>
					<BootstrapIcon icon={getBootstrapIconName("FiPackage")} size={32} aria-label="Products" />
					<h4 style={{ margin: '1rem 0 0.5rem', color: config.branding.primaryColor }}>
						Product Catalog
					</h4>
					<p
						style={{
							margin: 0,
							fontSize: '0.875rem',
							color: 'var(--ping-text-secondary, #64748b)',
						}}
					>
						{config.stats?.products || 100}K+ Products
					</p>
				</HeroCard>
				<HeroCard
					$brandColor={config.branding.secondaryColor}
					$delay={0.4}
					style={{ top: '80px', right: '0' }}
				>
					<BootstrapIcon icon={getBootstrapIconName("FiUsers")} size={32} aria-label="Customers" />
					<h4 style={{ margin: '1rem 0 0.5rem', color: config.branding.secondaryColor }}>
						Happy Customers
					</h4>
					<p
						style={{
							margin: 0,
							fontSize: '0.875rem',
							color: 'var(--ping-text-secondary, #64748b)',
						}}
					>
						{config.stats?.customers || 10}M+ Customers
					</p>
				</HeroCard>
				<HeroCard
					$brandColor={config.branding.primaryColor}
					$delay={0.6}
					style={{ bottom: '0', left: '50%', transform: 'translateX(-50%)' }}
				>
					<BootstrapIcon icon={getBootstrapIconName("FiTrendingUp")} size={32} aria-label="Revenue" />
					<h4 style={{ margin: '1rem 0 0.5rem', color: config.branding.primaryColor }}>
						Revenue Growth
					</h4>
					<p
						style={{
							margin: 0,
							fontSize: '0.875rem',
							color: 'var(--ping-text-secondary, #64748b)',
						}}
					>
						{config.stats?.revenue || 30}% YoY
					</p>
				</HeroCard>
			</HeroVisual>
		</>
	);

	const renderGenericContent = () => (
		<>
			<HeroContent>
				<HeroTitle>{config.hero.title}</HeroTitle>
				<HeroSubtitle>{config.hero.subtitle}</HeroSubtitle>
				<HeroActions>
					<PrimaryButton $brandColor={config.branding.primaryColor} onClick={onPrimaryAction}>
						{config.hero.primaryAction.text}
						<BootstrapIcon icon={getBootstrapIconName("FiArrowRight")} size={16} aria-label="Arrow Right" />
					</PrimaryButton>
					{config.hero.secondaryAction && (
						<SecondaryButton $brandColor={config.branding.primaryColor} onClick={onSecondaryAction}>
							{config.hero.secondaryAction.text}
						</SecondaryButton>
					)}
				</HeroActions>
			</HeroContent>
			<HeroVisual>
				<HeroCard
					$brandColor={config.branding.primaryColor}
					$delay={0.2}
					style={{ top: '0', left: '0' }}
				>
					<BootstrapIcon icon={getBootstrapIconName("FiShield")} size={32} aria-label="Security" />
					<h4 style={{ margin: '1rem 0 0.5rem', color: config.branding.primaryColor }}>
						Secure Platform
					</h4>
					<p
						style={{
							margin: 0,
							fontSize: '0.875rem',
							color: 'var(--ping-text-secondary, #64748b)',
						}}
					>
						Enterprise-Grade Security
					</p>
				</HeroCard>
				<HeroCard
					$brandColor={config.branding.secondaryColor}
					$delay={0.4}
					style={{ top: '80px', right: '0' }}
				>
					<BootstrapIcon icon={getBootstrapIconName("FiCode")} size={32} aria-label="Developer" />
					<h4 style={{ margin: '1rem 0 0.5rem', color: config.branding.secondaryColor }}>
						Developer Friendly
					</h4>
					<p
						style={{
							margin: 0,
							fontSize: '0.875rem',
							color: 'var(--ping-text-secondary, #64748b)',
						}}
					>
						Comprehensive APIs
					</p>
				</HeroCard>
				<HeroCard
					$brandColor={config.branding.primaryColor}
					$delay={0.6}
					style={{ bottom: '0', left: '50%', transform: 'translateX(-50%)' }}
				>
					<BootstrapIcon icon={getBootstrapIconName("FiGlobe")} size={32} aria-label="Global" />
					<h4 style={{ margin: '1rem 0 0.5rem', color: config.branding.primaryColor }}>
						Global Scale
					</h4>
					<p
						style={{
							margin: 0,
							fontSize: '0.875rem',
							color: 'var(--ping-text-secondary, #64748b)',
						}}
					>
						Worldwide Coverage
					</p>
				</HeroCard>
			</HeroVisual>
		</>
	);

	return (
		<div className="end-user-nano">
			<HeroSectionStyled
				$brandColor={config.branding.primaryColor}
				$brandSecondary={config.branding.secondaryColor}
				$pattern={config.hero.pattern || 'gradient-medium'}
			>
				<HeroContainer>{renderIndustrySpecificContent()}</HeroContainer>

				{config.hero.showStats && (
					<HeroContainer style={{ marginTop: 'var(--ping-spacing-xxl, 4rem)' }}>
						<StatsGrid>
							{config.stats?.map((stat, index) => (
								<StatItem key={index}>
									<StatValue $brandColor={config.branding.primaryColor}>{stat.value}</StatValue>
									<StatLabel>{stat.label}</StatLabel>
								</StatItem>
							))}
						</StatsGrid>
					</HeroContainer>
				)}

				{config.hero.showFeatures && (
					<HeroContainer style={{ marginTop: 'var(--ping-spacing-xxl, 4rem)' }}>
						<FeaturesGrid>
							{config.features?.map((feature, index) => (
								<FeatureItem key={index}>
									<FeatureIcon $brandColor={config.branding.primaryColor}>
										<BootstrapIcon
											icon={feature.icon || 'FiCheckCircle'}
											size={20}
											aria-label={feature.title}
										/>
									</FeatureIcon>
									<FeatureText>
										<FeatureTitle>{feature.title}</FeatureTitle>
										<FeatureDescription>{feature.description}</FeatureDescription>
									</FeatureText>
								</FeatureItem>
							))}
						</FeaturesGrid>
					</HeroContainer>
				)}
			</HeroSectionStyled>
		</div>
	);
};

export default HeroSectionPingUI;
