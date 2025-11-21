// src/components/ResponseModeSandbox.tsx
/**
 * response_mode Sandbox
 * Visualizes how authorization responses travel for query, fragment, form_post, and PingOne redirectless
 */

import React, { useMemo, useState } from 'react';
import { FiActivity, FiGitBranch, FiInfo, FiNavigation, FiShare2 } from 'react-icons/fi';
import styled from 'styled-components';

type ResponseMode = 'query' | 'fragment' | 'form_post' | 'pi.flow';

interface TimelineStep {
	actor: 'browser' | 'authorizationServer' | 'application' | 'pingone';
	message: string;
	securityNote?: string;
}

interface ResponseModeDefinition {
	id: ResponseMode;
	title: string;
	tagline: string;
	bestFor: string[];
	payloadVisibleIn: string;
	attackWindow: string;
	notes: string[];
	timeline: TimelineStep[];
	pingoneSupport: 'full' | 'partial' | 'unsupported';
	sampleResponse: Record<string, string>;
}

const MODE_LIBRARY: Record<ResponseMode, ResponseModeDefinition> = {
	query: {
		id: 'query',
		title: 'response_mode=query',
		tagline: 'Authorization code arrives on the query string (?code=)',
		bestFor: ['Backend web apps', 'Confidential clients with HTTPS callback'],
		payloadVisibleIn: 'Browser history, network tab, server logs (if not trimmed)',
		attackWindow: 'Medium if HTTPS enforced; watch for open redirect vulnerabilities.',
		notes: [
			'✅ Works with Authorization Code and PKCE flows.',
			'🚫 Do not use with implicit token responses (exposes tokens).',
			'🧾 Sanitize server logs so codes do not linger in plaintext.',
		],
		timeline: [
			{
				actor: 'browser',
				message: 'Browser redirect receives /callback?code=abc123&state=xyz',
			},
			{
				actor: 'application',
				message: 'App validates state, extracts authorization code.',
			},
			{
				actor: 'application',
				message: 'Server exchanges code for tokens via POST /token.',
			},
			{
				actor: 'application',
				message: 'Tokens stored server-side; browser sets session cookie.',
				securityNote: 'Never forward tokens back to browser via query string.',
			},
		],
		pingoneSupport: 'full',
		sampleResponse: {
			code: 'r1Kopw...bS9z',
			state: 'state_168d9d',
		},
	},
	fragment: {
		id: 'fragment',
		title: 'response_mode=fragment',
		tagline: 'Access token appended after #fragment in redirect URL',
		bestFor: ['Legacy SPAs (deprecated)', 'Implicit flow (not recommended)'],
		payloadVisibleIn: 'Browser address bar (after #), front-end JavaScript',
		attackWindow: 'High. Tokens exposed to XSS, extensions, history snapshots.',
		notes: [
			'⚠️ Deprecated for production apps. Use Authorization Code + PKCE instead.',
			'🚫 Tokens never reach server unless manually forwarded.',
			'🧯 Hard to rotate tokens; refresh tokens forbidden in this mode.',
		],
		timeline: [
			{
				actor: 'browser',
				message: 'Browser receives /callback#access_token=abc&token_type=Bearer',
			},
			{
				actor: 'application',
				message: 'SPA JavaScript parses location.hash for tokens.',
				securityNote: 'Any XSS vulnerability can steal tokens instantly.',
			},
			{
				actor: 'application',
				message: 'SPA stores tokens in memory/storage and calls APIs directly.',
			},
			{
				actor: 'application',
				message: 'Token refresh handled via hidden iframe or silent renew (hacky).',
			},
		],
		pingoneSupport: 'partial',
		sampleResponse: {
			access_token: 'ya29.a0ARrdaM...',
			token_type: 'Bearer',
			expires_in: '3600',
			state: 'spa_state_92',
		},
	},
	form_post: {
		id: 'form_post',
		title: 'response_mode=form_post',
		tagline: 'Authorization server posts a hidden form back to your callback URL',
		bestFor: ['Confidential web apps', 'OIDC authentication with large responses'],
		payloadVisibleIn: 'HTTPS POST body (server only), browser memory until form submits',
		attackWindow: 'Low if CSRF state check enforced. Resilient to URL logging.',
		notes: [
			'✅ Ideal when returning large ID Tokens or signed request objects.',
			'🛡️ Reduces leakage because query params never hit browser history.',
			'🧪 Ensure callback can handle POST and validate anti-CSRF state.',
		],
		timeline: [
			{
				actor: 'authorizationServer',
				message: 'PingOne renders auto-submitting HTML form with code + state.',
			},
			{
				actor: 'browser',
				message: 'Browser auto-posts form to https://app.com/callback (POST).',
			},
			{
				actor: 'application',
				message: 'Server receives body fields code, state, id_token (if requested).',
			},
			{
				actor: 'application',
				message: 'App exchanges code for tokens or processes ID token directly.',
			},
		],
		pingoneSupport: 'full',
		sampleResponse: {
			code: 'dAj392...',
			state: 'form_state_01',
			id_token: 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9...',
		},
	},
	'pi.flow': {
		id: 'pi.flow',
		title: 'response_mode=pi.flow',
		tagline: 'PingOne redirectless authentication (JSON payload)',
		bestFor: ['PingOne redirectless SPA flows', 'Embedded login experiences'],
		payloadVisibleIn: 'XHR / fetch response body; never leaves auth.pingone.com',
		attackWindow: 'Low when resume URL handled correctly. Requires secure storage of resume data.',
		notes: [
			'✅ Redirectless: PingOne returns JSON with resumeUrl + code back to SPA.',
			'🔁 Your app must POST to resume endpoint to finalize tokens.',
			'🛡️ State, nonce, PKCE still mandatory. Store resume values securely.',
		],
		timeline: [
			{
				actor: 'pingone',
				message: 'PingOne returns JSON { resumeUrl, code, flowId } to SPA.',
			},
			{
				actor: 'application',
				message: 'SPA stores resume payload and calls RedirectlessAuthService.finalize().',
			},
			{
				actor: 'pingone',
				message: 'Resume endpoint exchanges code for tokens server-side.',
				securityNote: 'Use worker token or backend to complete the resume call.',
			},
			{
				actor: 'application',
				message: 'SPA receives tokens via secure channel (postMessage or fetch).',
			},
		],
		pingoneSupport: 'full',
		sampleResponse: {
			code: 'Oxt5Rk...0Y',
			resumeUrl: 'https://auth.pingone.com/{envId}/as/resume?flowId=...&resume=true&code=Oxt5Rk',
			state: 'redirectless_state_88',
		},
	},
};

const SandboxContainer = styled.div`
	background: linear-gradient(135deg, #ecfeff 0%, #e0e7ff 100%);
	border-radius: 1rem;
	padding: 2rem;
	border: 2px solid #0ea5e9;
	box-shadow: 0 12px 28px rgba(14, 165, 233, 0.2);
`;

const Header = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	margin-bottom: 1.5rem;
`;

const Title = styled.h2`
	margin: 0;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	color: #0f172a;
	font-size: 1.75rem;
`;

const Intro = styled.p`
	margin: 0;
	color: #1f2937;
	line-height: 1.6;
	font-size: 1.05rem;
`;

const ModeGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 1rem;
	margin-bottom: 1.5rem;
`;

const ModeCard = styled.button<{ $selected: boolean }>`
	text-align: left;
	padding: 1.25rem;
	border-radius: 0.75rem;
	border: 2px solid ${({ $selected }) => ($selected ? '#0ea5e9' : '#cbd5f5')};
	background: ${({ $selected }) =>
		$selected
			? 'linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(59, 130, 246, 0.2))'
			: '#ffffff'};
	box-shadow: ${({ $selected }) =>
		$selected ? '0 8px 20px rgba(14, 165, 233, 0.25)' : '0 2px 6px rgba(15, 23, 42, 0.05)'};
	cursor: pointer;
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	transition: all 0.2s;

	&:hover {
		transform: translateY(-3px);
	}
`;

const ModeTitle = styled.div`
	font-weight: 700;
	color: #0f172a;
	font-size: 1.05rem;
`;

const ModeTagline = styled.div`
	color: #334155;
	font-size: 0.9rem;
	line-height: 1.5;
`;

const DetailLayout = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
	gap: 1.5rem;

	@media (max-width: 1024px) {
		grid-template-columns: 1fr;
	}
`;

const TimelineCard = styled.div`
	background: #ffffff;
	border-radius: 0.75rem;
	padding: 1.5rem;
	border: 1px solid #bae6fd;
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const TimelineHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: #0369a1;
	font-weight: 700;
	font-size: 1.1rem;
`;

const TimelineList = styled.ol`
	margin: 0;
	padding-left: 1rem;
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const TimelineItem = styled.li`
	color: #0f172a;
	font-size: 0.95rem;
	line-height: 1.6;
	list-style: none;
	position: relative;
	padding-left: 1.5rem;

	&::before {
		content: '•';
		position: absolute;
		left: 0;
		color: #0ea5e9;
		font-size: 1.5rem;
		line-height: 1;
		top: -0.15rem;
	}
`;

const TimelineActor = styled.span<{ $actor: TimelineStep['actor'] }>`
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	font-weight: 600;
	color: ${({ $actor }) => {
		switch ($actor) {
			case 'browser':
				return '#2563eb';
			case 'authorizationServer':
				return '#10b981';
			case 'application':
				return '#f97316';
			case 'pingone':
				return '#2563eb';
			default:
				return '#0f172a';
		}
	}};
`;

const SecurityNote = styled.div`
	margin-top: 0.35rem;
	padding: 0.5rem 0.75rem;
	background: rgba(239, 68, 68, 0.12);
	border-left: 4px solid #ef4444;
	color: #991b1b;
	font-size: 0.85rem;
	border-radius: 0.35rem;
`;

const MetaCard = styled.div`
	background: #ffffff;
	border-radius: 0.75rem;
	border: 1px solid #dbeafe;
	padding: 1.5rem;
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const MetaRow = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
	color: #0f172a;
`;

const MetaLabel = styled.div`
	font-weight: 700;
	min-width: 150px;
`;

const MetaValue = styled.div`
	color: #334155;
	line-height: 1.6;
`;

const TagList = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
`;

const Tag = styled.span`
	padding: 0.35rem 0.75rem;
	background: rgba(14, 165, 233, 0.12);
	color: #0369a1;
	border-radius: 999px;
	font-weight: 600;
`;

const SampleBox = styled.div`
	background: #0f172a;
	color: #f1f5f9;
	font-family: 'Monaco', 'Menlo', monospace;
	border-radius: 0.75rem;
	padding: 1rem;
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const SampleRow = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
`;

const SampleLabel = styled.span`
	color: #38bdf8;
	font-size: 0.85rem;
`;

const SampleValue = styled.span`
	word-break: break-all;
`;

const SupportBadge = styled.span<{ $support: ResponseModeDefinition['pingoneSupport'] }>`
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	font-weight: 600;
	padding: 0.5rem 0.75rem;
	border-radius: 999px;
	background: ${({ $support }) => {
		switch ($support) {
			case 'full':
				return 'rgba(16, 185, 129, 0.12)';
			case 'partial':
				return 'rgba(245, 158, 11, 0.12)';
			default:
				return 'rgba(239, 68, 68, 0.12)';
		}
	}};
	color: ${({ $support }) => {
		switch ($support) {
			case 'full':
				return '#047857';
			case 'partial':
				return '#b45309';
			default:
				return '#b91c1c';
		}
	}};
`;

const ResponseModeSandbox: React.FC = () => {
	const [mode, setMode] = useState<ResponseMode>('query');

	const definition = MODE_LIBRARY[mode];

	const riskSummary = useMemo(() => {
		if (mode === 'fragment') return '🚫 High exposure — avoid for new builds.';
		if (mode === 'query') return '⚠️ Protect logs and enforce HTTPS everywhere.';
		if (mode === 'form_post') return '🛡️ Strong choice when returning large payloads.';
		return '🔐 Secure when resume handler stored safely and PKCE enforced.';
	}, [mode]);

	return (
		<SandboxContainer>
			<Header>
				<Title>
					<FiShare2 size={28} />
					response_mode Sandbox
				</Title>
				<Intro>
					Visualize how authorization responses move between browser, application, and PingOne
					services. Pick a mode to see transport mechanics, data exposure, and when to use each
					strategy.
				</Intro>
			</Header>

			<ModeGrid>
				{(Object.values(MODE_LIBRARY) as ResponseModeDefinition[]).map((item) => (
					<ModeCard
						key={item.id}
						type="button"
						$selected={item.id === mode}
						onClick={() => setMode(item.id)}
					>
						<ModeTitle>{item.title}</ModeTitle>
						<ModeTagline>{item.tagline}</ModeTagline>
						<SupportBadge $support={item.pingoneSupport}>
							<FiInfo size={16} />
							PingOne {item.pingoneSupport === 'full' ? 'Supported' : 'Partial'}
						</SupportBadge>
					</ModeCard>
				))}
			</ModeGrid>

			<DetailLayout>
				<TimelineCard>
					<TimelineHeader>
						<FiGitBranch />
						Request Timeline
					</TimelineHeader>
					<TimelineList>
						{definition.timeline.map((step, index) => (
							<TimelineItem key={`${step.actor}-${index}`}>
								<TimelineActor $actor={step.actor}>
									{step.actor === 'browser' && <FiNavigation size={16} />}
									{step.actor === 'authorizationServer' && <FiShare2 size={16} />}
									{step.actor === 'application' && <FiActivity size={16} />}
									{step.actor === 'pingone' && <FiInfo size={16} />}
									{step.actor}
								</TimelineActor>
								{' – '}
								{step.message}
								{step.securityNote ? <SecurityNote>{step.securityNote}</SecurityNote> : null}
							</TimelineItem>
						))}
					</TimelineList>
				</TimelineCard>

				<MetaCard>
					<MetaRow>
						<MetaLabel>Best for</MetaLabel>
						<MetaValue>
							<TagList>
								{definition.bestFor.map((item) => (
									<Tag key={item}>{item}</Tag>
								))}
							</TagList>
						</MetaValue>
					</MetaRow>

					<MetaRow>
						<MetaLabel>Data exposure</MetaLabel>
						<MetaValue>{definition.payloadVisibleIn}</MetaValue>
					</MetaRow>

					<MetaRow>
						<MetaLabel>Threat profile</MetaLabel>
						<MetaValue>{definition.attackWindow}</MetaValue>
					</MetaRow>

					<MetaRow>
						<MetaLabel>Guidance</MetaLabel>
						<MetaValue>
							<ul>
								{definition.notes.map((note) => (
									<li key={note}>{note}</li>
								))}
							</ul>
						</MetaValue>
					</MetaRow>

					<MetaRow>
						<MetaLabel>Risk snapshot</MetaLabel>
						<MetaValue>{riskSummary}</MetaValue>
					</MetaRow>

					<MetaRow>
						<MetaLabel>Sample payload</MetaLabel>
						<MetaValue>
							<SampleBox>
								{Object.entries(definition.sampleResponse).map(([key, value]) => (
									<SampleRow key={key}>
										<SampleLabel>{key}</SampleLabel>
										<SampleValue>{value}</SampleValue>
									</SampleRow>
								))}
							</SampleBox>
						</MetaValue>
					</MetaRow>
				</MetaCard>
			</DetailLayout>
		</SandboxContainer>
	);
};

export default ResponseModeSandbox;
