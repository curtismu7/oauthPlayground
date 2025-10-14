// Test component to verify V6 flow styling
import React from 'react';
import styled from 'styled-components';

const TestContainer = styled.div`
  padding: 2rem;
  background: #f9fafb;
`;

const TestButton = styled.button`
  padding: 1rem 2rem;
  margin: 1rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  
  &.v6-flow {
    background: #dcfce7 !important;
    border-left: 3px solid #22c55e !important;
    color: #166534 !important;
  }
  
  &.v6-flow:hover {
    background: #bbf7d0 !important;
    color: #15803d !important;
  }
  
  &.v6-flow.active {
    background: #bbf7d0 !important;
    color: #15803d !important;
    border-right: 3px solid #22c55e !important;
    border-left: 3px solid #22c55e !important;
  }
`;

const SidebarTest: React.FC = () => {
  return (
    <TestContainer>
      <h2>Sidebar V6 Flow Style Test</h2>
      <p>These buttons should show the green V6 flow styling:</p>
      
      <TestButton className="v6-flow">
        V6 Flow Test Button (Default)
      </TestButton>
      
      <TestButton className="v6-flow" onMouseEnter={(e) => {
        e.currentTarget.style.background = '#bbf7d0';
        e.currentTarget.style.color = '#15803d';
        e.currentTarget.style.transform = 'translateX(2px)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(34, 197, 94, 0.3)';
      }} onMouseLeave={(e) => {
        e.currentTarget.style.background = '#dcfce7';
        e.currentTarget.style.color = '#166534';
        e.currentTarget.style.transform = 'translateX(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}>
        V6 Flow Test Button (Hover Test)
      </TestButton>
      
      <TestButton className="v6-flow active">
        V6 Flow Test Button (Active)
      </TestButton>
      
      <div style={{ marginTop: '2rem', padding: '1rem', background: '#e5e7eb', borderRadius: '0.5rem' }}>
        <h3>Expected Colors:</h3>
        <ul>
          <li>Default: Light green background (#dcfce7), dark green text</li>
          <li>Hover: Lighter green background (#bbf7d0), dark green text</li>
          <li>Active: Light green background (#bbf7d0), dark green text with borders</li>
        </ul>
      </div>
    </TestContainer>
  );
};

export default SidebarTest;
