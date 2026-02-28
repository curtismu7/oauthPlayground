// src/features/flows/ClientCredentials/ResponseModes.tsx
// Client Credentials flow doesn't use browser redirect response modes - show learn-only notice

import React from 'react';
import { FiExternalLink, FiInfo } from '@icons';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

// Styled Components
const Container = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
`;

const HeaderTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Content = styled.div`
  padding: 1rem;
`;

const InfoBox = styled.div`
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const InfoContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
`;

const InfoText = styled.div`
  flex: 1;
`;

const InfoTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #0369a1;
`;

const InfoDescription = styled.p`
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  color: #0c4a6e;
  line-height: 1.5;
`;

const LearnButton = styled.button`
  background: #0ea5e9;
  color: white;
  border: none;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: #0284c7;
  }
`;

const ClientCredentialsInfo = styled.div`
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 0.5rem;
  padding: 1rem;
`;

const ClientCredentialsTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #92400e;
`;

const ClientCredentialsText = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: #78350f;
  line-height: 1.5;
`;

interface ClientCredentialsResponseModesProps {
	className?: string;
}

const ClientCredentialsResponseModes: React.FC<ClientCredentialsResponseModesProps> = ({
	className,
}) => {
	const navigate = useNavigate();

	const handleLearnMore = () => {
		navigate('/learn/response-modes');
	};

	return (
		<Container className={className}>
			<Header>
				<HeaderTitle>
					<FiInfo size={16} />
					Response Mode
				</HeaderTitle>
			</Header>

			<Content>
				<InfoBox>
					<InfoContent>
						<FiInfo size={20} color="#0369a1" />
						<InfoText>
							<InfoTitle>Not Applicable to Client Credentials Flow</InfoTitle>
							<InfoDescription>
								The Client Credentials Flow is designed for server-to-server authentication. It
								doesn't involve user interaction or browser redirects, so response modes don't
								apply.
							</InfoDescription>
							<LearnButton onClick={handleLearnMore}>
								<FiExternalLink size={14} />
								Learn About Response Modes
							</LearnButton>
						</InfoText>
					</InfoContent>
				</InfoBox>

				<ClientCredentialsInfo>
					<ClientCredentialsTitle>How Client Credentials Flow Works</ClientCredentialsTitle>
					<ClientCredentialsText>
						The Client Credentials Flow is used for machine-to-machine authentication. The client
						authenticates directly with the authorization server using its credentials, without any
						user interaction or redirects.
					</ClientCredentialsText>
				</ClientCredentialsInfo>
			</Content>
		</Container>
	);
};

export default ClientCredentialsResponseModes;
