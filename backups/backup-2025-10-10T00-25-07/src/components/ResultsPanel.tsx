// src/components/ResultsPanel.tsx
import styled from 'styled-components';

export const SectionDivider = styled.hr`
  border: none;
  border-top: 1px dashed #d8dee9;
  margin: 2.5rem 0 2rem;
`;

export const ResultsSection = styled.div`
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const ResultsHeading = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const HelperText = styled.p`
  font-size: 0.875rem;
  color: #475569;
  margin: 0;
`;
