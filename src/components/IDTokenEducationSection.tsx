import {
	FiCheckCircle,
	FiChevronDown,
	FiChevronRight,
	FiClock,
	FiDatabase,
	FiGlobe,
	FiInfo,
	FiKey,
	FiShield,
	FiUser,
	FiXCircle,
} from '@icons';
import React, { useState } from 'react';
import styled from 'styled-components';

interface IDTokenEducationSectionProps {
	className?: string;
	defaultCollapsed?: boolean;
}

const EducationContainer = styled.div`
  background: linear-gradient(135deg, V9_COLORS.BG.GRAY_LIGHT 0%, V9_COLORS.BG.GRAY_LIGHT 100%);
  border: 2px solid #0ea5e9;
  border-radius: 0.75rem;
  margin: 1.5rem 0;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.15);
`;

const Header = styled.div`
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #0ea5e9 0%, V9_COLORS.PRIMARY.BLUE 100%);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(135deg, V9_COLORS.PRIMARY.BLUE 0%, V9_COLORS.PRIMARY.BLUE 100%);
  }
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ChevronIcon = styled.div<{ $collapsed: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease;
  transform: ${({ $collapsed }) => ($collapsed ? 'rotate(0deg)' : 'rotate(90deg)')};

  svg {
    font-size: 1.25rem;
    color: white;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: ${({ $collapsed }) => ($collapsed ? 'rotate(0deg) scale(1.1)' : 'rotate(90deg) scale(1.1)')};
  }
`;

const Content = styled.div<{ $collapsed: boolean }>`
  max-height: ${({ $collapsed }) => ($collapsed ? '0' : '2000px')};
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;
  background: white;
`;

const ContentInner = styled.div`
  padding: 1.5rem;
`;

const Section = styled.div`
  margin-bottom: 1.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h4`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: V9_COLORS.PRIMARY.BLUE_DARK;
`;

const UsesList = styled.ul`
  margin: 0;
  padding-left: 1.5rem;
  color: V9_COLORS.TEXT.GRAY_DARK;
  line-height: 1.6;
`;

const UseItem = styled.li`
  margin-bottom: 0.5rem;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const UseIcon = styled.div`
  margin-top: 0.125rem;
  flex-shrink: 0;
`;

const _ClaimExample = styled.div`
  background: V9_COLORS.BG.GRAY_LIGHT;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 0.5rem;
  padding: 0.75rem;
  margin: 0.5rem 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  color: V9_COLORS.TEXT.GRAY_DARK;
`;

const ImportantSection = styled.div`
  background: V9_COLORS.BG.WARNING;
  border: 1px solid V9_COLORS.PRIMARY.YELLOW;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1rem;
`;

const ImportantTitle = styled.h4`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: V9_COLORS.PRIMARY.YELLOW_DARK;
`;

const DoDontList = styled.ul`
  margin: 0;
  padding-left: 1.5rem;
  color: V9_COLORS.PRIMARY.YELLOW_DARK;
  line-height: 1.6;
`;

const DoDontItem = styled.li<{ $isPositive?: boolean }>`
  margin-bottom: 0.5rem;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const IDTokenEducationSection: React.FC<IDTokenEducationSectionProps> = ({
	className,
	defaultCollapsed = true,
}) => {
	const [collapsed, setCollapsed] = useState(defaultCollapsed);

	const handleToggle = () => {
		setCollapsed(!collapsed);
	};

	return (
		<EducationContainer className={className}>
			<Header onClick={handleToggle}>
				<HeaderContent>
					<FiInfo size={20} />
					<Title>Understanding ID Tokens</Title>
				</HeaderContent>
				<ChevronIcon $collapsed={collapsed}>
					{collapsed ? <FiChevronRight size={16} /> : <FiChevronDown size={16} />}
				</ChevronIcon>
			</Header>

			<Content $collapsed={collapsed}>
				<ContentInner>
					<Section>
						<SectionTitle>
							<FiUser size={16} />
							Core Uses of ID Tokens
						</SectionTitle>

						<div style={{ marginBottom: '1rem' }}>
							<h5
								style={{
									margin: '0 0 0.5rem 0',
									color: 'V9_COLORS.PRIMARY.BLUE_DARK',
									fontSize: '0.9rem',
								}}
							>
								1. Verify User Authentication
							</h5>
							<p
								style={{
									margin: '0 0 0.5rem 0',
									color: 'V9_COLORS.TEXT.GRAY_DARK',
									fontSize: '0.875rem',
								}}
							>
								The ID token provides proof of the authentication event, containing claims that tell
								you:
							</p>
							<UsesList>
								<UseItem>
									<UseIcon>
										<FiUser size={14} color="V9_COLORS.PRIMARY.GREEN" />
									</UseIcon>
									<span>
										<strong>WHO</strong> authenticated (sub claim)
									</span>
								</UseItem>
								<UseItem>
									<UseIcon>
										<FiClock size={14} color="V9_COLORS.PRIMARY.GREEN" />
									</UseIcon>
									<span>
										<strong>WHEN</strong> they authenticated (auth_time, iat)
									</span>
								</UseItem>
								<UseItem>
									<UseIcon>
										<FiKey size={14} color="V9_COLORS.PRIMARY.GREEN" />
									</UseIcon>
									<span>
										<strong>HOW</strong> they authenticated (amr - authentication methods)
									</span>
								</UseItem>
								<UseItem>
									<UseIcon>
										<FiShield size={14} color="V9_COLORS.PRIMARY.GREEN" />
									</UseIcon>
									<span>
										<strong>STRENGTH</strong> of authentication (acr - authentication level)
									</span>
								</UseItem>
							</UsesList>
						</div>

						<div style={{ marginBottom: '1rem' }}>
							<h5
								style={{
									margin: '0 0 0.5rem 0',
									color: 'V9_COLORS.PRIMARY.BLUE_DARK',
									fontSize: '0.9rem',
								}}
							>
								2. Extract User Information
							</h5>
							<p
								style={{
									margin: '0 0 0.5rem 0',
									color: 'V9_COLORS.TEXT.GRAY_DARK',
									fontSize: '0.875rem',
								}}
							>
								Claims provide information about the end user to relying parties:
							</p>
							<UsesList>
								<UseItem>
									<UseIcon>
										<FiUser size={14} color="V9_COLORS.PRIMARY.GREEN" />
									</UseIcon>
									<span>Basic profile info (name, email, username)</span>
								</UseItem>
								<UseItem>
									<UseIcon>
										<FiDatabase size={14} color="V9_COLORS.PRIMARY.GREEN" />
									</UseIcon>
									<span>Custom claims specific to your application</span>
								</UseItem>
								<UseItem>
									<UseIcon>
										<FiGlobe size={14} color="V9_COLORS.PRIMARY.GREEN" />
									</UseIcon>
									<span>Group memberships and roles</span>
								</UseItem>
							</UsesList>
						</div>

						<div style={{ marginBottom: '1rem' }}>
							<h5
								style={{
									margin: '0 0 0.5rem 0',
									color: 'V9_COLORS.PRIMARY.BLUE_DARK',
									fontSize: '0.9rem',
								}}
							>
								3. Token Verification & Security
							</h5>
							<p
								style={{
									margin: '0 0 0.5rem 0',
									color: 'V9_COLORS.TEXT.GRAY_DARK',
									fontSize: '0.875rem',
								}}
							>
								Use the signature to verify that the token was issued by the trusted issuer:
							</p>
							<UsesList>
								<UseItem>
									<UseIcon>
										<FiShield size={14} color="V9_COLORS.PRIMARY.GREEN" />
									</UseIcon>
									<span>Signature validation using JWKS keys</span>
								</UseItem>
								<UseItem>
									<UseIcon>
										<FiCheckCircle size={14} color="V9_COLORS.PRIMARY.GREEN" />
									</UseIcon>
									<span>Claims validation (issuer, audience, expiration)</span>
								</UseItem>
								<UseItem>
									<UseIcon>
										<FiShield size={14} color="V9_COLORS.PRIMARY.GREEN" />
									</UseIcon>
									<span>Ensuring the token hasn't been tampered with</span>
								</UseItem>
							</UsesList>
						</div>

						<div style={{ marginBottom: '1rem' }}>
							<h5
								style={{
									margin: '0 0 0.5rem 0',
									color: 'V9_COLORS.PRIMARY.BLUE_DARK',
									fontSize: '0.9rem',
								}}
							>
								4. Get Additional Claims
							</h5>
							<p
								style={{
									margin: '0 0 0.5rem 0',
									color: 'V9_COLORS.TEXT.GRAY_DARK',
									fontSize: '0.875rem',
								}}
							>
								Clients can retrieve additional claims from the /oauth2/userinfo endpoint, where the
								sub Claim in the UserInfo Response MUST be verified to exactly match the sub Claim
								in the ID Token.
							</p>
						</div>

						<div>
							<h5
								style={{
									margin: '0 0 0.5rem 0',
									color: 'V9_COLORS.PRIMARY.BLUE_DARK',
									fontSize: '0.9rem',
								}}
							>
								5. Session Management & SSO
							</h5>
							<p
								style={{
									margin: '0 0 0.5rem 0',
									color: 'V9_COLORS.TEXT.GRAY_DARK',
									fontSize: '0.875rem',
								}}
							>
								Use the ID token for:
							</p>
							<UsesList>
								<UseItem>
									<UseIcon>
										<FiClock size={14} color="V9_COLORS.PRIMARY.GREEN" />
									</UseIcon>
									<span>Determining if user needs re-authentication</span>
								</UseItem>
								<UseItem>
									<UseIcon>
										<FiUser size={14} color="V9_COLORS.PRIMARY.GREEN" />
									</UseIcon>
									<span>Managing session lifetime</span>
								</UseItem>
								<UseItem>
									<UseIcon>
										<FiGlobe size={14} color="V9_COLORS.PRIMARY.GREEN" />
									</UseIcon>
									<span>Implementing Single Sign-On across applications</span>
								</UseItem>
							</UsesList>
						</div>
					</Section>

					<ImportantSection>
						<ImportantTitle>
							<FiInfo size={16} />
							Important Distinctions
						</ImportantTitle>

						<div style={{ marginBottom: '1rem' }}>
							<h5
								style={{
									margin: '0 0 0.5rem 0',
									color: 'V9_COLORS.PRIMARY.YELLOW_DARK',
									fontSize: '0.9rem',
								}}
							>
								What ID Tokens ARE for:
							</h5>
							<DoDontList>
								<DoDontItem $isPositive>
									<UseIcon>
										<FiCheckCircle size={14} color="V9_COLORS.PRIMARY.GREEN_DARK" />
									</UseIcon>
									<span>Authentication (proving who the user is)</span>
								</DoDontItem>
								<DoDontItem $isPositive>
									<UseIcon>
										<FiCheckCircle size={14} color="V9_COLORS.PRIMARY.GREEN_DARK" />
									</UseIcon>
									<span>Getting user identity information</span>
								</DoDontItem>
								<DoDontItem $isPositive>
									<UseIcon>
										<FiCheckCircle size={14} color="V9_COLORS.PRIMARY.GREEN_DARK" />
									</UseIcon>
									<span>Session management</span>
								</DoDontItem>
								<DoDontItem $isPositive>
									<UseIcon>
										<FiCheckCircle size={14} color="V9_COLORS.PRIMARY.GREEN_DARK" />
									</UseIcon>
									<span>Authorization decisions based on user attributes</span>
								</DoDontItem>
							</DoDontList>
						</div>

						<div>
							<h5
								style={{
									margin: '0 0 0.5rem 0',
									color: 'V9_COLORS.PRIMARY.YELLOW_DARK',
									fontSize: '0.9rem',
								}}
							>
								What ID Tokens are NOT for:
							</h5>
							<DoDontList>
								<DoDontItem>
									<UseIcon>
										<FiXCircle size={14} color="V9_COLORS.PRIMARY.RED_DARK" />
									</UseIcon>
									<span>ID tokens are private to the client and should never be sent to APIs</span>
								</DoDontItem>
								<DoDontItem>
									<UseIcon>
										<FiXCircle size={14} color="V9_COLORS.PRIMARY.RED_DARK" />
									</UseIcon>
									<span>Long-term storage (they have shorter lifetimes)</span>
								</DoDontItem>
								<DoDontItem>
									<UseIcon>
										<FiXCircle size={14} color="V9_COLORS.PRIMARY.RED_DARK" />
									</UseIcon>
									<span>API access (that's what access tokens are for)</span>
								</DoDontItem>
							</DoDontList>
						</div>
					</ImportantSection>
				</ContentInner>
			</Content>
		</EducationContainer>
	);
};

export default IDTokenEducationSection;
