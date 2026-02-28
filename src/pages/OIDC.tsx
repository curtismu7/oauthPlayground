import React from 'react';
import {
	FiCode,
	FiExternalLink,
	FiKey,
	FiLayers,
	FiLock,
	FiSmartphone,
	FiZap,
} from '@icons';
import { Link, Outlet, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { FlowHeader } from '../services/flowHeaderService';

const OIDCContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const _PageHeader = styled.div`
  margin-bottom: 2rem;

  h1 {
    font-size: 2.5rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  p {
    color: ${({ theme }) => theme.colors.gray600};
    font-size: 1.1rem;
    line-height: 1.6;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const FeatureCard = styled(Link)`
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  padding: 1.5rem;
  transition: transform 0.2s, box-shadow 0.2s;
  text-decoration: none;
  color: inherit;
  border: 1px solid ${({ theme }) => theme.colors.gray200};

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    border-color: ${({ theme }) => theme.colors.primary}40;
  }

  h3 {
    font-size: 1.25rem;
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: ${({ theme }) => theme.colors.primary};
  }

  p {
    color: ${({ theme }) => theme.colors.gray600};
    margin-bottom: 1rem;
    flex-grow: 1;
  }

  svg {
    font-size: 1.5rem;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const OIDC: React.FC = () => {
	const location = useLocation();
	const isIndexRoute = location.pathname === '/oidc';

	if (isIndexRoute) {
		return (
			<OIDCContainer>
				<FlowHeader flowType="oidc" />

				<Grid>
					<FeatureCard to="/oidc/authorization-code">
						<FiCode />
						<h3>Authorization Code</h3>
						<p>
							The most secure OAuth 2.0 flow for web applications. Learn how to implement the
							authorization code flow, including PKCE extension for public clients.
						</p>
					</FeatureCard>

					<FeatureCard to="/oidc/hybrid">
						<FiLayers />
						<h3>Hybrid Flow</h3>
						<p>
							Combines Authorization Code and Implicit flows. Get some tokens directly from the
							authorization endpoint while also receiving an authorization code for back-channel
							exchange.
						</p>
					</FeatureCard>

					<FeatureCard to="/oidc/implicit">
						<FiZap />
						<h3>Implicit Flow</h3>
						<p>
							Legacy OAuth 2.0 flow for single-page applications. Learn when and how to use it,
							though PKCE is now recommended.
						</p>
					</FeatureCard>

					<FeatureCard to="/oidc/client-credentials">
						<FiLock />
						<h3>Client Credentials</h3>
						<p>
							Server-to-server authentication flow. Perfect for API access and machine-to-machine
							communication scenarios.
						</p>
					</FeatureCard>

					<FeatureCard to="/oidc/device-code">
						<FiSmartphone />
						<h3>Device Code</h3>
						<p>
							OAuth 2.0 flow for devices with limited input capabilities. Ideal for smart TVs, IoT
							devices, and command-line tools.
						</p>
					</FeatureCard>

					<FeatureCard to="/token-management">
						<FiKey />
						<h3>Token Management</h3>
						<p>
							View and manage your access tokens, refresh tokens, and JWTs with detailed inspection
							and analysis tools.
						</p>
					</FeatureCard>
				</Grid>

				<div
					style={{
						marginTop: '2rem',
						padding: '1.5rem',
						backgroundColor: '#f8fafc',
						borderRadius: '0.5rem',
						border: '1px solid #e2e8f0',
					}}
				>
					<h3 style={{ marginBottom: '1rem', color: '#1e293b' }}>What is OpenID Connect?</h3>
					<p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '1rem' }}>
						OpenID Connect (OIDC) is a simple identity layer on top of the OAuth 2.0 protocol. It
						allows clients to verify the identity of end-users based on authentication performed by
						an authorization server.
					</p>
					<a
						href="https://openid.net/connect/"
						target="_blank"
						rel="noopener noreferrer"
						style={{
							color: '#3b82f6',
							textDecoration: 'none',
							fontWeight: '500',
							display: 'inline-flex',
							alignItems: 'center',
							gap: '0.5rem',
						}}
					>
						Learn more about OpenID Connect
						<FiExternalLink size={16} />
					</a>
				</div>
			</OIDCContainer>
		);
	}

	return (
		<div>
			<Outlet />
		</div>
	);
};

export default OIDC;
