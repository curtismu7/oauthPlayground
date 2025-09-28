// src/components/CentralizedSuccessMessage.tsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiCheckCircle, FiAlertCircle, FiX } from 'react-icons/fi';

/**
 * Centralized success and error message system
 * Displays messages at top and bottom of pages with consistent styling
 */

interface MessageEntry {
  id: string;
  text: string;
  isError?: boolean;
  autoCloseMs?: number;
  html?: string;
}

// Global message state
let globalMessages: MessageEntry[] = [];
let messageListeners: Array<(messages: MessageEntry[]) => void> = [];
let hasPrimaryToastInstance = false;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const convertTextToHtml = (text: string) =>
  text
    .trim()
    .split(/\n{2,}/)
    .map(block => `<p>${escapeHtml(block).replace(/\n/g, '<br />')}</p>`)
    .join('');

const buildErrorHtml = (summary: string, details?: string) => {
  const bodySource = details && details.trim().length > 0 ? details : summary;
  return convertTextToHtml(bodySource);
};

const notifyListeners = () => {
  messageListeners.forEach(listener => listener([...globalMessages]));
};

const addMessage = (message: Omit<MessageEntry, 'id'>) => {
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const autoCloseMs = message.autoCloseMs ?? (message.isError ? 0 : 4000);
  const fullMessage: MessageEntry = {
    id,
    ...message,
    autoCloseMs
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
  globalMessages = globalMessages.filter(msg => msg.id !== id);
  notifyListeners();
};

// Styled Components
const ToastContainer = styled.div<{ $position: 'top' | 'bottom' }>`
  position: fixed;
  ${props => props.$position === 'top' ? 'top: 20px;' : 'bottom: 20px;'}
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
`;

const ToastMessage = styled.div<{ $isError?: boolean }>`
  background: ${props => props.$isError 
    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
  };
  color: white;
  padding: ${props => props.$isError ? '16px 28px' : '12px 24px'};
  border-radius: 8px;
  box-shadow: ${props => props.$isError
    ? '0 6px 25px rgba(239, 68, 68, 0.6), 0 0 0 2px rgba(239, 68, 68, 0.2)'
    : '0 4px 20px rgba(16, 185, 129, 0.4)'
  };
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: ${props => props.$isError ? '600' : '500'};
  font-size: ${props => props.$isError ? '15px' : '14px'};
  max-width: ${props => props.$isError ? '600px' : '500px'};
  animation: ${props => props.$isError ? 'errorSlideIn 0.4s ease-out' : 'slideIn 0.3s ease-out'};
  pointer-events: auto;
  cursor: pointer;
  border: ${props => props.$isError ? '2px solid rgba(255, 255, 255, 0.3)' : 'none'};
  
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
  
  @keyframes errorSlideIn {
    0% {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    50% {
      opacity: 0.8;
      transform: translateY(-5px) scale(1.02);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  &:hover {
    opacity: 0.9;
  }
  
  ${props => props.$isError && `
    animation: errorSlideIn 0.4s ease-out, errorPulse 2s ease-in-out infinite;
    
    @keyframes errorPulse {
      0%, 100% {
        box-shadow: 0 6px 25px rgba(239, 68, 68, 0.6), 0 0 0 2px rgba(239, 68, 68, 0.2);
      }
      50% {
        box-shadow: 0 8px 30px rgba(239, 68, 68, 0.8), 0 0 0 4px rgba(239, 68, 68, 0.4);
      }
    }
  `}
`;

const ErrorOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.72);
  backdrop-filter: blur(2px);
  z-index: 11000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const ErrorModal = styled.div`
  position: relative;
  width: min(720px, 90vw);
  max-height: 80vh;
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 25px 60px rgba(15, 23, 42, 0.35);
  border: 2px solid rgba(239, 68, 68, 0.35);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ErrorHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
`;

const ErrorIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(248, 113, 113, 0.15);
  border: 2px solid rgba(248, 113, 113, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #b91c1c;
  flex-shrink: 0;
`;

const ErrorTitle = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  line-height: 1.4;
  color: #991b1b;
  font-weight: 700;
`;

const ErrorBody = styled.div`
  font-size: 0.95rem;
  line-height: 1.6;
  color: #1f2937;
  max-height: 50vh;
  overflow-y: auto;

  p {
    margin: 0 0 0.85rem;
  }

  ul, ol {
    margin: 0 0 0.85rem 1.25rem;
    padding: 0;
  }

  code, pre {
    background: rgba(248, 113, 113, 0.08);
    border-radius: 6px;
    padding: 0.35rem 0.5rem;
    display: block;
    font-family: 'Menlo', 'Monaco', monospace;
    overflow-x: auto;
    color: #991b1b;
  }

  strong {
    color: #b91c1c;
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const CloseButton = styled.button`
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.65rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(220, 38, 38, 0.35);

  &:hover {
    background: #b91c1c;
  }
`;

// Component Props
export const CentralizedSuccessMessage: React.FC = () => {
  const [messages, setMessages] = useState<MessageEntry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<MessageEntry | null>(null);

  // TODO: Current lint configuration produces global warnings unrelated to this component when running scoped lint.
  // Once repository-wide lint debt is resolved, re-run lint specifically for this file to ensure compliance.

  useEffect(() => {
    if (hasPrimaryToastInstance) {
      console.warn('Multiple CentralizedSuccessMessage instances detected. Additional instances will be inactive.');
      return;
    }

    hasPrimaryToastInstance = true;

    const listener = (newMessages: MessageEntry[]) => {
      setMessages(newMessages.filter(msg => !msg.isError));

      const latestError = newMessages.find(msg => msg.isError);
      if (latestError) {
        setModalContent(latestError);
        setShowModal(true);
      }
    };

    messageListeners.push(listener);

    return () => {
      messageListeners = messageListeners.filter(l => l !== listener);
      hasPrimaryToastInstance = false;
    };
  }, []);

  const handleCloseModal = () => {
    if (modalContent) {
      removeMessage(modalContent.id);
    }
    setModalContent(null);
    setShowModal(false);
  };

  return (
    <>
      {messages.length > 0 && (
        <ToastContainer $position="top">
          {messages.map(message => (
            <ToastMessage
              key={message.id}
              $isError={message.isError}
              onClick={() => removeMessage(message.id)}
            >
              {message.isError ? <FiAlertCircle /> : <FiCheckCircle />}
              <span>{message.text}</span>
            </ToastMessage>
          ))}
        </ToastContainer>
      )}

      {showModal && modalContent && (
        <ErrorOverlay>
          <ErrorModal role="alertdialog" aria-modal="true" aria-labelledby={`error-modal-${modalContent.id}`}>
            <ErrorHeader>
              <ErrorIcon>
                <FiAlertCircle size={24} />
              </ErrorIcon>
              <div>
                <ErrorTitle id={`error-modal-${modalContent.id}`}>We hit an issue</ErrorTitle>
                <p style={{ margin: '0.35rem 0 0', color: '#4b5563', fontSize: '0.95rem' }}>
                  Something didnt go as planned. Review the details below to get back on track.
                </p>
              </div>
            </ErrorHeader>

            <ErrorBody dangerouslySetInnerHTML={{ __html: modalContent.html || convertTextToHtml(modalContent.text) }} />

            <ModalActions>
              <CloseButton type="button" onClick={handleCloseModal}>
                <FiX size={18} />
                Dismiss
              </CloseButton>
            </ModalActions>
          </ErrorModal>
        </ErrorOverlay>
      )}
    </>
  );
};

// Generic helper functions
export const showFlowSuccess = (text: string, subtitle?: string, autoCloseMs?: number) => {
  const message = subtitle ? `${text}\n${subtitle}` : text;
  addMessage({ text: message, isError: false, autoCloseMs });
};

export const showFlowError = (summary: string, details?: string) => {
  const message = details ? `${summary}\n${details}` : summary;
  addMessage({ text: summary, isError: true, html: buildErrorHtml(summary, details) });
};

export const showDetailedError = (summary: string, details?: string, durationMs?: number) => {
  addMessage({
    text: summary,
    isError: true,
    html: buildErrorHtml(summary, details),
    autoCloseMs: durationMs || 0
  });
};

// Authorization Flow specific functions
export const showAuthorizationSuccess = () => {
  addMessage({ text: ' Authorization successful! You have been redirected back from PingOne.', isError: false });
};

export const showCredentialsSaved = () => {
  addMessage({ text: ' OAuth credentials saved successfully!', isError: false });
};

export const showPKCESuccess = () => {
  addMessage({ text: ' PKCE codes generated successfully!', isError: false });
};

export const showAuthUrlBuilt = () => {
  addMessage({ text: ' Authorization URL built successfully!', isError: false });
};

export const showTokenExchangeSuccess = () => {
  addMessage({ text: ' Tokens exchanged successfully!', isError: false });
};

export const showUserInfoSuccess = () => {
  addMessage({ text: ' User information retrieved successfully!', isError: false });
};

// Error functions
export const showCredentialsError = () => {
  addMessage({ text: ' Failed to save OAuth credentials. Please check your inputs.', isError: true });
};

export const showPKCEError = () => {
  addMessage({ text: ' Failed to generate PKCE codes. Please try again.', isError: true });
};

export const showAuthUrlError = () => {
  addMessage({ text: ' Failed to build authorization URL. Please check your configuration.', isError: true });
};

export const showTokenExchangeError = () => {
  addMessage({ text: ' Token exchange failed. Please check your authorization code and try again.', isError: true });
};

export const showUserInfoError = () => {
  addMessage({ text: ' Failed to retrieve user information. Please check your access token.', isError: true });
};

// Flow-specific success functions
export const showClientCredentialsSuccess = () => {
  addMessage({ text: ' Client Credentials flow completed successfully!', isError: false });
};

export const showDeviceCodeSuccess = () => {
  addMessage({ text: ' Device Code flow completed successfully!', isError: false });
};

export const showImplicitFlowSuccess = () => {
  addMessage({ text: ' Implicit flow completed successfully!', isError: false });
};

export const showHybridFlowSuccess = () => {
  addMessage({ text: ' Hybrid flow completed successfully!', isError: false });
};

export const showJWTBearerSuccess = () => {
  addMessage({ text: ' JWT Bearer flow completed successfully!', isError: false });
};

export const showTokenRevocationSuccess = () => {
  addMessage({ text: ' Token revocation completed successfully!', isError: false });
};

export const showTokenIntrospectionSuccess = () => {
  addMessage({ text: ' Token introspection completed successfully!', isError: false });
};

export default CentralizedSuccessMessage;