import { FiArrowRight, FiKey, FiLock, FiSettings, FiShield, FiZap } from '@icons';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { usePageScroll } from '../../hooks/usePageScroll';
import PageLayoutService from '../../services/pageLayoutService';

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
`;

const GuideCard = styled(Link)`
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  padding: 2rem;
  transition: all 0.2s;
  text-decoration: none;
  color: inherit;
  border: 2px solid ${({ theme }) => theme.colors.gray200};
  display: flex;
  flex-direction: column;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    border-color: ${({ theme }) => theme.colors.primary};
  }
  
  .icon-wrapper {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
    color: white;
    background: linear-gradient(135deg, #10b981, #059669);
  }
  
  h3 {
    font-size: 1.25rem;
    margin-bottom: 0.75rem;
    color: ${({ theme }) => theme.colors.gray900};
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  p {
    color: ${({ theme }) => theme.colors.gray600};
    font-size: 0.95rem;
    line-height: 1.6;
    margin-bottom: 1rem;
    flex: 1;
  }

  .read-more {
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    margin-top: auto;
  }
`;

const IntroSection = styled.div`
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  padding: 2.5rem;
  border-radius: 1rem;
  margin-bottom: 2rem;

  h1 {
    font-size: 2rem;
    margin-bottom: 1rem;
    color: white;
  }

  p {
    font-size: 1.1rem;
    opacity: 0.95;
    line-height: 1.6;
    margin-bottom: 0;
    color: white;
  }
`;

const UserGuidesOverview = () => {
	usePageScroll({ pageName: 'User Guides Overview', force: true });

	const pageConfig = {
		flowType: 'documentation' as const,
		theme: 'blue' as const,
		maxWidth: '72rem',
		showHeader: true,
		showFooter: false,
		responsive: true,
		flowId: 'user-guides-overview',
	};

	const { PageContainer, ContentWrapper } = PageLayoutService.createPageLayout(pageConfig);

	return (
		<PageContainer>
			<ContentWrapper>
				<IntroSection>
					<h1>User Guides</h1>
					<p>
						Step-by-step guides to help you configure and use the OAuth Playground effectively. Each
						guide includes practical examples, configuration instructions, and troubleshooting tips.
					</p>
				</IntroSection>

				<CardGrid>
					<GuideCard to="/user-guides/redirect-uris">
						<div className="icon-wrapper">
							<FiSettings />
						</div>
						<h3>
							Redirect URIs
							<FiArrowRight size={20} />
						</h3>
						<p>
							Complete reference for all redirect URIs needed to configure your PingOne application.
							Includes URIs for all OAuth flows with copy-paste examples.
						</p>
						<div className="read-more">
							Read Guide <FiArrowRight size={16} />
						</div>
					</GuideCard>

					<GuideCard to="/user-guides/logout-uris">
						<div className="icon-wrapper">
							<FiSettings />
						</div>
						<h3>
							Logout URIs
							<FiArrowRight size={20} />
						</h3>
						<p>
							Flow-specific logout URI configuration to ensure proper logout handling. Learn why
							each flow needs its own unique logout URI.
						</p>
						<div className="read-more">
							Read Guide <FiArrowRight size={16} />
						</div>
					</GuideCard>

					<GuideCard to="/user-guides/security-features">
						<div className="icon-wrapper">
							<FiShield />
						</div>
						<h3>
							Security Features
							<FiArrowRight size={20} />
						</h3>
						<p>
							Comprehensive guide to configuring PKCE, client authentication, token security, and
							advanced features like DPoP, PAR, and JWKS.
						</p>
						<div className="read-more">
							Read Guide <FiArrowRight size={16} />
						</div>
					</GuideCard>

					<GuideCard to="/user-guides/pingone-pi-flow">
						<div className="icon-wrapper">
							<FiZap />
						</div>
						<h3>
							PingOne pi.flow
							<FiArrowRight size={20} />
						</h3>
						<p>
							Learn how to use PingOne's non-redirect authorization flow (pi.flow) for enhanced user
							experiences and embedded authentication.
						</p>
						<div className="read-more">
							Read Guide <FiArrowRight size={16} />
						</div>
					</GuideCard>

					<GuideCard to="/user-guides/par-explanation">
						<div className="icon-wrapper">
							<FiLock />
						</div>
						<h3>
							PAR Explanation
							<FiArrowRight size={20} />
						</h3>
						<p>
							Understand Pushed Authorization Requests (PAR) and how they enhance security by moving
							authorization parameters to a secure back-channel.
						</p>
						<div className="read-more">
							Read Guide <FiArrowRight size={16} />
						</div>
					</GuideCard>

					<GuideCard to="/user-guides/rar-explanation">
						<div className="icon-wrapper">
							<FiKey />
						</div>
						<h3>
							RAR Explanation
							<FiArrowRight size={20} />
						</h3>
						<p>
							Learn about Rich Authorization Requests (RAR) for fine-grained authorization with
							detailed permission specifications beyond simple scopes.
						</p>
						<div className="read-more">
							Read Guide <FiArrowRight size={16} />
						</div>
					</GuideCard>
				</CardGrid>
			</ContentWrapper>
		</PageContainer>
	);
};

export default UserGuidesOverview;
