// src/examples/FlowInfoIntegrationExample.tsx - Example of integrating FlowInfoService into V5 flows

import React from 'react';
import styled from 'styled-components';
import EnhancedFlowInfoCard from '../components/EnhancedFlowInfoCard';
import { useFlowInfo } from '../hooks/useFlowInfo';

// Example of how to integrate the new FlowInfoService into existing V5 flows
const FlowInfoIntegrationExample: React.FC = () => {
	// Example 1: Basic integration (replaces existing FlowInfoCard)
	const basicExample = (
		<div>
			{/* Before: Using old FlowInfoCard */}
			{/* <FlowInfoCard flowInfo={getFlowInfo('oauth-authorization-code')!} /> */}

			{/* After: Using new EnhancedFlowInfoCard */}
			<EnhancedFlowInfoCard flowType="oauth-authorization-code" />
		</div>
	);

	// Example 2: Advanced integration with custom options
	const advancedExample = (
		<div>
			<EnhancedFlowInfoCard
				flowType="oidc-authorization-code"
				showAdditionalInfo={true}
				showDocumentation={true}
				showCommonIssues={true}
				showImplementationNotes={true}
			/>
		</div>
	);

	// Example 3: Using the hook for custom implementations
	const CustomFlowInfoDisplay: React.FC<{ flowType: string }> = ({ flowType }) => {
		const {
			flowInfo,
			flowInfoCard,
			relatedFlows,
			commonIssues,
			implementationNotes,
			documentationLinks,
		} = useFlowInfo(flowType, {
			showAdditionalInfo: true,
			showDocumentation: true,
			showCommonIssues: true,
			showImplementationNotes: true,
		});

		if (!flowInfo) return <div>Flow not found</div>;

		return (
			<div>
				<h2>{flowInfo.flowName}</h2>
				<p>
					<strong>Purpose:</strong> {flowInfo.purpose}
				</p>
				<p>
					<strong>Tokens:</strong> {flowInfo.tokensReturned}
				</p>
				<p>
					<strong>Security Level:</strong> {flowInfo.securityLevel}
				</p>
				<p>
					<strong>Complexity:</strong> {flowInfo.complexity}
				</p>

				{relatedFlows.length > 0 && (
					<div>
						<h3>Related Flows:</h3>
						<ul>
							{relatedFlows.map((flow) => (
								<li key={flow}>{flow}</li>
							))}
						</ul>
					</div>
				)}

				{commonIssues.length > 0 && (
					<div>
						<h3>Common Issues:</h3>
						{commonIssues.map((issue, index) => (
							<div key={index}>
								<strong>Issue:</strong> {issue.issue}
								<br />
								<strong>Solution:</strong> {issue.solution}
							</div>
						))}
					</div>
				)}
			</div>
		);
	};

	// Example 4: Integration in a V5 flow component
	const V5FlowExample: React.FC = () => {
		return (
			<div>
				{/* Flow header */}
				<div>
					<h1>OAuth 2.0 Authorization Code Flow V5</h1>
					<p>Experience the full OAuth Authorization Code Flow with PKCE support</p>
				</div>

				{/* Enhanced flow information card */}
				<EnhancedFlowInfoCard
					flowType="oauth-authorization-code"
					showAdditionalInfo={true}
					showDocumentation={true}
					showCommonIssues={false}
					showImplementationNotes={false}
				/>

				{/* Rest of the flow implementation */}
				<div>{/* Step content, forms, etc. */}</div>
			</div>
		);
	};

	return (
		<div>
			<h1>FlowInfoService Integration Examples</h1>

			<section>
				<h2>Basic Integration</h2>
				{basicExample}
			</section>

			<section>
				<h2>Advanced Integration</h2>
				{advancedExample}
			</section>

			<section>
				<h2>Custom Implementation with Hook</h2>
				<CustomFlowInfoDisplay flowType="client-credentials" />
			</section>

			<section>
				<h2>V5 Flow Integration</h2>
				<V5FlowExample />
			</section>
		</div>
	);
};

export default FlowInfoIntegrationExample;
