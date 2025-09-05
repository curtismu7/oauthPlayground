import React from 'react';
import styled from 'styled-components';

interface JSONHighlighterProps {
  data: any;
  className?: string;
}

const JSONContainer = styled.pre`
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 1rem;
  font-family: 'SFMono-Regular', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  max-width: 100%;
  overflow: hidden;
`;

const JSONKey = styled.span`
  color: #3b82f6; /* Blue for keys */
  font-weight: 500;
`;

const JSONValue = styled.span`
  color: #3b82f6; /* Blue for values */
`;

const JSONString = styled.span`
  color: #3b82f6; /* Blue for string values */
`;

const JSONNumber = styled.span`
  color: #3b82f6; /* Blue for number values */
`;

const JSONBoolean = styled.span`
  color: #3b82f6; /* Blue for boolean values */
`;

const JSONNull = styled.span`
  color: #3b82f6; /* Blue for null values */
`;

const JSONPunctuation = styled.span`
  color: #6b7280; /* Gray for punctuation */
`;

const JSONHighlighter: React.FC<JSONHighlighterProps> = ({ data, className }) => {
  const formatValue = (value: any, indent: number = 0): React.ReactNode => {
    const spaces = '  '.repeat(indent);
    
    if (value === null) {
      return <JSONNull>null</JSONNull>;
    }
    
    if (typeof value === 'boolean') {
      return <JSONBoolean>{value.toString()}</JSONBoolean>;
    }
    
    if (typeof value === 'number') {
      return <JSONNumber>{value}</JSONNumber>;
    }
    
    if (typeof value === 'string') {
      return <JSONString>"{value}"</JSONString>;
    }
    
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <JSONPunctuation>[]</JSONPunctuation>;
      }
      
      return (
        <>
          <JSONPunctuation>[</JSONPunctuation>
          <br />
          {value.map((item, index) => (
            <React.Fragment key={index}>
              {spaces}  {formatValue(item, indent + 1)}
              {index < value.length - 1 && <JSONPunctuation>,</JSONPunctuation>}
              <br />
            </React.Fragment>
          ))}
          {spaces}<JSONPunctuation>]</JSONPunctuation>
        </>
      );
    }
    
    if (typeof value === 'object') {
      const entries = Object.entries(value);
      if (entries.length === 0) {
        return <JSONPunctuation>{}</JSONPunctuation>;
      }
      
      return (
        <>
          <JSONPunctuation>{'{'}</JSONPunctuation>
          <br />
          {entries.map(([key, val], index) => (
            <React.Fragment key={key}>
              {spaces}  <JSONKey>"{key}"</JSONKey><JSONPunctuation>: </JSONPunctuation>
              {formatValue(val, indent + 1)}
              {index < entries.length - 1 && <JSONPunctuation>,</JSONPunctuation>}
              <br />
            </React.Fragment>
          ))}
          {spaces}<JSONPunctuation>{'}'}</JSONPunctuation>
        </>
      );
    }
    
    return <span>{String(value)}</span>;
  };

  return (
    <JSONContainer className={className}>
      {formatValue(data)}
    </JSONContainer>
  );
};

export default JSONHighlighter;

