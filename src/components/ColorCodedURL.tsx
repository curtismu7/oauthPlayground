import React, { useState } from 'react';
import styled from 'styled-components';
import { FiInfo, FiX } from 'react-icons/fi';

interface ColorCodedURLProps {
  url: string;
  className?: string;
  showInfoButton?: boolean;
}

interface URLPartInfo {
  type: 'base' | 'question' | 'ampersand' | 'param' | 'param2' | 'param3' | 'equals';
  content: string;
  description?: string;
}

const URLContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const URLText = styled.span`
  font-family: 'SFMono-Regular', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  word-break: break-all;
  white-space: pre-wrap;
  flex: 1;
`;

const InfoButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: background-color 0.2s;

  &:hover {
    background: #2563eb;
  }

  svg {
    width: 0.875rem;
    height: 0.875rem;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  color: #6b7280;
  transition: color 0.2s;

  &:hover {
    color: #374151;
  }

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

const URLPartDescription = styled.div`
  margin-bottom: 1rem;
  padding: 0.75rem;
  border-radius: 0.375rem;
  border-left: 4px solid;
`;

const URLPartDescriptionBase = styled(URLPartDescription)`
  background: #eff6ff;
  border-left-color: #1e40af;
`;

const URLPartDescriptionQuestion = styled(URLPartDescription)`
  background: #fef2f2;
  border-left-color: #dc2626;
`;

const URLPartDescriptionAmpersand = styled(URLPartDescription)`
  background: #fff7ed;
  border-left-color: #ea580c;
`;

const URLPartDescriptionParam = styled(URLPartDescription)`
  background: #f0fdf4;
  border-left-color: #059669;
`;

const URLPartDescriptionParam2 = styled(URLPartDescription)`
  background: #fef3c7;
  border-left-color: #d97706;
`;

const URLPartDescriptionParam3 = styled(URLPartDescription)`
  background: #f3e8ff;
  border-left-color: #7c3aed;
`;

const URLPartDescriptionEquals = styled(URLPartDescription)`
  background: #f1f5f9;
  border-left-color: #475569;
`;



const PartName = styled.strong`
  font-family: 'SFMono-Regular', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', 'Courier New', monospace;
  font-size: 0.875rem;
`;

const PartDescription = styled.p`
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: #4b5563;
  line-height: 1.5;
`;

const URLPart = styled.span<{ type: 'base' | 'question' | 'ampersand' | 'param' | 'param2' | 'param3' | 'equals' }>`
  ${({ type }) => {
    switch (type) {
      case 'base':
        return `
          color: #1e40af; /* Blue for base URL */
          font-weight: 500;
        `;
      case 'question':
        return `
          color: #dc2626; /* Red for ? */
          font-weight: 600;
        `;
      case 'ampersand':
        return `
          color: #ea580c; /* Orange for & */
          font-weight: 600;
        `;
      case 'param':
        return `
          color: #059669; /* Green for parameter names and values */
          font-weight: 500;
        `;
      case 'param2':
        return `
          color: #d97706; /* Amber for alternating parameters */
          font-weight: 500;
        `;
      case 'param3':
        return `
          color: #7c3aed; /* Purple for alternating parameters */
          font-weight: 500;
        `;
      case 'equals':
        return `
          color: #475569; /* Slate for equals sign */
          font-weight: 500;
        `;
      default:
        return '';
    }
  }}
`;

// OAuth parameter descriptions
const getParameterDescription = (paramName: string): string => {
  const descriptions: Record<string, string> = {
    'client_id': 'The unique identifier for your OAuth application. This is provided by the authorization server when you register your application.',
    'redirect_uri': 'The URL where the authorization server will redirect the user after they grant or deny permission. Must match the URI registered with your application.',
    'response_type': 'Specifies the type of response you want to receive. Common values are "code" (authorization code flow) or "token" (implicit flow).',
    'scope': 'A space-separated list of permissions your application is requesting. Common scopes include "openid", "profile", "email", etc.',
    'state': 'A random string used to prevent CSRF attacks. The authorization server will return this exact value, allowing you to verify the request.',
    'nonce': 'A random string used to prevent replay attacks, especially important for OpenID Connect flows.',
    'code': 'The authorization code returned by the authorization server after user consent. This code is exchanged for access tokens.',
    'grant_type': 'Specifies the OAuth grant type being used. For authorization code flow, this should be "authorization_code".',
    'client_secret': 'A secret key that authenticates your application to the authorization server. Keep this secure and never expose it in client-side code.',
    'code_challenge': 'Used in PKCE (Proof Key for Code Exchange) flow. A challenge derived from a code verifier.',
    'code_challenge_method': 'The method used to generate the code challenge. Usually "S256" for SHA256.',
    'code_verifier': 'A random string used in PKCE flow to generate the code challenge.',
    'access_token': 'A token that allows your application to access protected resources on behalf of the user.',
    'token_type': 'The type of token returned. Usually "Bearer" for OAuth 2.0.',
    'expires_in': 'The number of seconds until the access token expires.',
    'refresh_token': 'A token that can be used to obtain new access tokens without requiring user interaction.',
    'id_token': 'A JWT token containing user identity information, used in OpenID Connect flows.'
  };
  
  return descriptions[paramName] || 'A parameter in the OAuth flow.';
};

export const ColorCodedURL: React.FC<ColorCodedURLProps> = ({ url, className, showInfoButton = true }) => {
  const [showModal, setShowModal] = useState(false);

  if (!url || typeof url !== 'string') {
    return <span className={className}>{url}</span>;
  }

  // Split URL into base and query parts
  const [basePart, queryPart] = url.split('?');
  const urlParts: URLPartInfo[] = [];

  // Add base URL part
  if (basePart) {
    urlParts.push({
      type: 'base',
      content: basePart,
      description: 'The base URL of the authorization server endpoint. This is where the OAuth request is sent.'
    });
  }

  // Add query part if it exists
  if (queryPart) {
    urlParts.push({
      type: 'question',
      content: '?',
      description: 'Separates the base URL from the query parameters.'
    });

    // Split query parameters
    const params = queryPart.split('&');
    params.forEach((param, index) => {
      if (index > 0) {
        urlParts.push({
          type: 'ampersand',
          content: '&',
          description: 'Separates multiple query parameters.'
        });
      }

      const [key, value] = param.split('=');
      if (key) {
        if (value) {
          // Add parameter name and value as separate parts with alternating colors
          const paramType = index % 3 === 0 ? 'param' : index % 3 === 1 ? 'param2' : 'param3';
          urlParts.push({
            type: paramType,
            content: key,
            description: getParameterDescription(key)
          });
          urlParts.push({
            type: 'equals',
            content: '=',
            description: 'Separates parameter name from its value.'
          });
          urlParts.push({
            type: paramType,
            content: value,
            description: `Value: ${decodeURIComponent(value)}`
          });
        } else {
          // Parameter without value
          const paramType = index % 3 === 0 ? 'param' : index % 3 === 1 ? 'param2' : 'param3';
          urlParts.push({
            type: paramType,
            content: key,
            description: getParameterDescription(key)
          });
        }
      }
    });
  }

  const renderURLPart = (part: URLPartInfo, index: number) => (
    <URLPart key={index} type={part.type}>
      {part.content}
    </URLPart>
  );

  const renderDescription = (part: URLPartInfo, index: number) => {
    const DescriptionComponent = {
      'base': URLPartDescriptionBase,
      'question': URLPartDescriptionQuestion,
      'ampersand': URLPartDescriptionAmpersand,
      'param': URLPartDescriptionParam,
      'param2': URLPartDescriptionParam2,
      'param3': URLPartDescriptionParam3,
      'equals': URLPartDescriptionEquals
    }[part.type];

    return (
      <DescriptionComponent key={index}>
        <PartName>{part.content}</PartName>
        <PartDescription>{part.description}</PartDescription>
      </DescriptionComponent>
    );
  };

  return (
    <>
      <URLContainer className={className}>
        <URLText>
          {urlParts.map(renderURLPart)}
        </URLText>
        {showInfoButton && (
          <InfoButton onClick={() => setShowModal(true)}>
            <FiInfo />
            Info
          </InfoButton>
        )}
      </URLContainer>

      {showModal && (
        <ModalOverlay onClick={() => setShowModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>URL Parameter Descriptions</ModalTitle>
              <CloseButton onClick={() => setShowModal(false)}>
                <FiX />
              </CloseButton>
            </ModalHeader>
            {urlParts.map(renderDescription)}
          </ModalContent>
        </ModalOverlay>
      )}
    </>
  );
};

export default ColorCodedURL;
