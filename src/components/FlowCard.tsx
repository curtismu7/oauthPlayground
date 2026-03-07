// src/components/FlowCard.tsx
import styled from 'styled-components';

export const FlowCard = styled.div`
  background-color: V9_COLORS.TEXT.WHITE;
  border-radius: 1rem;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  overflow: hidden;
`;

export const FlowCardHeader = styled.div`
  background: linear-gradient(135deg, V9_COLORS.PRIMARY.BLUE 0%, V9_COLORS.PRIMARY.BLUE_DARK 100%);
  color: V9_COLORS.TEXT.WHITE;
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const FlowCardContent = styled.div`
  padding: 2rem;
  background: V9_COLORS.TEXT.WHITE;
`;
