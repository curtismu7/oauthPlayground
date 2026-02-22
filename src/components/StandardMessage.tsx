import React, { useEffect } from 'react';
import { FiAlertCircle, FiAlertTriangle, FiCheckCircle, FiInfo } from 'react-icons/fi';
import styled from 'styled-components';

export type MessageType = 'success' | 'error' | 'warning' | 'info';

interface StandardMessageProps {
	type: MessageType;
	title?: string;
	message: string;
	onDismiss?: () => void;
	className?: string;
}

const MessageContainer = styled.div<{ $type: MessageType }>`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 0.5rem;
  border: 1px solid transparent;
  font-size: 0.875rem;
  line-height: 1.5;

  svg {
    margin-top: 0.125rem;
    flex-shrink: 0;
    width: 1.25rem;
    height: 1.25rem;
  }

  .message-content {
    flex: 1;
  }

  .message-title {
    font-weight: 600;
    margin: 0 0 0.25rem 0;
    font-size: 0.9rem;
  }

  .message-text {
    margin: 0;
    font-size: 0.875rem;
  }

  .dismiss-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
    color: inherit;
    opacity: 0.7;
    transition: opacity 0.2s ease;
    flex-shrink: 0;
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.125rem;
    line-height: 1;

    &:hover {
      opacity: 1;
      background-color: rgba(0, 0, 0, 0.1);
    }
  }

  ${({ $type }) => {
		switch ($type) {
			case 'success':
				return `
          background-color: #f0fdf4;
          border-color: #bbf7d0;
          color: #166534;

          svg {
            color: #22c55e;
          }
        `;
			case 'error':
				return `
          background-color: #fef2f2;
          border-color: #fecaca;
          color: #991b1b;

          svg {
            color: #ef4444;
          }
        `;
			case 'warning':
				return `
          background-color: #fffbeb;
          border-color: #fed7aa;
          color: #92400e;

          svg {
            color: #f59e0b;
          }
        `;
			default:
				return `
          background-color: #eff6ff;
          border-color: #bfdbfe;
          color: #1e40af;

          svg {
            color: #3b82f6;
          }
        `;
		}
	}}
`;

const getIcon = (type: MessageType) => {
	switch (type) {
		case 'success':
			return <FiCheckCircle />;
		case 'error':
			return <FiAlertCircle />;
		case 'warning':
			return <FiAlertTriangle />;
		default:
			return <FiInfo />;
	}
};

export const StandardMessage: React.FC<StandardMessageProps> = ({
	type,
	title,
	message,
	onDismiss,
	className,
}) => {
	// Handle ESC key to dismiss message
	useEffect(() => {
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && onDismiss) {
				onDismiss();
			}
		};

		if (onDismiss) {
			document.addEventListener('keydown', handleEscape);
			return () => document.removeEventListener('keydown', handleEscape);
		}
	}, [onDismiss]);

	return (
		<MessageContainer $type={type} className={className} role="alert" aria-live="assertive">
			{getIcon(type)}
			<div className="message-content">
				{title && <h4 className="message-title">{title}</h4>}
				<p className="message-text">{message}</p>
			</div>
			{onDismiss && (
				<button
					type="button"
					className="dismiss-button"
					onClick={onDismiss}
					aria-label="Dismiss message"
					type="button"
				></button>
			)}
		</MessageContainer>
	);
};

export default StandardMessage;
