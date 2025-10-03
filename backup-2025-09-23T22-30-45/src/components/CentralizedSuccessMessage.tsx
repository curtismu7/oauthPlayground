// src/components/CentralizedSuccessMessage.tsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

/**
 * Centralized success and error message system
 * Displays messages at top and bottom of pages with consistent styling
 */

interface SuccessMessage {
	id: string;
	text: string;
	isError?: boolean;
	autoCloseMs?: number;
}

// Global message state
let globalMessages: SuccessMessage[] = [];
let messageListeners: Array<(messages: SuccessMessage[]) => void> = [];

const notifyListeners = () => {
	messageListeners.forEach((listener) => listener([...globalMessages]));
};

const addMessage = (message: Omit<SuccessMessage, 'id'>) => {
	const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
	const fullMessage: SuccessMessage = {
		id,
		autoCloseMs: message.isError ? 6000 : 4000, // 6s for errors, 4s for success
		...message,
	};

	globalMessages.push(fullMessage);
	notifyListeners();

	// Auto-remove message
	if (fullMessage.autoCloseMs > 0) {
		setTimeout(() => {
			removeMessage(id);
		}, fullMessage.autoCloseMs);
	}
};

const removeMessage = (id: string) => {
	globalMessages = globalMessages.filter((msg) => msg.id !== id);
	notifyListeners();
};

// Styled Components
const SuccessContainer = styled.div<{ $isError?: boolean; $position: 'top' | 'bottom' }>`
  position: fixed;
  ${(props) => (props.$position === 'top' ? 'top: 20px;' : 'bottom: 20px;')}
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
`;

const SuccessMessage = styled.div<{ $isError?: boolean }>`
  background: ${(props) =>
		props.$isError
			? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
			: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'};
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  box-shadow: ${(props) =>
		props.$isError ? '0 4px 20px rgba(239, 68, 68, 0.4)' : '0 4px 20px rgba(16, 185, 129, 0.4)'};
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  font-size: 14px;
  max-width: 500px;
  animation: slideIn 0.3s ease-out;
  pointer-events: auto;
  cursor: pointer;
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  &:hover {
    opacity: 0.9;
  }
`;

// Component Props
interface CentralizedSuccessMessageProps {
	position: 'top' | 'bottom';
}

export const CentralizedSuccessMessage: React.FC<CentralizedSuccessMessageProps> = ({
	position,
}) => {
	const [messages, setMessages] = useState<SuccessMessage[]>([]);

	useEffect(() => {
		const listener = (newMessages: SuccessMessage[]) => {
			setMessages(newMessages);
		};

		messageListeners.push(listener);

		return () => {
			messageListeners = messageListeners.filter((l) => l !== listener);
		};
	}, []);

	if (messages.length === 0) return null;

	return (
		<SuccessContainer $position={position}>
			{messages.map((message) => (
				<SuccessMessage
					key={message.id}
					$isError={message.isError}
					onClick={() => removeMessage(message.id)}
				>
					{message.isError ? <FiAlertCircle /> : <FiCheckCircle />}
					{message.text}
				</SuccessMessage>
			))}
		</SuccessContainer>
	);
};

// Generic helper functions
export const showFlowSuccess = (text: string, subtitle?: string) => {
	const message = subtitle ? `${text}\n${subtitle}` : text;
	addMessage({ text: message, isError: false });
};

export const showFlowError = (text: string, subtitle?: string) => {
	const message = subtitle ? `${text}\n${subtitle}` : text;
	addMessage({ text: message, isError: true });
};

// Authorization Flow specific functions
export const showAuthorizationSuccess = () => {
	addMessage({
		text: '🎉 Authorization successful! You have been redirected back from PingOne.',
		isError: false,
	});
};

export const showCredentialsSaved = () => {
	addMessage({ text: '✅ OAuth credentials saved successfully!', isError: false });
};

export const showPKCESuccess = () => {
	addMessage({ text: '🔐 PKCE codes generated successfully!', isError: false });
};

export const showAuthUrlBuilt = () => {
	addMessage({ text: '🔗 Authorization URL built successfully!', isError: false });
};

export const showTokenExchangeSuccess = () => {
	addMessage({ text: '🎫 Tokens exchanged successfully!', isError: false });
};

export const showUserInfoSuccess = () => {
	addMessage({ text: '👤 User information retrieved successfully!', isError: false });
};

// Error functions
export const showCredentialsError = () => {
	addMessage({
		text: '❌ Failed to save OAuth credentials. Please check your inputs.',
		isError: true,
	});
};

export const showPKCEError = () => {
	addMessage({ text: '❌ Failed to generate PKCE codes. Please try again.', isError: true });
};

export const showAuthUrlError = () => {
	addMessage({
		text: '❌ Failed to build authorization URL. Please check your configuration.',
		isError: true,
	});
};

export const showTokenExchangeError = () => {
	addMessage({
		text: '❌ Token exchange failed. Please check your authorization code and try again.',
		isError: true,
	});
};

export const showUserInfoError = () => {
	addMessage({
		text: '❌ Failed to retrieve user information. Please check your access token.',
		isError: true,
	});
};

// Flow-specific success functions
export const showClientCredentialsSuccess = () => {
	addMessage({ text: '🔑 Client Credentials flow completed successfully!', isError: false });
};

export const showDeviceCodeSuccess = () => {
	addMessage({ text: '📱 Device Code flow completed successfully!', isError: false });
};

export const showImplicitFlowSuccess = () => {
	addMessage({ text: '⚡ Implicit flow completed successfully!', isError: false });
};

export const showHybridFlowSuccess = () => {
	addMessage({ text: '🔄 Hybrid flow completed successfully!', isError: false });
};

export const showJWTBearerSuccess = () => {
	addMessage({ text: '🎫 JWT Bearer flow completed successfully!', isError: false });
};

export const showTokenRevocationSuccess = () => {
	addMessage({ text: '🗑️ Token revocation completed successfully!', isError: false });
};

export const showTokenIntrospectionSuccess = () => {
	addMessage({ text: '🔍 Token introspection completed successfully!', isError: false });
};

export default CentralizedSuccessMessage;
