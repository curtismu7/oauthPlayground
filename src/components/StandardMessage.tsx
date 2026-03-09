import React, { useEffect } from 'react';
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
          border-color: V9_COLORS.BG.SUCCESS_BORDER;
          color: V9_COLORS.PRIMARY.GREEN;

          svg {
            color: V9_COLORS.PRIMARY.GREEN;
          }
        `;
			case 'error':
				return `
          background-color: V9_COLORS.BG.ERROR;
          border-color: V9_COLORS.BG.ERROR_BORDER;
          color: V9_COLORS.PRIMARY.RED_DARK;

          svg {
            color: V9_COLORS.PRIMARY.RED;
          }
        `;
			case 'warning':
				return `
          background-color: V9_COLORS.BG.WARNING;
          border-color: #fed7aa;
          color: V9_COLORS.PRIMARY.YELLOW_DARK;

          svg {
            color: V9_COLORS.PRIMARY.YELLOW;
          }
        `;
			default:
				return `
          background-color: V9_COLORS.BG.GRAY_LIGHT;
          border-color: V9_COLORS.TEXT.GRAY_LIGHTER;
          color: V9_COLORS.PRIMARY.BLUE_DARK;

          svg {
            color: V9_COLORS.PRIMARY.BLUE;
          }
        `;
		}
	}}
`;

const getIcon = (type: MessageType) => {
	switch (type) {
		case 'success':
			return <span>✅</span>;
		case 'error':
			return <span>⚠️</span>;
		case 'warning':
			return <span>⚠️</span>;
		default:
			return <span>ℹ️</span>;
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
