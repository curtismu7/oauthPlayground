import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  margin-top: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.gray100};
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
`;

const Title = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray900};
  margin-bottom: 0.5rem;
`;

const ParamList = styled.ul`
  margin: 0;
  padding-left: 1.1rem;
`;

const ParamItem = styled.li`
  margin: 0.35rem 0;
  color: ${({ theme }) => theme.colors.gray700};
  line-height: 1.35;

  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 0.85rem;
    color: ${({ theme }) => theme.colors.gray900};
    background: ${({ theme }) => theme.colors.gray100};
    padding: 0.1rem 0.35rem;
    border-radius: 0.25rem;
  }

  .name { color: #16a34a; }
  .value { color: #7c3aed; }
`;

const Small = styled.small`
  display: block;
  margin-top: 0.5rem;
  color: ${({ theme }) => theme.colors.gray600};
`;

type URLParamExplainerProps = {
	url: string;
};

const KNOWN_PARAM_DESCRIPTIONS: Record<string, string> = {
	response_type: 'What you want back from authorization (PKCE: code).',
	client_id: 'The RP/client identifier registered with the AS.',
	redirect_uri: 'Exact redirect URI registered; must match for security.',
	scope: 'Requested permissions/claims (e.g., openid profile email).',
	state: 'Opaque value to prevent CSRF; must be validated on return.',
	nonce: 'Opaque value to bind ID Token to request; mitigates replay.',
	code_challenge: 'PKCE challenge derived from the code_verifier (base64url SHA-256).',
	code_challenge_method: 'Method used to derive the challenge. Use S256.',
	iss: 'Issuer id (mix-up defense) expected back in response (if supported).',
};

export const URLParamExplainer: React.FC<URLParamExplainerProps> = ({ url }) => {
	if (!url) return null;

	let parsed: URL | null = null;
	try {
		parsed = new URL(url);
	} catch {
		return null;
	}

	const items = Array.from(parsed.searchParams.entries());
	if (!items.length) return null;

	return (
		<Wrapper>
			<Title>Authorization URL parameters</Title>
			<ParamList>
				{items.map(([name, value]) => (
					<ParamItem key={name}>
						<code className="name">{name}</code>
						{': '}
						<code className="value">{value}</code>
						{KNOWN_PARAM_DESCRIPTIONS[name] ? ` — ${KNOWN_PARAM_DESCRIPTIONS[name]}` : ''}
					</ParamItem>
				))}
			</ParamList>
			<Small>
				Secure-by-default: Authorization Code + PKCE (S256). Validate state and nonce. Enforce exact
				redirect URI. Prefer PAR/JAR to avoid parameter tampering.
			</Small>
		</Wrapper>
	);
};

export default URLParamExplainer;
