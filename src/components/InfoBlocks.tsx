// src/components/InfoBlocks.tsx
import styled from 'styled-components';

export const ExplanationSection = styled.div`
  background: V9_COLORS.BG.GRAY_MEDIUM;
  border-left: 4px solid V9_COLORS.PRIMARY.BLUE;
  border-radius: 0 12px 12px 0;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

export const ExplanationHeading = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: V9_COLORS.TEXT.GRAY_DARK;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const CalloutCard = styled.div`
  background: V9_COLORS.BG.GRAY_LIGHT;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const FlowDiagram = styled.div`
  background: V9_COLORS.TEXT.WHITE;
  border: 2px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 12px;
  padding: 1.75rem;
  margin: 2rem 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const FlowStep = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: V9_COLORS.BG.GRAY_LIGHT;
  border-radius: 8px;
  border-left: 4px solid V9_COLORS.PRIMARY.BLUE;
`;

export const FlowStepNumber = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: V9_COLORS.PRIMARY.BLUE;
  color: V9_COLORS.TEXT.WHITE;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
`;

export const FlowStepContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  color: V9_COLORS.TEXT.GRAY_DARK;
`;
