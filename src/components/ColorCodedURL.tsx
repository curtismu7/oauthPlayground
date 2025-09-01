import React from 'react';
import styled from 'styled-components';

interface ColorCodedURLProps {
  url: string;
  className?: string;
}

const URLContainer = styled.span`
  font-family: 'SFMono-Regular', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  word-break: break-all;
  white-space: pre-wrap;
`;

const URLPart = styled.span<{ type: 'base' | 'question' | 'ampersand' | 'param' | 'equals' | 'value' }>`
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
          color: #059669; /* Green for parameter names */
          font-weight: 500;
        `;
      case 'equals':
        return `
          color: #7c3aed; /* Purple for = */
          font-weight: 400;
        `;
      case 'value':
        return `
          color: #dc2626; /* Red for parameter values */
          font-weight: 400;
        `;
      default:
        return '';
    }
  }}
`;

export const ColorCodedURL: React.FC<ColorCodedURLProps> = ({ url, className }) => {
  if (!url || typeof url !== 'string') {
    return <span className={className}>{url}</span>;
  }

  // Split URL into base and query parts
  const [basePart, queryPart] = url.split('?');

  const parts: JSX.Element[] = [];

  // Add base URL part
  if (basePart) {
    parts.push(
      <URLPart key="base" type="base">
        {basePart}
      </URLPart>
    );
  }

  // Add query part if it exists
  if (queryPart) {
    parts.push(
      <URLPart key="question-mark" type="question">
        ?
      </URLPart>
    );

    // Split query parameters
    const params = queryPart.split('&');
    params.forEach((param, index) => {
      if (index > 0) {
        parts.push(
          <URLPart key={`amp-${index}`} type="ampersand">
            &
          </URLPart>
        );
      }

      const [key, value] = param.split('=');
      if (key) {
        parts.push(
          <URLPart key={`key-${index}`} type="param">
            {key}
          </URLPart>
        );
      }
      if (value) {
        parts.push(
          <URLPart key={`equals-${index}`} type="equals">
            =
          </URLPart>
        );
        parts.push(
          <URLPart key={`value-${index}`} type="value">
            {value}
          </URLPart>
        );
      }
    });
  }

  return (
    <URLContainer className={className}>
      {parts}
    </URLContainer>
  );
};

export default ColorCodedURL;
