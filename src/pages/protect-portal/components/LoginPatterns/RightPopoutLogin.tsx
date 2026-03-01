/**
 * @file RightPopoutLogin.tsx
 * @module protect-portal/components/LoginPatterns
 * @description Right-side pop-out login component
 * @version 9.11.58
 * @since 2026-02-15
 *
 * Right-side slide-out login panel for United Airlines pattern.
 */

import { FiLock, FiX } from '@icons';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import type { CorporatePortalConfig } from '../../types/CorporatePortalConfig';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const LoginOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
  visibility: ${({ $isOpen }) => ($isOpen ? 'visible' : 'hidden')};
  transition: all 0.3s ease;
  z-index: 9998;
`;

const LoginPanel = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  width: 400px;
  height: 100vh;
  background: white;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
  transform: translateX(${({ $isOpen }) => ($isOpen ? '0' : '100%')});
  transition: transform 0.3s ease;
  z-index: 9999;
  overflow-y: auto;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const PanelHeader = styled.div<{ $brandColor: string }>`
  background: ${({ $brandColor }) => $brandColor};
  color: white;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PanelTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const PanelContent = styled.div`
  padding: 2rem;
`;

const LoginForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
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
  padding: 1rem;
  font-size: 1rem;
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
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface RightPopoutLoginProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (credentials: { username: string; password: string }) => void;
	config: CorporatePortalConfig;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const RightPopoutLogin: React.FC<RightPopoutLoginProps> = ({
	isOpen,
	onClose,
	onSubmit,
	config,
}) => {
	const panelRef = useRef<HTMLDivElement>(null);
	const [formData, setFormData] = useState({
		username: '',
		password: '',
	});

	// Close panel when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
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
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const brandColor = config.branding.colors.primary;
	const accentColor = config.branding.colors.accent;

	return (
		<>
			<LoginOverlay $isOpen={isOpen} onClick={onClose} />
			<LoginPanel $isOpen={isOpen} ref={panelRef}>
				<PanelHeader $brandColor={brandColor}>
					<PanelTitle>
						<FiLock />
						{config.content.customerTerminology ? 'Customer Login' : 'Employee Login'}
					</PanelTitle>
					<CloseButton onClick={onClose}>
						<FiX />
					</CloseButton>
				</PanelHeader>

				<PanelContent>
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
				</PanelContent>
			</LoginPanel>
		</>
	);
};

export default RightPopoutLogin;
