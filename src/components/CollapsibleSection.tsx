import React, { useState } from 'react';
import styled from 'styled-components';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  icon?: string;
  className?: string;
}

const SectionContainer = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'collapsed' && prop !== '$collapsed'
})<{ $collapsed: boolean }>`
  margin-bottom: 2rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  overflow: hidden;
  transition: all 0.3s ease;
`;

const SectionHeader = styled.div`
  padding: 1.5rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background-color 0.2s ease;

  &:hover {
    background: #f1f3f4;
  }
`;

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
`;

const TitleText = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Subtitle = styled.p`
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 400;
`;

const ChevronIcon = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'collapsed' && prop !== '$collapsed'
})<{ $collapsed: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 8px;
  background: #eff6ff;
  border: 2px solid #3b82f6;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
  transition: all 0.2s ease;
  transform: ${({ $collapsed }) => $collapsed ? 'rotate(0deg)' : 'rotate(90deg)'};
  cursor: pointer;

  svg {
    font-size: 1.25rem;
    color: #3b82f6;
  }

  &:hover {
    background: #dbeafe;
    border-color: #1d4ed8;
    transform: ${({ $collapsed }) => $collapsed ? 'rotate(0deg) scale(1.1)' : 'rotate(90deg) scale(1.1)'};
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
    
    svg {
      color: #1d4ed8;
    }
  }
  
  &:active {
    transform: ${({ $collapsed }) => $collapsed ? 'rotate(0deg) scale(1.05)' : 'rotate(90deg) scale(1.05)'};
  }
`;

const SectionContent = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'collapsed' && prop !== '$collapsed'
})<{ $collapsed: boolean }>`
  padding: ${({ $collapsed }) => $collapsed ? '0' : '1.5rem'};
  max-height: ${({ $collapsed }) => $collapsed ? '0' : 'none'};
  overflow: hidden;
  opacity: ${({ $collapsed }) => $collapsed ? '0' : '1'};
  visibility: ${({ $collapsed }) => $collapsed ? 'hidden' : 'visible'};
  transition: all 0.3s ease;
`;

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  subtitle,
  children,
  defaultCollapsed = true,
  icon,
  className
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const handleToggle = () => {
    setCollapsed(!collapsed);
  };

  return (
    <SectionContainer $collapsed={collapsed} className={className}>
      <SectionHeader onClick={handleToggle}>
        <SectionTitle>
          <TitleText>
            {icon && <span>{icon}</span>}
            {title}
          </TitleText>
          {subtitle && <Subtitle>{subtitle}</Subtitle>}
        </SectionTitle>
        <ChevronIcon $collapsed={collapsed}>
          {collapsed ? <FiChevronRight size={16} /> : <FiChevronDown size={16} />}
        </ChevronIcon>
      </SectionHeader>
      <SectionContent $collapsed={collapsed}>
        {children}
      </SectionContent>
    </SectionContainer>
  );
};

export default CollapsibleSection;
