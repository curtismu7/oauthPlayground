// src/components/FlowCard.tsx
import styled from 'styled-components';

export const FlowCard = styled.div`
  background-color: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
  border: 1px solid #e2e8f0;
  overflow: hidden;
`;

export const FlowCardHeader = styled.div`
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: #ffffff;
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const FlowCardContent = styled.div`
  padding: 2rem;
  background: #ffffff;
`;
