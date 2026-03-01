import { FiAlertTriangle, FiBookOpen, FiExternalLink, FiShield, FiTool } from '@icons';
import React from 'react';
import styled from 'styled-components';

// Simple container for testing
const PageContainer = styled.div`
  max-width: 90rem;
  margin: 0 auto;
  padding: 2rem;
`;

const MainCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const CollapsibleHeader = styled.div`
  margin-bottom: 2rem;
  
  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 1rem;
  }
`;

const WarningBanner = styled.div`
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 2px solid #f59e0b;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;

  .warning-icon {
    color: #d97706;
    font-size: 1.5rem;
    margin-top: 0.25rem;
    flex-shrink: 0;
  }

  .warning-content {
    flex: 1;

    h3 {
      color: #92400e;
      margin: 0 0 0.5rem 0;
      font-size: 1.25rem;
      font-weight: 700;
    }

    p {
      color: #78350f;
      margin: 0;
      line-height: 1.6;
    }
  }
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const FeatureCard = styled.div<{ $category: 'oauth' | 'oidc' | 'security' | 'advanced' }>`
  background: ${(props) => {
		switch (props.$category) {
			case 'oauth':
				return 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)';
			case 'oidc':
				return 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)';
			case 'security':
				return 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)';
			case 'advanced':
				return 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)';
			default:
				return 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)';
		}
	}};
  border: 2px solid ${(props) => {
		switch (props.$category) {
			case 'oauth':
				return '#f87171';
			case 'oidc':
				return '#60a5fa';
			case 'security':
				return '#4ade80';
			case 'advanced':
				return '#a78bfa';
			default:
				return '#d1d5db';
		}
	}};
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }

  .feature-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;

    .feature-icon {
      font-size: 1.5rem;
      color: ${(props) => {
				switch (props.$category) {
					case 'oauth':
						return '#dc2626';
					case 'oidc':
						return '#2563eb';
					case 'security':
						return '#16a34a';
					case 'advanced':
						return '#7c3aed';
					default:
						return '#6b7280';
				}
			}};
    }

    h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: ${(props) => {
				switch (props.$category) {
					case 'oauth':
						return '#991b1b';
					case 'oidc':
						return '#1e40af';
					case 'security':
						return '#14532d';
					case 'advanced':
						return '#581c87';
					default:
						return '#374151';
				}
			}};
    }
  }

  .feature-description {
    color: #4b5563;
    margin-bottom: 1rem;
    line-height: 1.6;
  }

  .feature-reason {
    background: rgba(255, 255, 255, 0.7);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
    border-left: 4px solid ${(props) => {
			switch (props.$category) {
				case 'oauth':
					return '#f87171';
				case 'oidc':
					return '#60a5fa';
				case 'security':
					return '#4ade80';
				case 'advanced':
					return '#a78bfa';
				default:
					return '#d1d5db';
			}
		}};

    .reason-label {
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .reason-text {
      color: #6b7280;
      font-size: 0.9rem;
      line-height: 1.5;
    }
  }

  .feature-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;

    a {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid ${(props) => {
				switch (props.$category) {
					case 'oauth':
						return '#fca5a5';
					case 'oidc':
						return '#93c5fd';
					case 'security':
						return '#86efac';
					case 'advanced':
						return '#c4b5fd';
					default:
						return '#d1d5db';
				}
			}};
      border-radius: 6px;
      text-decoration: none;
      color: #374151;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s ease;

      &:hover {
        background: white;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      svg {
        font-size: 1rem;
      }
    }
  }
`;

const _InfoBox = styled.div<{ $type: 'info' | 'warning' | 'success' }>`
  background: ${(props) => {
		switch (props.$type) {
			case 'info':
				return 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)';
			case 'warning':
				return 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
			case 'success':
				return 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)';
			default:
				return 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)';
		}
	}};
  border: 2px solid ${(props) => {
		switch (props.$type) {
			case 'info':
				return '#60a5fa';
			case 'warning':
				return '#fbbf24';
			case 'success':
				return '#4ade80';
			default:
				return '#d1d5db';
		}
	}};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;

  .info-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;

    .info-icon {
      font-size: 1.5rem;
      color: ${(props) => {
				switch (props.$type) {
					case 'info':
						return '#2563eb';
					case 'warning':
						return '#d97706';
					case 'success':
						return '#16a34a';
					default:
						return '#6b7280';
				}
			}};
    }

    h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: ${(props) => {
				switch (props.$type) {
					case 'info':
						return '#1e40af';
					case 'warning':
						return '#92400e';
					case 'success':
						return '#14532d';
					default:
						return '#374151';
				}
			}};
    }
  }

  p {
    color: #4b5563;
    margin: 0;
    line-height: 1.6;
  }

  ul {
    color: #4b5563;
    margin: 1rem 0 0 0;
    padding-left: 1.5rem;

    li {
      margin-bottom: 0.5rem;
      line-height: 1.5;
    }
  }
`;

const PingOneMockFeatures: React.FC = () => {
	return (
		<PageContainer>
			<MainCard>
				<div style={{ marginBottom: '2rem' }}>
					<h1
						style={{
							fontSize: '2.5rem',
							fontWeight: '800',
							color: '#111827',
							marginBottom: '1rem',
						}}
					>
						PingOne Mock & Educational Features
					</h1>
					<p
						style={{
							fontSize: '1.25rem',
							color: '#6b7280',
							lineHeight: '1.6',
							maxWidth: '800px',
						}}
					>
						<strong>
							Features implemented as mock demonstrations because they are{' '}
							<span style={{ color: '#dc2626' }}>not supported by PingOne</span>. Click the links
							below to try existing mock flows.
						</strong>
					</p>
				</div>

				<WarningBanner>
					<FiAlertTriangle
						style={{ color: '#d97706', fontSize: '1.5rem', marginTop: '0.25rem', flexShrink: 0 }}
					/>
					<div style={{ flex: 1 }}>
						<h3
							style={{
								color: '#92400e',
								margin: '0 0 0.5rem 0',
								fontSize: '1.25rem',
								fontWeight: '700',
							}}
						>
							Important Notice
						</h3>
						<p style={{ color: '#78350f', margin: 0, lineHeight: 1.6 }}>
							All features listed below are{' '}
							<strong>mock implementations for educational purposes only</strong>. They demonstrate
							OAuth/OIDC concepts and specifications but do not integrate with real PingOne
							services.
						</p>
					</div>
				</WarningBanner>

				<CollapsibleHeader>
					<h2>OAuth 2.0 Mock Features</h2>
					<FeatureGrid>
						<FeatureCard $category="oauth">
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.75rem',
									marginBottom: '1rem',
								}}
							>
								<FiShield style={{ fontSize: '1.5rem', color: '#dc2626' }} />
								<h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#991b1b' }}>
									JWT Bearer Token Flow
								</h3>
							</div>
							<div style={{ color: '#4b5563', marginBottom: '1rem', lineHeight: 1.6 }}>
								Mock implementation of RFC 7523 JWT Bearer Token authorization grant for
								service-to-service authentication.
							</div>
							<div
								style={{
									background: 'rgba(255, 255, 255, 0.7)',
									borderRadius: '8px',
									padding: '1rem',
									marginBottom: '1rem',
									borderLeft: '4px solid #f87171',
								}}
							>
								<div style={{ fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
									Why Mock:
								</div>
								<div style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.5 }}>
									PingOne doesn't support JWT Bearer Token flow. Our existing implementation shows
									how services can authenticate using signed JWTs.
								</div>
							</div>
							<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
								<a
									href="/flows/jwt-bearer-token-v6"
									style={{
										display: 'inline-flex',
										alignItems: 'center',
										gap: '0.5rem',
										padding: '0.5rem 1rem',
										background: 'rgba(255, 255, 255, 0.8)',
										border: '1px solid #fca5a5',
										borderRadius: '6px',
										textDecoration: 'none',
										color: '#374151',
										fontSize: '0.875rem',
										fontWeight: 500,
									}}
								>
									<FiTool />
									Try JWT Bearer Demo
								</a>
								<a
									href="/flows/jwt-bearer-v5"
									style={{
										display: 'inline-flex',
										alignItems: 'center',
										gap: '0.5rem',
										padding: '0.5rem 1rem',
										background: 'rgba(255, 255, 255, 0.8)',
										border: '1px solid #fca5a5',
										borderRadius: '6px',
										textDecoration: 'none',
										color: '#374151',
										fontSize: '0.875rem',
										fontWeight: 500,
									}}
								>
									<FiTool />
									Try JWT Bearer V5
								</a>
							</div>
						</FeatureCard>

						<FeatureCard $category="oauth">
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.75rem',
									marginBottom: '1rem',
								}}
							>
								<FiShield style={{ fontSize: '1.5rem', color: '#dc2626' }} />
								<h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#991b1b' }}>
									SAML Bearer Assertion Flow
								</h3>
							</div>
							<div style={{ color: '#4b5563', marginBottom: '1rem', lineHeight: 1.6 }}>
								Mock implementation of RFC 7522 SAML Bearer Assertion for OAuth token exchange using
								SAML assertions.
							</div>
							<div
								style={{
									background: 'rgba(255, 255, 255, 0.7)',
									borderRadius: '8px',
									padding: '1rem',
									marginBottom: '1rem',
									borderLeft: '4px solid #f87171',
								}}
							>
								<div style={{ fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
									Why Mock:
								</div>
								<div style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.5 }}>
									PingOne doesn't support SAML Bearer Assertion flow for OAuth. Our existing mock
									demonstrates SAML-to-OAuth token exchange.
								</div>
							</div>
							<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
								<a
									href="/flows/saml-bearer-assertion-v6"
									style={{
										display: 'inline-flex',
										alignItems: 'center',
										gap: '0.5rem',
										padding: '0.5rem 1rem',
										background: 'rgba(255, 255, 255, 0.8)',
										border: '1px solid #fca5a5',
										borderRadius: '6px',
										textDecoration: 'none',
										color: '#374151',
										fontSize: '0.875rem',
										fontWeight: 500,
									}}
								>
									<FiTool />
									Try SAML Bearer Demo
								</a>
							</div>
						</FeatureCard>

						<FeatureCard $category="oauth">
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.75rem',
									marginBottom: '1rem',
								}}
							>
								<FiShield style={{ fontSize: '1.5rem', color: '#dc2626' }} />
								<h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#991b1b' }}>
									DPoP (Demonstration of Proof-of-Possession)
								</h3>
							</div>
							<div style={{ color: '#4b5563', marginBottom: '1rem', lineHeight: 1.6 }}>
								Mock implementation of RFC 9449 DPoP for enhanced OAuth security through token
								binding and replay attack prevention.
							</div>
							<div
								style={{
									background: 'rgba(255, 255, 255, 0.7)',
									borderRadius: '8px',
									padding: '1rem',
									marginBottom: '1rem',
									borderLeft: '4px solid #f87171',
								}}
							>
								<div style={{ fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
									Why Mock:
								</div>
								<div style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.5 }}>
									PingOne does not support DPoP token binding. Our mock implementation demonstrates
									how DPoP prevents token replay attacks and enhances OAuth security.
								</div>
							</div>
							<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
								<a
									href="/flows/advanced-oauth-params-demo"
									style={{
										display: 'inline-flex',
										alignItems: 'center',
										gap: '0.5rem',
										padding: '0.5rem 1rem',
										background: 'rgba(255, 255, 255, 0.8)',
										border: '1px solid #fca5a5',
										borderRadius: '6px',
										textDecoration: 'none',
										color: '#374151',
										fontSize: '0.875rem',
										fontWeight: 500,
									}}
								>
									<FiTool />
									Try DPoP Demo
								</a>
								<a
									href="https://tools.ietf.org/rfc/rfc9449.html"
									target="_blank"
									rel="noopener noreferrer"
									style={{
										display: 'inline-flex',
										alignItems: 'center',
										gap: '0.5rem',
										padding: '0.5rem 1rem',
										background: 'rgba(255, 255, 255, 0.8)',
										border: '1px solid #fca5a5',
										borderRadius: '6px',
										textDecoration: 'none',
										color: '#374151',
										fontSize: '0.875rem',
										fontWeight: 500,
									}}
								>
									<FiExternalLink />
									RFC 9449
								</a>
							</div>
						</FeatureCard>

						<FeatureCard $category="oauth">
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.75rem',
									marginBottom: '1rem',
								}}
							>
								<FiShield style={{ fontSize: '1.5rem', color: '#dc2626' }} />
								<h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#991b1b' }}>
									Dynamic Client Registration (DCR)
								</h3>
							</div>
							<div style={{ color: '#4b5563', marginBottom: '1rem', lineHeight: 1.6 }}>
								Mock implementation of RFC 7591 Dynamic Client Registration for programmatic OAuth
								client registration and management.
							</div>
							<div
								style={{
									background: 'rgba(255, 255, 255, 0.7)',
									borderRadius: '8px',
									padding: '1rem',
									marginBottom: '1rem',
									borderLeft: '4px solid #f87171',
								}}
							>
								<div style={{ fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
									Why Mock:
								</div>
								<div style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.5 }}>
									PingOne doesn't support Dynamic Client Registration. Our mock demonstrates how
									clients can register themselves programmatically without manual configuration.
								</div>
							</div>
							<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
								<a
									href="/client-generator"
									style={{
										display: 'inline-flex',
										alignItems: 'center',
										gap: '0.5rem',
										padding: '0.5rem 1rem',
										background: 'rgba(255, 255, 255, 0.8)',
										border: '1px solid #fca5a5',
										borderRadius: '6px',
										textDecoration: 'none',
										color: '#374151',
										fontSize: '0.875rem',
										fontWeight: 500,
									}}
								>
									<FiTool />
									Try DCR Demo
								</a>
								<a
									href="https://tools.ietf.org/rfc/rfc7591.html"
									target="_blank"
									rel="noopener noreferrer"
									style={{
										display: 'inline-flex',
										alignItems: 'center',
										gap: '0.5rem',
										padding: '0.5rem 1rem',
										background: 'rgba(255, 255, 255, 0.8)',
										border: '1px solid #fca5a5',
										borderRadius: '6px',
										textDecoration: 'none',
										color: '#374151',
										fontSize: '0.875rem',
										fontWeight: 500,
									}}
								>
									<FiExternalLink />
									RFC 7591
								</a>
							</div>
						</FeatureCard>

						<FeatureCard $category="oauth">
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.75rem',
									marginBottom: '1rem',
								}}
							>
								<FiShield style={{ fontSize: '1.5rem', color: '#dc2626' }} />
								<h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#991b1b' }}>
									Resource Owner Password Credentials
								</h3>
							</div>
							<div style={{ color: '#4b5563', marginBottom: '1rem', lineHeight: 1.6 }}>
								Mock implementation of RFC 6749 Resource Owner Password Credentials flow (deprecated
								for security reasons).
							</div>
							<div
								style={{
									background: 'rgba(255, 255, 255, 0.7)',
									borderRadius: '8px',
									padding: '1rem',
									marginBottom: '1rem',
									borderLeft: '4px solid #f87171',
								}}
							>
								<div style={{ fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
									Why Mock:
								</div>
								<div style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.5 }}>
									PingOne doesn't support ROPC flow due to security concerns. Our existing mock
									shows why this flow is deprecated.
								</div>
							</div>
							<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
								<a
									href="/flows/oauth2-resource-owner-password"
									style={{
										display: 'inline-flex',
										alignItems: 'center',
										gap: '0.5rem',
										padding: '0.5rem 1rem',
										background: 'rgba(255, 255, 255, 0.8)',
										border: '1px solid #fca5a5',
										borderRadius: '6px',
										textDecoration: 'none',
										color: '#374151',
										fontSize: '0.875rem',
										fontWeight: 500,
									}}
								>
									<FiTool />
									Try ROPC Demo
								</a>
							</div>
						</FeatureCard>
					</FeatureGrid>
				</CollapsibleHeader>

				<CollapsibleHeader>
					<h2>Advanced OAuth Parameters & Features</h2>
					<FeatureGrid>
						<FeatureCard $category="advanced">
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.75rem',
									marginBottom: '1rem',
								}}
							>
								<FiTool style={{ fontSize: '1.5rem', color: '#7c3aed' }} />
								<h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#581c87' }}>
									Advanced OAuth Parameters Demo
								</h3>
							</div>
							<div style={{ color: '#4b5563', marginBottom: '1rem', lineHeight: 1.6 }}>
								Comprehensive demonstration of advanced OAuth/OIDC parameters that PingOne doesn't
								fully support.
							</div>
							<div
								style={{
									background: 'rgba(255, 255, 255, 0.7)',
									borderRadius: '8px',
									padding: '1rem',
									marginBottom: '1rem',
									borderLeft: '4px solid #a78bfa',
								}}
							>
								<div style={{ fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
									Why Mock:
								</div>
								<div style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.5 }}>
									Many advanced OAuth parameters like custom claims, advanced scopes, and
									specialized response modes aren't supported by PingOne.
								</div>
							</div>
							<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
								<a
									href="/flows/advanced-oauth-params-demo"
									style={{
										display: 'inline-flex',
										alignItems: 'center',
										gap: '0.5rem',
										padding: '0.5rem 1rem',
										background: 'rgba(255, 255, 255, 0.8)',
										border: '1px solid #c4b5fd',
										borderRadius: '6px',
										textDecoration: 'none',
										color: '#374151',
										fontSize: '0.875rem',
										fontWeight: 500,
									}}
								>
									<FiTool />
									Try Parameters Demo
								</a>
							</div>
						</FeatureCard>

						<FeatureCard $category="advanced">
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.75rem',
									marginBottom: '1rem',
								}}
							>
								<FiShield style={{ fontSize: '1.5rem', color: '#7c3aed' }} />
								<h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#581c87' }}>
									Rich Authorization Requests (RAR)
								</h3>
							</div>
							<div style={{ color: '#4b5563', marginBottom: '1rem', lineHeight: 1.6 }}>
								Mock implementation of RFC 9396 Rich Authorization Requests for fine-grained
								authorization.
							</div>
							<div
								style={{
									background: 'rgba(255, 255, 255, 0.7)',
									borderRadius: '8px',
									padding: '1rem',
									marginBottom: '1rem',
									borderLeft: '4px solid #a78bfa',
								}}
							>
								<div style={{ fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
									Why Mock:
								</div>
								<div style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.5 }}>
									PingOne doesn't support RAR for complex authorization scenarios. Our existing
									implementation demonstrates fine-grained permissions.
								</div>
							</div>
							<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
								<a
									href="/flows/rar-v6"
									style={{
										display: 'inline-flex',
										alignItems: 'center',
										gap: '0.5rem',
										padding: '0.5rem 1rem',
										background: 'rgba(255, 255, 255, 0.8)',
										border: '1px solid #c4b5fd',
										borderRadius: '6px',
										textDecoration: 'none',
										color: '#374151',
										fontSize: '0.875rem',
										fontWeight: 500,
									}}
								>
									<FiTool />
									Try RAR Demo
								</a>
							</div>
						</FeatureCard>
					</FeatureGrid>
				</CollapsibleHeader>

				<CollapsibleHeader>
					<h2>Educational & Training Features</h2>
					<FeatureGrid>
						<FeatureCard $category="security">
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.75rem',
									marginBottom: '1rem',
								}}
							>
								<FiShield style={{ fontSize: '1.5rem', color: '#16a34a' }} />
								<h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#14532d' }}>
									OAuth 2.1 Security Features
								</h3>
							</div>
							<div style={{ color: '#4b5563', marginBottom: '1rem', lineHeight: 1.6 }}>
								Educational content about OAuth 2.1 security enhancements and best practices.
							</div>
							<div
								style={{
									background: 'rgba(255, 255, 255, 0.7)',
									borderRadius: '8px',
									padding: '1rem',
									marginBottom: '1rem',
									borderLeft: '4px solid #4ade80',
								}}
							>
								<div style={{ fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
									Educational Value:
								</div>
								<div style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.5 }}>
									PingOne implements OAuth 2.0, not OAuth 2.1. Our existing page shows the security
									improvements in OAuth 2.1.
								</div>
							</div>
							<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
								<a
									href="/oauth-2-1"
									style={{
										display: 'inline-flex',
										alignItems: 'center',
										gap: '0.5rem',
										padding: '0.5rem 1rem',
										background: 'rgba(255, 255, 255, 0.8)',
										border: '1px solid #86efac',
										borderRadius: '6px',
										textDecoration: 'none',
										color: '#374151',
										fontSize: '0.875rem',
										fontWeight: 500,
									}}
								>
									<FiTool />
									Learn OAuth 2.1
								</a>
							</div>
						</FeatureCard>

						<FeatureCard $category="security">
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.75rem',
									marginBottom: '1rem',
								}}
							>
								<FiTool style={{ fontSize: '1.5rem', color: '#16a34a' }} />
								<h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#14532d' }}>
									Interactive Learning
								</h3>
							</div>
							<div style={{ color: '#4b5563', marginBottom: '1rem', lineHeight: 1.6 }}>
								Hands-on tutorials and training materials for OAuth/OIDC concepts.
							</div>
							<div
								style={{
									background: 'rgba(255, 255, 255, 0.7)',
									borderRadius: '8px',
									padding: '1rem',
									marginBottom: '1rem',
									borderLeft: '4px solid #4ade80',
								}}
							>
								<div style={{ fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
									Educational Value:
								</div>
								<div style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.5 }}>
									Our existing tutorials and training materials help developers understand
									OAuth/OIDC security concepts and implementation patterns.
								</div>
							</div>
							<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
								<a
									href="/tutorials"
									style={{
										display: 'inline-flex',
										alignItems: 'center',
										gap: '0.5rem',
										padding: '0.5rem 1rem',
										background: 'rgba(255, 255, 255, 0.8)',
										border: '1px solid #86efac',
										borderRadius: '6px',
										textDecoration: 'none',
										color: '#374151',
										fontSize: '0.875rem',
										fontWeight: 500,
									}}
								>
									<FiTool />
									Interactive Tutorials
								</a>
								<a
									href="/oauth-oidc-training"
									style={{
										display: 'inline-flex',
										alignItems: 'center',
										gap: '0.5rem',
										padding: '0.5rem 1rem',
										background: 'rgba(255, 255, 255, 0.8)',
										border: '1px solid #86efac',
										borderRadius: '6px',
										textDecoration: 'none',
										color: '#374151',
										fontSize: '0.875rem',
										fontWeight: 500,
									}}
								>
									<FiBookOpen />
									OAuth Training
								</a>
							</div>
						</FeatureCard>
					</FeatureGrid>
				</CollapsibleHeader>

				<div
					style={{
						background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
						border: '2px solid #4ade80',
						borderRadius: '12px',
						padding: '1.5rem',
						marginBottom: '2rem',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
						<FiShield
							style={{ color: '#16a34a', fontSize: '1.5rem', marginTop: '0.25rem', flexShrink: 0 }}
						/>
						<div style={{ flex: 1 }}>
							<h3
								style={{
									color: '#14532d',
									margin: '0 0 0.5rem 0',
									fontSize: '1.25rem',
									fontWeight: '700',
								}}
							>
								Production Recommendations
							</h3>
							<p style={{ color: '#4b5563', margin: '0 0 1rem 0', lineHeight: 1.6 }}>
								For production applications, we recommend using PingOne's supported features which
								provide enterprise-grade security, scalability, and compliance. The mock features
								above are valuable for:
							</p>
							<ul style={{ color: '#4b5563', margin: 0, paddingLeft: '1.5rem' }}>
								<li style={{ marginBottom: '0.5rem', lineHeight: 1.5 }}>
									<strong>Learning:</strong> Understanding OAuth/OIDC specifications and security
									concepts
								</li>
								<li style={{ marginBottom: '0.5rem', lineHeight: 1.5 }}>
									<strong>Evaluation:</strong> Comparing different authorization server capabilities
								</li>
								<li style={{ marginBottom: '0.5rem', lineHeight: 1.5 }}>
									<strong>Migration Planning:</strong> Understanding what features are available in
									other systems
								</li>
								<li style={{ marginBottom: '0.5rem', lineHeight: 1.5 }}>
									<strong>Development:</strong> Testing applications against different OAuth
									implementations
								</li>
							</ul>
						</div>
					</div>
				</div>

				<div
					style={{
						background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
						border: '2px solid #f59e0b',
						borderRadius: '12px',
						padding: '1.5rem',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
						<FiAlertTriangle
							style={{ color: '#d97706', fontSize: '1.5rem', marginTop: '0.25rem', flexShrink: 0 }}
						/>
						<div style={{ flex: 1 }}>
							<h3
								style={{
									color: '#92400e',
									margin: '0 0 0.5rem 0',
									fontSize: '1.25rem',
									fontWeight: '700',
								}}
							>
								Important Disclaimers
							</h3>
							<p style={{ color: '#78350f', margin: '0 0 1rem 0', lineHeight: 1.6 }}>
								Please note the following important points about these mock implementations:
							</p>
							<ul style={{ color: '#78350f', margin: 0, paddingLeft: '1.5rem' }}>
								<li style={{ marginBottom: '0.5rem', lineHeight: 1.5 }}>
									<strong>Not Production Ready:</strong> These are educational demonstrations, not
									production implementations
								</li>
								<li style={{ marginBottom: '0.5rem', lineHeight: 1.5 }}>
									<strong>Mock Responses:</strong> All server responses are simulated and don't
									represent real PingOne behavior
								</li>
								<li style={{ marginBottom: '0.5rem', lineHeight: 1.5 }}>
									<strong>Security Limitations:</strong> Mock cryptographic operations are for
									demonstration only
								</li>
								<li style={{ marginBottom: '0.5rem', lineHeight: 1.5 }}>
									<strong>No Real Authentication:</strong> No actual user authentication or
									authorization occurs
								</li>
								<li style={{ marginBottom: '0.5rem', lineHeight: 1.5 }}>
									<strong>Educational Purpose:</strong> Designed for learning OAuth/OIDC concepts,
									not for real applications
								</li>
							</ul>
						</div>
					</div>
				</div>
			</MainCard>
		</PageContainer>
	);
};

export default PingOneMockFeatures;
