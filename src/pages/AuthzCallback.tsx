// src/pages/AuthzCallback.tsx
// Simple callback page to display authorization code

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  max-width: 800px;
  margin: 50px auto;
  padding: 20px;
`;

const Card = styled.div`
  background: white;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const Title = styled.h1`
  color: #1a202c;
  margin-bottom: 20px;
`;

const Section = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.div`
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 8px;
`;

const CodeBox = styled.div`
  background: #2d3748;
  color: #e2e8f0;
  padding: 15px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  word-break: break-all;
  margin-bottom: 10px;
`;

const Button = styled.button`
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  margin-right: 10px;
  
  &:hover {
    background: #0056b3;
  }
`;

const SuccessMessage = styled.div`
  background: #c6f6d5;
  color: #22543d;
  padding: 10px 15px;
  border-radius: 4px;
  margin-top: 10px;
`;

const ErrorMessage = styled.div`
  background: #fed7d7;
  color: #742a2a;
  padding: 10px 15px;
  border-radius: 4px;
  margin-top: 10px;
`;

const AuthzCallback: React.FC = () => {
	const [authCode, setAuthCode] = useState<string>('');
	const [state, setState] = useState<string>('');
	const [error, setError] = useState<string>('');
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const code = params.get('code');
		const stateParam = params.get('state');
		const errorParam = params.get('error');
		const errorDescription = params.get('error_description');

		if (errorParam) {
			setError(`${errorParam}: ${errorDescription || 'Unknown error'}`);
		} else if (code) {
			setAuthCode(code);
			if (stateParam) setState(stateParam);
		} else {
			setError('No authorization code received');
		}
	}, []);

	const handleCopy = () => {
		navigator.clipboard.writeText(authCode);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleBackToTest = () => {
		window.location.href = '/test-authz-pkce';
	};

	return (
		<Container>
			<Card>
				<Title>🎉 Authorization Callback</Title>

				{error ? (
					<ErrorMessage>
						<strong>Error:</strong> {error}
					</ErrorMessage>
				) : (
					<>
						<Section>
							<Label>Authorization Code:</Label>
							<CodeBox>{authCode}</CodeBox>
							<Button onClick={handleCopy}>Copy Code</Button>
							<Button onClick={handleBackToTest}>Back to Test Page</Button>
							{copied && <SuccessMessage>✓ Copied to clipboard!</SuccessMessage>}
						</Section>

						{state && (
							<Section>
								<Label>State Parameter:</Label>
								<CodeBox>{state}</CodeBox>
							</Section>
						)}

						<Section>
							<Label>Full Callback URL:</Label>
							<CodeBox>{window.location.href}</CodeBox>
						</Section>

						<Section
							style={{
								marginTop: '30px',
								padding: '15px',
								background: '#f7fafc',
								borderRadius: '4px',
							}}
						>
							<strong>Next Steps:</strong>
							<ol style={{ marginTop: '10px', paddingLeft: '20px' }}>
								<li>Copy the authorization code above</li>
								<li>Click "Back to Test Page"</li>
								<li>Paste the code in the "Authorization Code" field</li>
								<li>Click "Receive Auth Code"</li>
								<li>Click "Exchange Code" to get tokens</li>
							</ol>
						</Section>
					</>
				)}
			</Card>
		</Container>
	);
};

export default AuthzCallback;
