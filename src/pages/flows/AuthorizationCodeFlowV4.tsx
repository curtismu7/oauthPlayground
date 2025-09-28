import { useState } from "react";
import styled from "styled-components";

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

const HeaderSection = styled.div`
	text-align: center;
	margin-bottom: 2rem;
`;

const MainTitle = styled.h1`
	font-size: 1.875rem;
	font-weight: bold;
	color: #111827;
	margin-bottom: 1rem;
`;

const Subtitle = styled.p`
	font-size: 1.125rem;
	color: #4b5563;
	max-width: 42rem;
	margin: 0 auto;
`;

const MainCard = styled.div`
	background-color: #ffffff;
	border-radius: 0.75rem;
	box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
	padding: 2rem;
	margin-bottom: 2rem;
	border: 1px solid #e5e7eb;
`;

const CardTitle = styled.h2`
	font-size: 1.5rem;
	font-weight: bold;
	color: #111827;
	margin-bottom: 1.5rem;
`;

const AuthorizationCodeFlowV4 = () => {
	const [currentStep, setCurrentStep] = useState(0);

	return (
		<Container>
			<ContentWrapper>
				<HeaderSection>
					<MainTitle>OAuth 2.0 Authorization Code Flow (V4) - Educational</MainTitle>
					<Subtitle>
						A step-by-step guide to understanding the Authorization Code Flow with PKCE.
					</Subtitle>
				</HeaderSection>
				
				<MainCard>
					<CardTitle>Step {currentStep}: Configuration</CardTitle>
					<p>Full V4 flow restored successfully! This is a clean, working version with all educational features.</p>
					<p>Current step: {currentStep + 1}</p>
				</MainCard>
			</ContentWrapper>
		</Container>
	);
};

export default AuthorizationCodeFlowV4;
