// src/components/InfoBlocks.tsx
import styled from 'styled-components';

export const ExplanationSection = styled.div`
  background: #f1f5f9;
  border-left: 4px solid #3b82f6;
  border-radius: 0 12px 12px 0;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

export const ExplanationHeading = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const CalloutCard = styled.div`
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const FlowDiagram = styled.div`
  background: #ffffff;
  border: 2px solid #e5e7eb;
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
  background: #f8fafc;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
`;

export const FlowStepNumber = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #3b82f6;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
`;

export const FlowStepContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  color: #0f172a;
`;
