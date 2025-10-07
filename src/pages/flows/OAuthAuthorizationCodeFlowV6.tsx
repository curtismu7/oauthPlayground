import React, { useMemo } from 'react';
import PageLayoutService from '../../services/pageLayoutService';
import FlowStepLayoutService from '../../services/flowStepLayoutService';
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
import { FlowHeader } from '../../services/flowHeaderService';

const STEP_METADATA = [
	{
		id: 'introduction',
		title: 'Step 0: Introduction & Setup',
		subtitle: 'Understand the Authorization Code Flow rebuild goals',
		description:
			'Welcome to the V6 rebuild. This step will surface flow context, prerequisites, and configuration guidance before you start.',
	},
	{
		id: 'pkce',
		title: 'Step 1: PKCE Parameters',
		subtitle: 'Generate secure verifier and challenge values',
		description:
			'PKCE protects Authorization Code flows against interception attacks. The dedicated services will render educational content, generation UI, and validation.',
	},
	{
		id: 'authorization-request',
		title: 'Step 2: Authorization Request',
		subtitle: 'Build and launch the PingOne authorization URL',
		description:
			'This step will orchestrate the enhanced response mode selector, authorization URL builder, and parameter deep dives.',
	},
	{
		id: 'authorization-response',
		title: 'Step 3: Authorization Response',
		subtitle: 'Process the returned authorization code and state',
		description:
			'Service placeholders ensure we can integrate secure state validation, error handling, and UI messaging.',
	},
	{
		id: 'token-exchange',
		title: 'Step 4: Token Exchange',
		subtitle: 'Exchange the authorization code for tokens',
		description:
			'Token exchange services, enhanced API displays, and ID token validation will plug into this container.',
	},
	{
		id: 'introspection',
		title: 'Step 5: Token Introspection & UserInfo',
		subtitle: 'Inspect issued tokens and retrieve user information',
		description:
			'Integrate token introspection, OIDC UserInfo, and session-aware UI inside this step layout.',
	},
	{
		id: 'security',
		title: 'Step 6: Security & Session Management',
		subtitle: 'Showcase logout, session monitoring, and advanced features',
		description:
			'Security services (session management, certificate generation, enhanced controls) will mount here.',
	},
	{
		id: 'summary',
		title: 'Step 7: Flow Summary & Next Actions',
		subtitle: 'Review flow completion, logs, and recommended follow-ups',
		description:
			'Provides flow completion summary, analytics hooks, and links to adjacent flows or documentation.',
	},
];

type StepMetadata = (typeof STEP_METADATA)[number];

const OAuthAuthorizationCodeFlowV6: React.FC = () => {
	const pageLayout = useMemo(
		() =>
			PageLayoutService.createPageLayout({
				flowType: 'oauth',
				theme: 'blue',
				maxWidth: '72rem',
				showHeader: false,
				showFooter: false,
			}),
		[],
	);

	const stepLayout = useMemo(
		() =>
			FlowStepLayoutService.createStepLayout({
				flowType: 'oauth',
				theme: 'blue',
			}),
		[],
	);

	const {
		PageContainer,
		ContentWrapper,
		MainCard,
		Spacing,
	} = pageLayout;

	const {
		StepContainer,
		StepHeader,
		StepHeaderLeft,
		VersionBadge,
		StepHeaderTitle,
		StepHeaderSubtitle,
		StepContent,
		StepNavigation,
		PrimaryButton,
		SecondaryButton,
		StepProgress,
	} = stepLayout;

	return (
		<PageContainer>
			<ContentWrapper>
				<FlowHeader
					flowType="oauth"
					customConfig={{
						title: 'Authorization Code Flow (V6)',
						subtitle:
							'Rebuilt from the ground up with services architecture, resilient UX, and comprehensive OAuth/OIDC coverage.',
						icon: '🚀',
						version: 'V6',
					}}
				/>
				<Spacing $size="sm" />
				<MainCard>
					{STEP_METADATA.map((step, index) => (
						<StepSection
							key={step.id}
							index={index}
							step={step}
							stepCount={STEP_METADATA.length}
							components={{
								StepContainer,
								StepHeader,
								StepHeaderLeft,
								VersionBadge,
								StepHeaderTitle,
								StepHeaderSubtitle,
								StepContent,
								StepNavigation,
								PrimaryButton,
								SecondaryButton,
								StepProgress,
							}}
						/>
					))}
				</MainCard>
			</ContentWrapper>
		</PageContainer>
	);
};

interface StepSectionProps {
	index: number;
	stepCount: number;
	step: StepMetadata;
	components: {
		StepContainer: ReturnType<typeof FlowStepLayoutService.createStepLayout>['StepContainer'];
		StepHeader: ReturnType<typeof FlowStepLayoutService.createStepLayout>['StepHeader'];
		StepHeaderLeft: ReturnType<typeof FlowStepLayoutService.createStepLayout>['StepHeaderLeft'];
		VersionBadge: ReturnType<typeof FlowStepLayoutService.createStepLayout>['VersionBadge'];
		StepHeaderTitle: ReturnType<typeof FlowStepLayoutService.createStepLayout>['StepHeaderTitle'];
		StepHeaderSubtitle: ReturnType<typeof FlowStepLayoutService.createStepLayout>['StepHeaderSubtitle'];
		StepContent: ReturnType<typeof FlowStepLayoutService.createStepLayout>['StepContent'];
		StepNavigation: ReturnType<typeof FlowStepLayoutService.createStepLayout>['StepNavigation'];
		PrimaryButton: ReturnType<typeof FlowStepLayoutService.createStepLayout>['PrimaryButton'];
		SecondaryButton: ReturnType<typeof FlowStepLayoutService.createStepLayout>['SecondaryButton'];
		StepProgress: ReturnType<typeof FlowStepLayoutService.createStepLayout>['StepProgress'];
	};
}

const StepSection: React.FC<StepSectionProps> = ({ index, stepCount, step, components }) => {
	const {
		StepContainer,
		StepHeader,
		StepHeaderLeft,
		VersionBadge,
		StepHeaderTitle,
		StepHeaderSubtitle,
		StepContent,
		StepNavigation,
		PrimaryButton,
		SecondaryButton,
		StepProgress,
	} = components;

	return (
		<StepContainer>
			<StepHeader>
				<StepHeaderLeft>
					<VersionBadge>V6</VersionBadge>
					<StepHeaderTitle>{step.title}</StepHeaderTitle>
					<StepHeaderSubtitle>{step.subtitle}</StepHeaderSubtitle>
				</StepHeaderLeft>
				<StepProgress>
					Step {index + 1} of {stepCount}
				</StepProgress>
			</StepHeader>
			<StepContent>
				<CollapsibleHeader
					title="Service integration in progress"
					subtitle="Planned components will mount here as the V6 rebuild proceeds."
					defaultCollapsed={false}
				>
					<p>{step.description}</p>
					<p>
						<span role="img" aria-label="roadmap">
							🛠️
						</span>{' '}
						This scaffold ensures layout, collapsible sections, and navigation are ready for service wiring.
					</p>
				</CollapsibleHeader>
			</StepContent>
			<StepNavigation>
				<SecondaryButton type="button" disabled>
					Back
				</SecondaryButton>
				<PrimaryButton type="button" disabled>
					Next
				</PrimaryButton>
			</StepNavigation>
		</StepContainer>
	);
};

export default OAuthAuthorizationCodeFlowV6;
