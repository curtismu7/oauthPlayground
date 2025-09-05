import React from 'react';

interface JSONHighlighterProps {
  jsonString: string;
  className?: string;
}

const JSONHighlighter: React.FC<JSONHighlighterProps> = ({ jsonString, className }) => {
  const highlightJSON = (json: string) => {
    try {
      // Parse and re-stringify to ensure valid JSON formatting
      const parsed = JSON.parse(json);
      const formatted = JSON.stringify(parsed, null, 2);
      
      // Split by lines and process each line
      return formatted.split('\n').map((line, lineIndex) => {
        // Match JSON key-value pairs
        const keyValueRegex = /^(\s*)"([^"]+)":\s*(.+)$/;
        const match = line.match(keyValueRegex);
        
        if (match) {
          const [, indent, key, value] = match;
          return (
            <div key={lineIndex} style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}>
              <span style={{ color: '#1f2937' }}>{indent}</span>
              <span style={{ color: '#1f2937' }}>"</span>
              <span style={{ color: '#2563eb', fontWeight: '600' }}>{key}</span>
              <span style={{ color: '#1f2937' }}>": </span>
              <span style={{ color: '#dc2626' }}>{value}</span>
            </div>
          );
        }
        
        // Handle array/object brackets and commas
        const bracketRegex = /^(\s*)([\[\]{}])(.*)$/;
        const bracketMatch = line.match(bracketRegex);
        
        if (bracketMatch) {
          const [, indent, bracket, rest] = bracketMatch;
          return (
            <div key={lineIndex} style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}>
              <span style={{ color: '#1f2937' }}>{indent}</span>
              <span style={{ color: '#6b7280', fontWeight: '600' }}>{bracket}</span>
              <span style={{ color: '#1f2937' }}>{rest}</span>
            </div>
          );
        }
        
        // Handle commas
        if (line.includes(',')) {
          return (
            <div key={lineIndex} style={{ color: '#6b7280', wordBreak: 'break-all', overflowWrap: 'break-word' }}>
              {line}
            </div>
          );
        }
        
        // Default styling for other lines
        return (
          <div key={lineIndex} style={{ color: '#1f2937', wordBreak: 'break-all', overflowWrap: 'break-word' }}>
            {line}
          </div>
        );
      });
    } catch (error) {
      // If JSON parsing fails, return the original string
      return <div style={{ color: '#dc2626', wordBreak: 'break-all', overflowWrap: 'break-word' }}>{jsonString}</div>;
    }
  };

  return (
    <div 
      className={className}
      style={{
        wordBreak: 'break-all',
        overflowWrap: 'break-word',
        whiteSpace: 'pre-wrap',
        maxWidth: '100%',
        overflow: 'hidden'
      }}
    >
      {highlightJSON(jsonString)}
    </div>
  );
};

export default JSONHighlighter;



