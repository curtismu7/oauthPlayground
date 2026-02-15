/**
 * @file DropdownLogin.tsx
 * @module protect-portal/components/LoginPatterns
 * @description Dropdown login component
 * @version 9.11.58
 * @since 2026-02-15
 *
 * Header dropdown login form for Southwest Airlines pattern.
 */

import React, { useRef, useEffect, useState } from 'react';
import { FiX, FiLock } from 'react-icons/fi';
import styled from 'styled-components';
import type { CorporatePortalConfig } from '../../types/CorporatePortalConfig';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const LoginDropdown = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  width: 320px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
  visibility: ${({ $isOpen }) => ($isOpen ? 'visible' : 'hidden')};
  transform: translateY(${({ $isOpen }) => ($isOpen ? '0' : '-10px')});
  transition: all 0.2s ease;
  z-index: 1000;
  margin-top: 0.5rem;
`;

const DropdownHeader = styled.div<{ $brandColor: string }>`
  background: ${({ $brandColor }) => $brandColor};
  color: white;
  padding: 1rem;
  border-radius: 8px 8px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const DropdownTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const DropdownContent = styled.div`
  padding: 1.5rem;
`;

const LoginForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const InputLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #333;
`;

const Input = styled.input<{ $brandColor: string }>`
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${({ $brandColor }) => $brandColor};
  }
`;

const LoginButton = styled.button<{ $brandColor: string; $accentColor: string }>`
  background: ${({ $accentColor }) => $accentColor};
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover {
    background: ${({ $brandColor }) => $brandColor};
  }
`;

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface DropdownLoginProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (credentials: { username: string; password: string }) => void;
  config: CorporatePortalConfig;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const DropdownLogin: React.FC<DropdownLoginProps> = ({
  isOpen,
  onClose,
  onSubmit,
  config,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const brandColor = config.branding.colors.primary;
  const accentColor = config.branding.colors.accent;

  return (
    <LoginDropdown $isOpen={isOpen} ref={dropdownRef}>
      <DropdownHeader $brandColor={brandColor}>
        <DropdownTitle>
          <FiLock />
          {config.content.customerTerminology ? 'Customer Login' : 'Employee Login'}
        </DropdownTitle>
        <CloseButton onClick={onClose}>
          <FiX />
        </CloseButton>
      </DropdownHeader>

      <DropdownContent>
        <LoginForm onSubmit={handleSubmit}>
          <InputGroup>
            <InputLabel htmlFor="username">
              {config.content.customerTerminology ? 'Customer ID' : 'Employee ID'}
            </InputLabel>
            <Input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder={`Enter your ${config.content.customerTerminology ? 'customer' : 'employee'} ID`}
              required
              $brandColor={brandColor}
            />
          </InputGroup>

          <InputGroup>
            <InputLabel htmlFor="password">Password</InputLabel>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Enter your password"
              required
              $brandColor={brandColor}
            />
          </InputGroup>

          <LoginButton type="submit" $brandColor={brandColor} $accentColor={accentColor}>
            <FiLock />
            Sign In
          </LoginButton>
        </LoginForm>
      </DropdownContent>
    </LoginDropdown>
  );
};

export default DropdownLogin;
