import React, { useState } from 'react';
import {
	FiAlertTriangle,
	FiCheckCircle,
	FiChevronDown,
	FiChevronRight,
	FiExternalLink,
	FiHelpCircle,
	FiInfo,
	FiShield,
} from 'react-icons/fi';
import styled from 'styled-components';
import { Card, CardBody } from './Card';

interface HelpContent {
	whenToUse: string;
	prerequisites: string[];
	securityNotes: SecurityNote[];
	commonIssues: CommonIssue[];
	bestPractices: string[];
	relatedFlows: RelatedFlow[];
}

interface SecurityNote {
	type: 'warning' | 'info' | 'success';
	text: string;
}

interface CommonIssue {
	issue: string;
	solution: string;
}

interface RelatedFlow {
	id: string;
	title: string;
	description: string;
	route: string;
}

const HelpContainer = styled.div`
  margin-bottom: 2rem;
`;

const HelpToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background-color: ${({ theme }) => theme.colors.primary}10;
  color: ${({ theme }) => theme.colors.primary};
  border: 1px solid ${({ theme }) => theme.colors.primary}20;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary}20;
  }
  
  .help-icon {
    font-size: 1.25rem;
  }
`;

const HelpPanel = styled.div<{ $isOpen: boolean }>`
  max-height: ${({ $isOpen }) => ($isOpen ? '2000px' : '0')};
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;
  margin-top: 1rem;
`;

const HelpSection = styled.div`
  margin-bottom: 1.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  h4 {
    font-size: 1rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  p {
    color: ${({ theme }) => theme.colors.gray700};
    line-height: 1.6;
    margin-bottom: 0.5rem;
  }
`;

const PrerequisitesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  
  li {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.5rem 0;
    color: ${({ theme }) => theme.colors.gray700};
    
    .check-icon {
      color: ${({ theme }) => theme.colors.success};
      font-size: 1rem;
      margin-top: 0.125rem;
      flex-shrink: 0;
    }
  }
`;

const SecurityNotes = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const SecurityNote = styled.div<{ $type: string }>`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.5;
  
  .note-icon {
    font-size: 1rem;
    margin-top: 0.125rem;
    flex-shrink: 0;
  }
  
  ${({ $type }) => {
		switch ($type) {
			case 'warning':
				return `
          background-color: #fef3c7;
          color: #92400e;
          border: 1px solid #f59e0b;
          
          .note-icon {
            color: #d97706;
          }
        `;
			case 'info':
				return `
          background-color: #dbeafe;
          color: #1e40af;
          border: 1px solid #3b82f6;
          
          .note-icon {
            color: #2563eb;
          }
        `;
			case 'success':
				return `
          background-color: #dcfce7;
          color: #166534;
          border: 1px solid #22c55e;
          
          .note-icon {
            color: #16a34a;
          }
        `;
			default:
				return `
          background-color: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
        `;
		}
	}}
`;

const CommonIssuesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const CommonIssue = styled.div`
  padding: 1rem;
  background-color: ${({ theme }) => theme.colors.gray50};
  border-radius: 0.5rem;
  border-left: 3px solid ${({ theme }) => theme.colors.warning};
  
  .issue-title {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
    margin-bottom: 0.5rem;
  }
  
  .issue-solution {
    color: ${({ theme }) => theme.colors.gray700};
    font-size: 0.875rem;
    line-height: 1.5;
  }
`;

const BestPracticesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  
  li {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.5rem 0;
    color: ${({ theme }) => theme.colors.gray700};
    
    .practice-icon {
      color: ${({ theme }) => theme.colors.primary};
      font-size: 1rem;
      margin-top: 0.125rem;
      flex-shrink: 0;
    }
  }
`;

const RelatedFlowsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const RelatedFlowCard = styled.a`
  display: block;
  padding: 1rem;
  background-color: ${({ theme }) => theme.colors.gray50};
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.5rem;
  text-decoration: none;
  transition: all 0.2s;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background-color: ${({ theme }) => theme.colors.primary}05;
    transform: translateY(-1px);
  }
  
  .related-flow-title {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
    margin-bottom: 0.25rem;
  }
  
  .related-flow-description {
    color: ${({ theme }) => theme.colors.gray600};
    font-size: 0.875rem;
    line-height: 1.4;
  }
`;

const helpContentMap: Record<string, HelpContent> = {
	'authorization-code': {
		whenToUse:
			'Use Authorization Code flow when you have a secure backend that can store client secrets. This is the most secure OAuth flow and is recommended for web applications, mobile apps with backends, and any application that can securely store credentials.',
		prerequisites: [
			'Secure backend server',
			'Ability to store client secret securely',
			'HTTPS for all communications',
			'Proper redirect URI validation',
		],
		securityNotes: [
			{
				type: 'success',
				text: 'This is the most secure OAuth flow when implemented correctly.',
			},
			{
				type: 'warning',
				text: 'Never expose your client secret in client-side code or public repositories.',
			},
			{
				type: 'info',
				text: 'Always validate the state parameter to prevent CSRF attacks.',
			},
		],
		commonIssues: [
			{
				issue: 'Invalid redirect URI error',
				solution:
					'Ensure the redirect URI in your authorization request exactly matches the one registered in your OAuth provider.',
			},
			{
				issue: 'Client secret exposed in frontend',
				solution:
					'Move the token exchange to your backend server. Never include client secrets in client-side code.',
			},
		],
		bestPractices: [
			'Always use HTTPS in production',
			'Implement proper state parameter validation',
			'Store tokens securely on the server',
			'Use short-lived access tokens with refresh tokens',
			'Implement proper error handling and logging',
		],
		relatedFlows: [
			{
				id: 'pkce',
				title: 'PKCE Flow',
				description: 'Enhanced version for public clients',
				route: '/flows/pkce',
			},
			{
				id: 'hybrid',
				title: 'Hybrid Flow',
				description: 'Combines authorization code with implicit',
				route: '/flows/hybrid',
			},
		],
	},
	pkce: {
		whenToUse:
			'Use PKCE (Proof Key for Code Exchange) when you cannot securely store a client secret, such as in mobile apps, SPAs, or any public client application. PKCE adds an extra layer of security to the Authorization Code flow.',
		prerequisites: [
			'Public client application (cannot store secrets)',
			'Support for PKCE in your OAuth provider',
			'Ability to generate cryptographically random strings',
			'HTTPS for all communications',
		],
		securityNotes: [
			{
				type: 'success',
				text: 'PKCE provides excellent security for public clients without requiring client secrets.',
			},
			{
				type: 'info',
				text: 'Use SHA256 for code challenge method for best security.',
			},
			{
				type: 'warning',
				text: 'Generate code verifiers with sufficient entropy (at least 43 characters).',
			},
		],
		commonIssues: [
			{
				issue: 'Code challenge mismatch',
				solution:
					'Ensure the code verifier used in token exchange matches the one used to generate the code challenge.',
			},
			{
				issue: 'PKCE not supported by provider',
				solution:
					'Check if your OAuth provider supports PKCE. Some older implementations may not support it.',
			},
		],
		bestPractices: [
			'Generate code verifiers with at least 43 characters',
			'Use SHA256 for code challenge method',
			'Store code verifier securely during the flow',
			'Implement proper error handling',
			'Use HTTPS for all communications',
		],
		relatedFlows: [
			{
				id: 'authorization-code',
				title: 'Authorization Code Flow',
				description: 'Base flow that PKCE enhances',
				route: '/flows/authorization-code',
			},
			{
				id: 'implicit',
				title: 'Implicit Grant Flow',
				description: 'Alternative for public clients (deprecated)',
				route: '/flows/implicit',
			},
		],
	},
	'client-credentials': {
		whenToUse:
			'Use Client Credentials flow for machine-to-machine authentication where no user interaction is required. This is perfect for server-to-server communication, background processes, and API services.',
		prerequisites: [
			'Machine-to-machine communication',
			'No user interaction required',
			'Secure storage of client credentials',
			'HTTPS for all communications',
		],
		securityNotes: [
			{
				type: 'success',
				text: 'This flow is ideal for secure machine-to-machine authentication.',
			},
			{
				type: 'warning',
				text: 'Never expose client credentials in logs or error messages.',
			},
			{
				type: 'info',
				text: 'Use appropriate scopes to limit access to only what is needed.',
			},
		],
		commonIssues: [
			{
				issue: 'Invalid client credentials',
				solution:
					'Verify your client ID and client secret are correct and properly encoded in the Authorization header.',
			},
			{
				issue: 'Insufficient scope permissions',
				solution:
					'Check that your application has the necessary scopes configured in your OAuth provider.',
			},
		],
		bestPractices: [
			'Use Basic Authentication for client credentials',
			'Implement proper credential rotation',
			'Use minimal required scopes',
			'Monitor and log authentication attempts',
			'Implement rate limiting',
		],
		relatedFlows: [
			{
				id: 'worker-token',
				title: 'Worker Token Flow',
				description: 'Admin-level access for system operations',
				route: '/flows/worker-token',
			},
		],
	},
	implicit: {
		whenToUse:
			'The Implicit Grant flow is deprecated and should only be used for legacy applications or when migrating from older implementations. Consider using PKCE instead for new applications.',
		prerequisites: [
			'Legacy application requirements',
			'Public client (cannot store secrets)',
			'HTTPS for all communications',
			'Understanding of security limitations',
		],
		securityNotes: [
			{
				type: 'warning',
				text: 'This flow is deprecated due to security concerns. Use PKCE instead.',
			},
			{
				type: 'warning',
				text: 'Access tokens are exposed in the URL fragment, making them vulnerable to theft.',
			},
			{
				type: 'info',
				text: 'No refresh tokens are provided, requiring frequent re-authentication.',
			},
		],
		commonIssues: [
			{
				issue: 'Token exposure in browser history',
				solution: 'Implement proper token cleanup and consider migrating to PKCE flow.',
			},
			{
				issue: 'No refresh token available',
				solution:
					'Implement automatic re-authentication or migrate to a flow that supports refresh tokens.',
			},
		],
		bestPractices: [
			'Plan migration to PKCE flow',
			'Use short-lived access tokens',
			'Implement proper token cleanup',
			'Monitor for security vulnerabilities',
			'Consider using Authorization Code flow with PKCE',
		],
		relatedFlows: [
			{
				id: 'pkce',
				title: 'PKCE Flow',
				description: 'Recommended replacement for implicit flow',
				route: '/flows/pkce',
			},
			{
				id: 'authorization-code',
				title: 'Authorization Code Flow',
				description: 'Most secure alternative',
				route: '/flows/authorization-code',
			},
		],
	},
};

interface ContextualHelpProps {
	flowId: string;
}

const ContextualHelp: React.FC<ContextualHelpProps> = ({ flowId }) => {
	const [isOpen, setIsOpen] = useState(false);
	const helpContent = helpContentMap[flowId];

	if (!helpContent) {
		return null;
	}

	return (
		<HelpContainer>
			<HelpToggle onClick={() => setIsOpen(!isOpen)}>
				<FiHelpCircle className="help-icon" />
				<span>Need help with this flow?</span>
				{isOpen ? <FiChevronDown /> : <FiChevronRight />}
			</HelpToggle>

			<HelpPanel $isOpen={isOpen}>
				<Card>
					<CardBody>
						<HelpSection>
							<h4>
								<FiInfo />
								When to use this flow
							</h4>
							<p>{helpContent.whenToUse}</p>
						</HelpSection>

						<HelpSection>
							<h4>
								<FiCheckCircle />
								Prerequisites
							</h4>
							<PrerequisitesList>
								{helpContent.prerequisites.map((prereq, index) => (
									<li key={index}>
										<FiCheckCircle className="check-icon" />
										{prereq}
									</li>
								))}
							</PrerequisitesList>
						</HelpSection>

						<HelpSection>
							<h4>
								<FiShield />
								Security considerations
							</h4>
							<SecurityNotes>
								{helpContent.securityNotes.map((note, index) => (
									<SecurityNote key={index} $type={note.type}>
										{note.type === 'warning' && <FiAlertTriangle className="note-icon" />}
										{note.type === 'info' && <FiInfo className="note-icon" />}
										{note.type === 'success' && <FiCheckCircle className="note-icon" />}
										{note.text}
									</SecurityNote>
								))}
							</SecurityNotes>
						</HelpSection>

						<HelpSection>
							<h4>
								<FiAlertTriangle />
								Common issues and solutions
							</h4>
							<CommonIssuesList>
								{helpContent.commonIssues.map((issue, index) => (
									<CommonIssue key={index}>
										<div className="issue-title">{issue.issue}</div>
										<div className="issue-solution">{issue.solution}</div>
									</CommonIssue>
								))}
							</CommonIssuesList>
						</HelpSection>

						<HelpSection>
							<h4>
								<FiCheckCircle />
								Best practices
							</h4>
							<BestPracticesList>
								{helpContent.bestPractices.map((practice, index) => (
									<li key={index}>
										<FiCheckCircle className="practice-icon" />
										{practice}
									</li>
								))}
							</BestPracticesList>
						</HelpSection>

						<HelpSection>
							<h4>
								<FiExternalLink />
								Related flows
							</h4>
							<RelatedFlowsList>
								{helpContent.relatedFlows.map((flow) => (
									<RelatedFlowCard key={flow.id} href={flow.route}>
										<div className="related-flow-title">{flow.title}</div>
										<div className="related-flow-description">{flow.description}</div>
									</RelatedFlowCard>
								))}
							</RelatedFlowsList>
						</HelpSection>
					</CardBody>
				</Card>
			</HelpPanel>
		</HelpContainer>
	);
};

export default ContextualHelp;
