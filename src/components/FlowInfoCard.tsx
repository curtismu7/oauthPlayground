// src/components/FlowInfoCard.tsx - Reusable flow information comparison card

import React, { useState } from 'react';
import styled from 'styled-components';
import { FiChevronDown } from 'react-icons/fi';

const CardContainer = styled.div`
	background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
	border-radius: 12px;
	margin-bottom: 2rem;
	box-shadow: 0 4px 6px rgba(255, 107, 53, 0.1);
	overflow: hidden;
`;

const CardHeaderButton = styled.button`
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: transparent;
	border: none;
	padding: 1.5rem;
	cursor: pointer;
	transition: background 0.2s ease;

	&:hover {
		background: rgba(255, 255, 255, 0.1);
	}
`;

const CardHeaderContent = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
`;

const CardHeader = styled.div`
	display: inline-block;
	background: white;
	color: #ff6b35;
	padding: 0.5rem 1rem;
	border-radius: 20px;
	font-weight: 600;
	font-size: 0.875rem;
`;

const ToggleIcon = styled.div<{ $isOpen: boolean }>`
	width: 32px;
	height: 32px;
	border-radius: 50%;
	background: #3b82f6;
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	transition: transform 0.2s ease;
	transform: ${({ $isOpen }) => ($isOpen ? 'rotate(180deg)' : 'rotate(0deg)')};
	flex-shrink: 0;
`;

const CardContent = styled.div<{ $isOpen: boolean }>`
	max-height: ${({ $isOpen }) => ($isOpen ? '2000px' : '0')};
	overflow: hidden;
	transition: max-height 0.3s ease;
	padding: ${({ $isOpen }) => ($isOpen ? '0 1.5rem 1.5rem 1.5rem' : '0 1.5rem')};
`;

const InfoGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
	gap: 1rem;
	margin-top: 1rem;
`;

const InfoSection = styled.div`
	background: rgba(255, 255, 255, 0.95);
	border-radius: 8px;
	padding: 1rem;
`;

const SectionTitle = styled.div`
	font-weight: 600;
	font-size: 0.75rem;
	text-transform: uppercase;
	color: #ff6b35;
	margin-bottom: 0.5rem;
	letter-spacing: 0.05em;
`;

const SectionContent = styled.div`
	color: #1f2937;
	font-size: 0.875rem;
	line-height: 1.5;
`;

export interface FlowInfo {
	flowType: 'oauth' | 'oidc';
	flowName: string;
	tokensReturned: string;
	purpose: string;
	specLayer: string;
	nonceRequirement: string;
	validation: string;
	securityNotes?: string[];
	useCases?: string[];
}

interface FlowInfoCardProps {
	flowInfo: FlowInfo;
}

const FlowInfoCard: React.FC<FlowInfoCardProps> = ({ flowInfo }) => {
	const [isOpen, setIsOpen] = useState(true);

	return (
		<CardContainer>
			<CardHeaderButton onClick={() => setIsOpen(!isOpen)}>
				<CardHeaderContent>
					<CardHeader>
						{flowInfo.flowType === 'oauth' ? 'OAuth 2.0' : 'OIDC'} {flowInfo.flowName}
					</CardHeader>
				</CardHeaderContent>
				<ToggleIcon $isOpen={isOpen}>
					<FiChevronDown size={18} />
				</ToggleIcon>
			</CardHeaderButton>

			<CardContent $isOpen={isOpen}>
				<InfoGrid>
				<InfoSection>
					<SectionTitle>Tokens Returned</SectionTitle>
					<SectionContent>{flowInfo.tokensReturned}</SectionContent>
				</InfoSection>

				<InfoSection>
					<SectionTitle>Purpose</SectionTitle>
					<SectionContent>{flowInfo.purpose}</SectionContent>
				</InfoSection>

				<InfoSection>
					<SectionTitle>Spec Layer</SectionTitle>
					<SectionContent>{flowInfo.specLayer}</SectionContent>
				</InfoSection>

				<InfoSection>
					<SectionTitle>Nonce Requirement</SectionTitle>
					<SectionContent>{flowInfo.nonceRequirement}</SectionContent>
				</InfoSection>

				<InfoSection style={{ gridColumn: 'span 2' }}>
					<SectionTitle>Validation</SectionTitle>
					<SectionContent>{flowInfo.validation}</SectionContent>
				</InfoSection>

				{flowInfo.securityNotes && flowInfo.securityNotes.length > 0 && (
					<InfoSection style={{ gridColumn: '1 / -1' }}>
						<SectionTitle>⚠️ Security Notes</SectionTitle>
						<SectionContent>
							<ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
								{flowInfo.securityNotes.map((note, index) => (
									<li key={index} style={{ marginBottom: '0.25rem' }}>
										{note}
									</li>
								))}
							</ul>
						</SectionContent>
					</InfoSection>
				)}

				{flowInfo.useCases && flowInfo.useCases.length > 0 && (
					<InfoSection style={{ gridColumn: '1 / -1' }}>
						<SectionTitle>✨ Best Use Cases</SectionTitle>
						<SectionContent>
							<ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
								{flowInfo.useCases.map((useCase, index) => (
									<li key={index} style={{ marginBottom: '0.25rem' }}>
										{useCase}
									</li>
								))}
							</ul>
						</SectionContent>
					</InfoSection>
				)}
			</InfoGrid>
			</CardContent>
		</CardContainer>
	);
};

export default FlowInfoCard;
