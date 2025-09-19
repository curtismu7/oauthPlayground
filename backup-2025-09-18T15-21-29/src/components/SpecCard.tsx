 
import React from 'react';
import styled from 'styled-components';

// Styled SpecCard component using the design tokens
const SpecCardContainer = styled.section`
  background: var(--card-bg) !important;
  color: var(--card-fg) !important;
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  box-shadow: var(--card-shadow);
  margin: 12px 0;

  h1, h2, h3, h4, h5, h6 {
    margin: 0 0 8px 0;
    font-weight: 700;
    color: var(--card-fg) !important;
  }

  p {
    margin: 0 0 8px 0;
    color: var(--card-muted);
    line-height: 1.5;
  }

  pre, code {
    background: var(--code-bg) !important;
    color: var(--code-fg) !important;
    border-radius: 8px;
    padding: 10px 12px;
    overflow: auto;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 13px;
    line-height: 1.4;
  }

  pre {
    margin: 8px 0;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  code {
    padding: 2px 6px;
    font-size: 0.9em;
  }

  ul, ol {
    margin: 8px 0;
    padding-left: 20px;
    color: var(--card-muted);
  }

  li {
    margin: 4px 0;
    line-height: 1.5;
  }

  a {
    color: #3b82f6;
    text-decoration: underline;
  }

  a:hover {
    color: #1d4ed8;
  }

  &:focus-within {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  @media (max-width: 768px) {
    padding: 12px;
    margin: 8px 0;
    
    pre, code {
      padding: 8px 10px;
      font-size: 12px;
    }
  }

  @media print {
    background: white !important;
    color: black !important;
    border: 1px solid #ccc;
    box-shadow: none;
  }
`;

interface SpecCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}

/**
 * SpecCard component for consistent spec/info card styling
 * Provides white background with black text for optimal readability
 */
export const SpecCard: React.FC<SpecCardProps> = ({ 
  title, 
  children, 
  className = '', 
  'aria-label': ariaLabel 
}) => {
  return (
    <SpecCardContainer 
      className={`spec-card ${className}`}
      role="region"
      aria-label={ariaLabel || title}
    >
      {title && <h3 className="spec-card-title">{title}</h3>}
      <div className="spec-card-content">{children}</div>
    </SpecCardContainer>
  );
};

export default SpecCard;
