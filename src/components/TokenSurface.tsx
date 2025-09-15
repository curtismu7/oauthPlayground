import React from 'react';
import styled from 'styled-components';
import JSONHighlighter from './JSONHighlighter';

const TokenSurfaceContainer = styled.div<{ $hasToken?: boolean }>`
  background: ${({ $hasToken }) => 
    $hasToken 
      ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' 
      : 'var(--card-bg)'
  } !important;
  color: var(--card-fg) !important;
  border: 1px solid ${({ $hasToken }) => 
    $hasToken ? '#bbf7d0' : 'var(--card-border)'
  };
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 13px;
  line-height: 1.4;
  transition: all 0.3s ease;

  pre, code, textarea {
    background: transparent !important;
    color: inherit !important;
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
  }

  textarea {
    width: 100%;
    min-height: 400px; /* Increased from 300px */
    resize: vertical;
    border: 0;
    outline: none;
    background: transparent !important;
    color: inherit !important;
    font-size: 14px;
    line-height: 1.5;
  }

  &.scrollable {
    overflow: auto;
    max-height: 420px; /* Increased from 320px */
    white-space: pre;
  }

  @media (max-width: 768px) {
    padding: 12px;
  }
`;

const TokenSectionTitle = styled.h3`
  font-weight: 700;
  margin: 12px 0 8px;
  color: var(--card-fg) !important;
`;

interface TokenSurfaceProps {
  title?: string;
  children: React.ReactNode;
  scrollable?: boolean;
  className?: string;
  'aria-label'?: string;
  hasToken?: boolean;
  isJson?: boolean;
  jsonContent?: string;
}

/**
 * TokenSurface component for consistent token display styling
 * Provides white background with black text for token content
 */
export const TokenSurface: React.FC<TokenSurfaceProps> = ({ 
  title, 
  children, 
  scrollable = false,
  className = '', 
  'aria-label': ariaLabel,
  hasToken = false,
  isJson = false,
  jsonContent
}) => {
  return (
    <section>
      {title && <TokenSectionTitle>{title}</TokenSectionTitle>}
      <TokenSurfaceContainer 
        className={`token-surface ${scrollable ? 'scrollable' : ''} ${className}`}
        role="region"
        aria-label={ariaLabel || title}
        $hasToken={hasToken}
      >
        {isJson && jsonContent ? (
          <JSONHighlighter data={JSON.parse(jsonContent)} />
        ) : (
          children
        )}
      </TokenSurfaceContainer>
    </section>
  );
};

export default TokenSurface;
