import { useState } from "react";
import styled from "styled-components";
import { FiSettings, FiExternalLink, FiCheckCircle } from "react-icons/fi";
import { showGlobalSuccess, showGlobalError } from "../../hooks/useNotifications";

const Container = styled.div`
	min-height: 100vh;
	background-color: #f9fafb;
	padding: 2rem 0;
`;

const ContentWrapper = styled.div`
	max-width: 64rem;
	margin: 0 auto;
	padding: 0 1rem;
`;

const MainCard = styled.div`
	background: white;
	border-radius: 0.75rem;
	padding: 2rem;
	margin-bottom: 1.5rem;
	box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
`;

const Button = styled.button`
	display: inline-flex;
	align-items: center;
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-weight: 500;
	cursor: pointer;
	border: none;
	background-color: #3b82f6;
	color: white;
	
	&:hover {
		background-color: #2563eb;
	}
`;

const AuthorizationCodeFlowV4 = () => {
	const [currentStep, setCurrentStep] = useState(0);

	return (
		<Container>
			<ContentWrapper>
				<MainCard>
					<h1>OAuth 2.0 Authorization Code Flow (V4) - Educational</h1>
					<p>Learn the Authorization Code Flow with PKCE through an interactive, step-by-step experience.</p>
					
					<div style={{ marginTop: '2rem' }}>
						<Button onClick={() => showGlobalSuccess('V4 Flow is working!')}>
							<FiSettings style={{ marginRight: '0.5rem' }} />
							Test Button
						</Button>
					</div>
				</MainCard>
			</ContentWrapper>
		</Container>
	);
};

export default AuthorizationCodeFlowV4;
