/**
 * @file WorkerTokenVsClientCredentialsEducationModalV8.tsx
 * @module v8/components
 * @description Educational modal explaining Worker Tokens vs Client Credentials in PingOne
 * @version 8.0.0
 * @since 2025-01-XX
 *
 * Features:
 * - Explains the difference between Worker tokens and client_credentials tokens
 * - Clarifies when to use each token type
 * - Explains Management API scopes (singular form: p1:read:user)
 * - Educational content based on official PingOne documentation
 *
 * @example
 * <WorkerTokenVsClientCredentialsEducationModalV8
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   context="client-credentials" // or "worker-token"
 * />
 */

import React from 'react';
import { FiCheckCircle, FiInfo, FiLock, FiShield, FiX, FiXCircle } from 'react-icons/fi';
import styled from 'styled-components';

interface WorkerTokenVsClientCredentialsEducationModalV8Props {
	isOpen: boolean;
	onClose: () => void;
	context?: 'client-credentials' | 'worker-token' | 'general';
}

const Backdrop = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	z-index: 9998;
	backdrop-filter: blur(4px);
`;

const ModalContainer = styled.div`
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	background: white;
	border-radius: 12px;
	box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
	z-index: 9999;
	max-width: 800px;
	width: 90%;
	max-height: 90vh;
	overflow-y: auto;
`;

const ModalHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 24px;
	border-bottom: 1px solid #e5e7eb;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	border-radius: 12px 12px 0 0;
`;

const ModalTitle = styled.h2`
	margin: 0;
	font-size: 24px;
	font-weight: 700;
	display: flex;
	align-items: center;
	gap: 12px;
`;

const CloseButton = styled.button`
	background: rgba(255, 255, 255, 0.2);
	border: none;
	border-radius: 8px;
	padding: 8px;
	cursor: pointer;
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: background 0.2s;

	&:hover {
		background: rgba(255, 255, 255, 0.3);
	}
`;

const ModalBody = styled.div`
	padding: 24px;
`;

const Section = styled.div`
	margin-bottom: 32px;

	&:last-child {
		margin-bottom: 0;
	}
`;

const SectionTitle = styled.h3`
	font-size: 20px;
	font-weight: 700;
	margin: 0 0 16px 0;
	color: #1f2937;
	display: flex;
	align-items: center;
	gap: 8px;
`;

const SectionContent = styled.div`
	color: #4b5563;
	line-height: 1.6;
	font-size: 15px;
`;

const ConceptBox = styled.div`
	background: ${(props: { variant: 'worker' | 'client' }) =>
		props.variant === 'worker' ? '#fef3c7' : '#dbeafe'};
	border: 2px solid ${(props: { variant: 'worker' | 'client' }) =>
		props.variant === 'worker' ? '#fcd34d' : '#3b82f6'};
	border-radius: 8px;
	padding: 20px;
	margin: 16px 0;
`;

const ConceptTitle = styled.h4`
	font-size: 18px;
	font-weight: 700;
	margin: 0 0 12px 0;
	color: #1f2937;
	display: flex;
	align-items: center;
	gap: 8px;
`;

const ConceptList = styled.ul`
	margin: 12px 0;
	padding-left: 24px;
`;

const ConceptItem = styled.li`
	margin: 8px 0;
	color: #374151;
`;

const ComparisonTable = styled.table`
	width: 100%;
	border-collapse: collapse;
	margin: 20px 0;
	font-size: 14px;
`;

const TableHeader = styled.th`
	background: #f3f4f6;
	padding: 12px;
	text-align: left;
	font-weight: 700;
	color: #1f2937;
	border: 1px solid #e5e7eb;
`;

const TableCell = styled.td`
	padding: 12px;
	border: 1px solid #e5e7eb;
	color: #374151;
`;

const TableRow = styled.tr`
	&:nth-child(even) {
		background: #f9fafb;
	}
`;

const WarningBox = styled.div`
	background: #fef2f2;
	border: 2px solid #fca5a5;
	border-radius: 8px;
	padding: 16px;
	margin: 16px 0;
	display: flex;
	align-items: flex-start;
	gap: 12px;
`;

const InfoBox = styled.div`
	background: #eff6ff;
	border: 2px solid #93c5fd;
	border-radius: 8px;
	padding: 16px;
	margin: 16px 0;
	display: flex;
	align-items: flex-start;
	gap: 12px;
`;

const ScopeExample = styled.code`
	background: #f3f4f6;
	padding: 4px 8px;
	border-radius: 4px;
	font-family: 'Monaco', 'Courier New', monospace;
	font-size: 13px;
	color: #dc2626;
`;

const ScopeExampleValue = styled.span`
	color: #2563eb;
`;

export const WorkerTokenVsClientCredentialsEducationModalV8: React.FC<
	WorkerTokenVsClientCredentialsEducationModalV8Props
> = ({ isOpen, onClose, context = 'general' }) => {
	if (!isOpen) return null;

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Escape') onClose();
	};

	return (
		<>
			<Backdrop onClick={onClose} onKeyDown={handleKeyDown} role="button" tabIndex={0} aria-label="Close modal" />
			<ModalContainer onKeyDown={handleKeyDown}>
				<ModalHeader>
					<ModalTitle>
						<FiShield size={28} />
						Worker Tokens vs Client Credentials
					</ModalTitle>
					<CloseButton onClick={onClose} aria-label="Close">
						<FiX size={24} />
					</CloseButton>
				</ModalHeader>

				<ModalBody>
					<Section>
						<SectionTitle>
							<FiInfo size={20} />
							Big Picture: Two Different Service Tokens
						</SectionTitle>
						<SectionContent>
							<p>
								In PingOne, there are <strong>two primary patterns</strong> for service-level tokens:
							</p>
							<ConceptBox variant="worker">
								<ConceptTitle>
									<FiShield size={18} />
									1. Worker Token (PingOne Admin)
								</ConceptTitle>
								<ConceptList>
									<ConceptItem>
										<strong>Represents:</strong> PingOne administrative service account
									</ConceptItem>
									<ConceptItem>
										<strong>Purpose:</strong> PingOne Platform / Management API operations
									</ConceptItem>
									<ConceptItem>
										<strong>Use cases:</strong> Creating applications, managing users, configuring environments
									</ConceptItem>
									<ConceptItem>
										<strong>Conceptually:</strong> "I am PingOne itself (or an admin service), performing management operations"
									</ConceptItem>
								</ConceptList>
							</ConceptBox>

							<ConceptBox variant="client">
								<ConceptTitle>
									<FiLock size={18} />
									2. Client Credentials Token (Standard OAuth)
								</ConceptTitle>
								<ConceptList>
									<ConceptItem>
										<strong>Represents:</strong> The application/service itself
									</ConceptItem>
									<ConceptItem>
										<strong>Purpose:</strong> Machine-to-machine (M2M) calls to custom APIs
									</ConceptItem>
									<ConceptItem>
										<strong>Use cases:</strong> Backend-to-backend calls, microservice communication, custom resource servers
									</ConceptItem>
									<ConceptItem>
										<strong>Conceptually:</strong> "I am this specific application, calling an API I am authorized to use"
									</ConceptItem>
								</ConceptList>
							</ConceptBox>
						</SectionContent>
					</Section>

					<Section>
						<SectionTitle>
							<FiCheckCircle size={20} />
							Comparison Table
						</SectionTitle>
						<ComparisonTable>
							<thead>
								<TableRow>
									<TableHeader>Aspect</TableHeader>
									<TableHeader>Worker Token (PingOne Admin)</TableHeader>
									<TableHeader>Client Credentials Token (Standard OAuth)</TableHeader>
								</TableRow>
							</thead>
							<tbody>
								<TableRow>
									<TableCell>
										<strong>Issued To</strong>
									</TableCell>
									<TableCell>Worker application in PingOne</TableCell>
									<TableCell>Standard OAuth client</TableCell>
								</TableRow>
								<TableRow>
									<TableCell>
										<strong>Grant / Mechanism</strong>
									</TableCell>
									<TableCell>Worker-specific admin token issuance</TableCell>
									<TableCell>
										<code>grant_type=client_credentials</code>
									</TableCell>
								</TableRow>
								<TableRow>
									<TableCell>
										<strong>Represents</strong>
									</TableCell>
									<TableCell>PingOne admin service account</TableCell>
									<TableCell>The application/service itself</TableCell>
								</TableRow>
								<TableRow>
									<TableCell>
										<strong>Typical Use</strong>
									</TableCell>
									<TableCell>PingOne Platform / Management APIs</TableCell>
									<TableCell>Custom APIs, backend services, non-admin resources</TableCell>
								</TableRow>
								<TableRow>
									<TableCell>
										<strong>Example Operations</strong>
									</TableCell>
									<TableCell>Create application, manage users, configure environment</TableCell>
									<TableCell>Call custom resource server endpoints</TableCell>
								</TableRow>
								<TableRow>
									<TableCell>
										<strong>Management API Scopes</strong>
									</TableCell>
									<TableCell>
										Commonly used with <ScopeExample>p1:read:user</ScopeExample>,{' '}
										<ScopeExample>p1:update:user</ScopeExample>
									</TableCell>
									<TableCell>May not be needed; scopes usually tied to custom API resources</TableCell>
								</TableRow>
								<TableRow>
									<TableCell>
										<strong>Privilege Level</strong>
									</TableCell>
									<TableCell>High – environment admin–style powers</TableCell>
									<TableCell>Limited to scopes granted to that OAuth client</TableCell>
								</TableRow>
							</tbody>
						</ComparisonTable>
					</Section>

					<Section>
						<SectionTitle>
							<FiInfo size={20} />
							Management API Scopes: Correct Names
						</SectionTitle>
						<SectionContent>
							<WarningBox>
								<FiXCircle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
								<div>
									<strong>Important: Use Singular Forms</strong>
									<p style={{ margin: '8px 0 0 0' }}>
										For PingOne user management, the canonical platform scopes are <strong>singular</strong>:
									</p>
									<ul style={{ margin: '8px 0', paddingLeft: '24px' }}>
										<li>
											<ScopeExample>p1:read:user</ScopeExample> (✅ Correct)
										</li>
										<li>
											<ScopeExample>p1:update:user</ScopeExample> (✅ Correct)
										</li>
									</ul>
									<p style={{ margin: '8px 0 0 0' }}>
										There is <strong>no official</strong>{' '}
										<ScopeExample>p1:read:users</ScopeExample> or{' '}
										<ScopeExample>p1:update:users</ScopeExample> scope. Any plural forms should be treated as{' '}
										<strong>incorrect or outdated</strong>.
									</p>
								</div>
							</WarningBox>

							<InfoBox>
								<FiInfo size={20} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
								<div>
									<strong>Where These Scopes Live</strong>
									<p style={{ margin: '8px 0 0 0' }}>
										These scopes are defined on the <strong>PingOne API</strong> resource and control what kind of
										operations are allowed against the PingOne Platform / Management APIs for user objects:
									</p>
									<ul style={{ margin: '8px 0', paddingLeft: '24px' }}>
										<li>
											<ScopeExample>p1:read:user</ScopeExample> → read access to user objects
										</li>
										<li>
											<ScopeExample>p1:update:user</ScopeExample> → update access to user objects
										</li>
									</ul>
								</div>
							</InfoBox>
						</SectionContent>
					</Section>

					<Section>
						<SectionTitle>
							<FiCheckCircle size={20} />
							Key Takeaways
						</SectionTitle>
						<SectionContent>
							<ConceptList>
								<ConceptItem>
									<strong>Do not confuse Worker tokens with client_credentials tokens.</strong> Worker tokens are
									specifically for PingOne Admin / Management operations.
								</ConceptItem>
								<ConceptItem>
									<strong>Use singular scopes for user management:</strong>{' '}
									<ScopeExample>p1:read:user</ScopeExample>, <ScopeExample>p1:update:user</ScopeExample>
								</ConceptItem>
								<ConceptItem>
									<strong>In our app:</strong> Use a <strong>Worker token</strong> when teaching PingOne Admin flows
									(e.g., create application, admin-level user management). Use a <strong>client_credentials token</strong>{' '}
									for generic M2M OAuth demonstrations, typically against custom APIs.
								</ConceptItem>
								<ConceptItem>
									<strong>Treat Worker tokens as highly sensitive.</strong> They have powerful rights over the
									environment and must only be used in secure backend contexts.
								</ConceptItem>
							</ConceptList>
						</SectionContent>
					</Section>

					{context === 'client-credentials' && (
						<InfoBox>
							<FiInfo size={20} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
							<div>
								<strong>You're Using Client Credentials Flow</strong>
								<p style={{ margin: '8px 0 0 0' }}>
									This is a <strong>standard OAuth machine-to-machine</strong> flow. It represents your application
									calling APIs it's authorized to use. This is <strong>not</strong> a Worker token and should not be
									used for PingOne Admin operations.
								</p>
							</div>
						</InfoBox>
					)}

					{context === 'worker-token' && (
						<WarningBox>
							<FiShield size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
							<div>
								<strong>You're Using a Worker Token</strong>
								<p style={{ margin: '8px 0 0 0' }}>
									This is a <strong>PingOne Admin service account</strong> token. It has high privileges and should
									only be used for PingOne Platform / Management API operations. Treat this token as highly sensitive.
								</p>
							</div>
						</WarningBox>
					)}
				</ModalBody>
			</ModalContainer>
		</>
	);
};

