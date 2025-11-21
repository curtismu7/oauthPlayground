import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
`;

const Title = styled.h1`
  color: #1f2937;
  font-size: 2rem;
  margin-bottom: 1rem;
`;

const Subtitle = styled.p`
  color: #6b7280;
  font-size: 1.125rem;
  margin-bottom: 2rem;
`;

const ComprehensiveOAuthEducation: React.FC = () => {
	return (
		<Container>
			<Title>Comprehensive OAuth Education</Title>
			<Subtitle>
				Master OAuth 2.0 and OpenID Connect fundamentals, flows, security best practices, and modern
				standards.
			</Subtitle>
			<p>
				This page is temporarily simplified for debugging. The original content will be restored
				once the 500 error is resolved.
			</p>
		</Container>
	);
};

export default ComprehensiveOAuthEducation;
