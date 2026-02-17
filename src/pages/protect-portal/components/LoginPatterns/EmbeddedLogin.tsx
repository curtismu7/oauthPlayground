/**
 * @file EmbeddedLogin.tsx
 * @module protect-portal/components/LoginPatterns
 * @description Authentic embedded login component matching real banking websites
 * @version 9.11.64
 * @since 2026-02-15
 *
 * Authentic embedded login form that matches real Bank of America online banking experience.
 */

import React, { useState } from 'react';
import { FiLock, FiShield, FiEye, FiEyeOff, FiUser, FiKey } from 'react-icons/fi';
import styled from 'styled-components';
import type { CorporatePortalConfig } from '../../types/CorporatePortalConfig';

// ============================================================================
// STYLED COMPONENTS - Real Banking Website Design
// ============================================================================

const LoginContainer = styled.div<{ $brandColor: string }>`
  background: white;
  border-radius: 8px;
  padding: 2.5rem;
  max-width: 450px;
  margin: 0 auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${({ $brandColor }) => $brandColor};
    border-radius: 8px 8px 0 0;
  }
`;

const SecurityBanner = styled.div<{ $brandColor: string }>`
  background: ${({ $brandColor }) => $brandColor}10;
  border: 1px solid ${({ $brandColor }) => $brandColor}30;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const SecurityIcon = styled.div<{ $brandColor: string }>`
  width: 40px;
  height: 40px;
  background: ${({ $brandColor }) => $brandColor};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
`;

const SecurityText = styled.div`
  flex: 1;
`;

const SecurityTitle = styled.div`
  font-weight: 600;
  color: #1f2937;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
`;

const SecurityMessage = styled.div`
  color: #6b7280;
  font-size: 0.75rem;
  line-height: 1.4;
`;

const LoginForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const InputGroup = styled.div`
  position: relative;
`;

const InputLabel = styled.label`
  display: block;
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
`;

const InputWrapper = styled.div`
  position: relative;
`;

const Input = styled.input<{ $brandColor?: string }>`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${({ $brandColor }) => $brandColor || '#0066CC'};
    box-shadow: 0 0 0 3px ${({ $brandColor }) => $brandColor || '#0066CC'}20;
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const InputIcon = styled.div`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TogglePassword = styled.button`
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

const RememberMeGroup = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const CheckboxGroup = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: #374151;
`;

const Checkbox = styled.input<{ $brandColor?: string }>`
  width: 1rem;
  height: 1rem;
  accent-color: ${({ $brandColor }) => $brandColor || '#0066CC'};
`;

const ForgotPassword = styled.a<{ $brandColor: string }>`
  color: ${({ $brandColor }) => $brandColor};
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
  }
`;

const LoginButton = styled.button<{ $brandColor: string }>`
  background: ${({ $brandColor }) => $brandColor};
  color: white;
  border: none;
  border-radius: 6px;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover {
    background: ${({ $brandColor }) => {
			// Darken the brand color for hover
			const color = $brandColor;
			if (color === '#012169') return '#011a58'; // Bank of America blue
			if (color === '#0033A0') return '#002880'; // United blue
			if (color === '#0b4aa2') return '#073a80'; // American blue
			if (color === '#304CB2') return '#253a8a'; // Southwest blue
			return color;
		}};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: 1.5rem 0;
  color: #9ca3af;
  font-size: 0.875rem;
`;

const DividerLine = styled.div`
  flex: 1;
  height: 1px;
  background: #e5e7eb;
`;

const DividerText = styled.span`
  padding: 0 1rem;
`;

const AlternativeOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const AlternativeButton = styled.button<{ $brandColor: string }>`
  background: white;
  color: ${({ $brandColor }) => $brandColor};
  border: 1px solid ${({ $brandColor }) => $brandColor};
  border-radius: 6px;
  padding: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover {
    background: ${({ $brandColor }) => $brandColor}10;
  }
`;

const HelpText = styled.div`
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
  text-align: center;
  color: #6b7280;
  font-size: 0.75rem;
  line-height: 1.5;
`;

const HelpLink = styled.a<{ $brandColor: string }>`
  color: ${({ $brandColor }) => $brandColor};
  text-decoration: none;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
  }
`;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const EmbeddedLogin: React.FC<{
	onSubmit: (credentials: { username: string; password: string }) => void;
	config: CorporatePortalConfig;
}> = ({ onSubmit, config }) => {
	const [formData, setFormData] = useState({
		username: '',
		password: '',
		rememberMe: false,
	});
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const brandColor = config.branding.colors.primary;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		// Simulate authentication delay
		setTimeout(() => {
			onSubmit(formData);
			setIsLoading(false);
		}, 1000);
	};

	const handleInputChange = (field: string, value: string | boolean) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	return (
		<LoginContainer $brandColor={brandColor}>
			<SecurityBanner $brandColor={brandColor}>
				<SecurityIcon $brandColor={brandColor}>
					<FiShield size={20} />
				</SecurityIcon>
				<SecurityText>
					<SecurityTitle>Secure Sign-In</SecurityTitle>
					<SecurityMessage>
						Your information is protected with industry-standard encryption
					</SecurityMessage>
				</SecurityText>
			</SecurityBanner>

			<LoginForm onSubmit={handleSubmit}>
				<InputGroup>
					<InputLabel htmlFor="username">Online ID</InputLabel>
					<InputWrapper>
						<InputIcon>
							<FiUser size={16} />
						</InputIcon>
						<Input
							id="username"
							type="text"
							placeholder="Enter your Online ID"
							value={formData.username}
							onChange={(e) => handleInputChange('username', e.target.value)}
							required
						/>
					</InputWrapper>
				</InputGroup>

				<InputGroup>
					<InputLabel htmlFor="password">Passcode</InputLabel>
					<InputWrapper>
						<InputIcon>
							<FiKey size={16} />
						</InputIcon>
						<Input
							id="password"
							type={showPassword ? 'text' : 'password'}
							placeholder="Enter your Passcode"
							value={formData.password}
							onChange={(e) => handleInputChange('password', e.target.value)}
							required
						/>
						<TogglePassword
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							aria-label={showPassword ? 'Hide password' : 'Show password'}
						>
							{showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
						</TogglePassword>
					</InputWrapper>
				</InputGroup>

				<RememberMeGroup>
					<CheckboxGroup>
						<Checkbox
							type="checkbox"
							id="remember"
							checked={formData.rememberMe}
							onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
							$brandColor={brandColor}
						/>
						<label htmlFor="remember">Save Online ID</label>
					</CheckboxGroup>
					<ForgotPassword href="#" $brandColor={brandColor}>
						Forgot Passcode?
					</ForgotPassword>
				</RememberMeGroup>

				<LoginButton type="submit" $brandColor={brandColor} disabled={isLoading}>
					<FiLock />
					{isLoading ? 'Signing In...' : 'Sign In'}
				</LoginButton>
			</LoginForm>

			<Divider>
				<DividerLine />
				<DividerText>OR</DividerText>
				<DividerLine />
			</Divider>

			<AlternativeOptions>
				<AlternativeButton type="button" $brandColor={brandColor}>
					<FiShield size={16} />
					Sign In with Face ID
				</AlternativeButton>
				<AlternativeButton type="button" $brandColor={brandColor}>
					<FiShield size={16} />
					Sign In with Touch ID
				</AlternativeButton>
			</AlternativeOptions>

			<HelpText>
				New to {config.company.displayName}?{' '}
				<HelpLink href="#" $brandColor={brandColor}>
					Enroll in Online Banking
				</HelpLink>
			</HelpText>
		</LoginContainer>
	);
};

export default EmbeddedLogin;
