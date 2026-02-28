import React from 'react';
import { FiArrowLeft, FiKey, FiShield } from '@icons';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { MFANavigationV8 } from '@/v8/components/MFANavigationV8';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import TokenDisplayV8U, { type TokenDisplayV8UProps } from '@/v8u/components/TokenDisplayV8U';

const PageContainer = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
	background: #f9fafb;
	min-height: 100vh;
`;

const Header = styled.div`
	background: linear-gradient(135deg, #0f766e 0%, #115e59 100%);
	color: white;
	padding: 1.75rem 2rem;
	border-radius: 0.75rem;
	margin-bottom: 2rem;
	display: flex;
	flex-direction: column;
	gap: 0.5rem;

	h1 {
		font-size: 1.75rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin: 0;
	}

	p {
		margin: 0;
		font-size: 0.95rem;
		opacity: 0.95;
		max-width: 800px;
	}
`;

const BackButton = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	margin-bottom: 1rem;
	padding: 0.5rem 1rem;
	background: #e5e7eb;
	border-radius: 999px;
	border: none;
	cursor: pointer;
	font-size: 0.875rem;
	color: #374151;
	transition: background 0.2s ease;

	&:hover {
		background: #d1d5db;
	}
`;

const ResetButton = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	margin-left: 0.75rem;
	margin-bottom: 1rem;
	padding: 0.5rem 1rem;
	background: #2563eb;
	border-radius: 999px;
	border: none;
	cursor: pointer;
	font-size: 0.875rem;
	color: #ffffff;
	transition: background 0.2s ease;

	&:hover {
		background: #1d4ed8;
	}
`;

const Card = styled.div`
	background: #ffffff;
	border-radius: 0.75rem;
	padding: 1.5rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const EmptyState = styled.div`
	text-align: center;
	padding: 2rem 1.5rem;
	color: #4b5563;
`;

interface LocationState {
	tokens?: {
		accessToken: string;
		idToken?: string;
		refreshToken?: string;
		expiresIn?: number;
	};
}

const SpiffeSpireTokenDisplayV8U: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const state = (location.state || {}) as LocationState;
	const tokens = state.tokens;

	let normalizedTokens: TokenDisplayV8UProps['tokens'] | null = null;
	if (tokens) {
		normalizedTokens = { accessToken: tokens.accessToken };
		if (tokens.idToken) {
			normalizedTokens.idToken = tokens.idToken;
		}
		if (tokens.refreshToken) {
			normalizedTokens.refreshToken = tokens.refreshToken;
		}
		if (typeof tokens.expiresIn === 'number') {
			normalizedTokens.expiresIn = tokens.expiresIn;
		}
	}

	return (
		<PageContainer>
			<div style={{ display: 'flex', alignItems: 'center' }}>
				<BackButton type="button" onClick={() => navigate('/v8u/spiffe-spire')}>
					<FiArrowLeft size={16} /> Back to SPIFFE/SPIRE Flow
				</BackButton>
				<ResetButton type="button" onClick={() => navigate('/v8u/spiffe-spire')}>
					Reset SPIFFE/SPIRE Flow
				</ResetButton>
			</div>

			<Header>
				<h1>
					<FiShield /> SPIFFE → PingOne Token Viewer
				</h1>
				<p>
					View and explore the OAuth/OIDC tokens issued after exchanging a SPIFFE SVID. Decode JWTs,
					inspect claims, and copy tokens for testing.
				</p>
			</Header>

			{/* Navigation */}
			<MFANavigationV8 currentPage="hub" showRestartFlow={false} showBackToMain={true} />

			{normalizedTokens ? (
				<Card>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '0.5rem',
							marginBottom: '0.75rem',
						}}
					>
						<FiKey size={18} color="#1f2937" />
						<span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1f2937' }}>
							Tokens issued for your SPIFFE-identified workload
						</span>
					</div>
					<p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1rem' }}>
						These tokens are not long-lived secrets baked into your app. They were issued after
						SPIRE attested your workload using its SPIFFE ID and then exchanged the SVID for
						OAuth/OIDC tokens.
					</p>
					<TokenDisplayV8U
						tokens={normalizedTokens}
						showDecodeButtons
						showCopyButtons
						showMaskToggle={false}
					/>
				</Card>
			) : (
				<Card>
					<EmptyState>
						<p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>
							No tokens available to display
						</p>
						<p style={{ marginBottom: '0.75rem', fontSize: '0.9rem' }}>
							Run the SPIFFE/SPIRE flow first to generate tokens. After the token exchange step,
							you'll be sent here automatically with fresh tokens.
						</p>
						<button
							type="button"
							onClick={() => navigate('/v8u/spiffe-spire')}
							style={{
								padding: '0.5rem 1.25rem',
								borderRadius: '999px',
								border: 'none',
								background: '#2563eb',
								color: '#ffffff',
								fontSize: '0.875rem',
								fontWeight: 500,
								cursor: 'pointer',
							}}
						>
							Go to SPIFFE/SPIRE Flow
						</button>
					</EmptyState>
				</Card>
			)}
			{/* Shared bottom-docked API history (same as V8 MFA and SPIFFE/SPIRE lab) */}
			<SuperSimpleApiDisplayV8 />

			{/* Start Over Button at Bottom */}
			<div
				style={{
					display: 'flex',
					justifyContent: 'center',
					marginTop: '3rem',
					marginBottom: '2rem',
				}}
			>
				<button
					type="button"
					onClick={() => navigate('/v8u/spiffe-spire')}
					style={{
						display: 'inline-flex',
						alignItems: 'center',
						gap: '0.5rem',
						padding: '0.75rem 1.5rem',
						background: '#2563eb',
						color: '#ffffff',
						border: 'none',
						borderRadius: '0.5rem',
						fontSize: '0.875rem',
						fontWeight: 500,
						cursor: 'pointer',
						transition: 'background 0.2s ease',
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.background = '#1d4ed8';
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.background = '#2563eb';
					}}
				>
					<FiArrowLeft size={16} />
					Start Over
				</button>
			</div>
		</PageContainer>
	);
};

export default SpiffeSpireTokenDisplayV8U;
