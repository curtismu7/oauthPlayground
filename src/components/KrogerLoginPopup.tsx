import { FiEye, FiEyeOff, FiMove } from '@icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

// Kroger Brand Colors
const KROGER_COLORS = {
	red: '#E31837',
	darkRed: '#C41E3A',
	blue: '#0066CC',
	darkBlue: '#004499',
	green: '#00A651',
	darkGreen: '#008A42',
	yellow: '#FFD700',
	white: '#FFFFFF',
	lightGray: '#F5F5F5',
	darkGray: '#333333',
	black: '#000000',
};

const clampChannel = (value: number) => Math.min(255, Math.max(0, value));

const normalizeHex = (color: string): string | null => {
	if (!color || typeof color !== 'string') return null;
	if (!color.startsWith('#')) return null;
	const raw = color.slice(1);
	if (raw.length === 3) {
		return raw
			.split('')
			.map((char) => char + char)
			.join('');
	}
	if (raw.length === 6) {
		return raw;
	}
	return null;
};

const hexToRgba = (color: string, alpha: number): string => {
	const normalized = normalizeHex(color);
	const clampedAlpha = Math.min(1, Math.max(0, alpha));
	if (!normalized) {
		return `rgba(0, 0, 0, ${clampedAlpha})`;
	}
	const numeric = parseInt(normalized, 16);
	const r = (numeric >> 16) & 0xff;
	const g = (numeric >> 8) & 0xff;
	const b = numeric & 0xff;
	return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
};

const adjustColor = (color: string, amount: number): string => {
	const normalized = normalizeHex(color);
	if (!normalized) return color;
	const numeric = parseInt(normalized, 16);
	let r = (numeric >> 16) & 0xff;
	let g = (numeric >> 8) & 0xff;
	let b = numeric & 0xff;
	r = clampChannel(r + amount);
	g = clampChannel(g + amount);
	b = clampChannel(b + amount);
	const adjusted = (r << 16) | (g << 8) | b;
	return `#${adjusted.toString(16).padStart(6, '0')}`;
};

const PopupOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10000;
  padding: 20px;
`;

const PopupContainer = styled.div<{ $isDragging: boolean; $position: { x: number; y: number } }>`
  background: ${KROGER_COLORS.white};
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 420px;
  overflow: hidden;
  position: fixed;
  left: ${({ $position }) => `${$position.x}px`};
  top: ${({ $position }) => `${$position.y}px`};
  transition: ${({ $isDragging }) => ($isDragging ? 'none' : 'box-shadow 0.2s ease')};
`;

const Header = styled.div<{
	$primaryColor?: string | undefined;
	$secondaryColor?: string | undefined;
	$backgroundImage?: string | undefined;
}>`
	background: ${({ $primaryColor, $secondaryColor, $backgroundImage }) => {
		if ($backgroundImage) {
			return `linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 100%), url(${$backgroundImage}) center/cover no-repeat`;
		}
		if ($primaryColor && $secondaryColor) {
			return `linear-gradient(135deg, ${$primaryColor} 0%, ${$secondaryColor} 100%)`;
		}
		if ($primaryColor) {
			return $primaryColor;
		}
		return `linear-gradient(135deg, ${KROGER_COLORS.red} 0%, ${KROGER_COLORS.darkRed} 100%)`;
	}};
	padding: 40px 24px;
	text-align: center;
	position: relative;
	cursor: move;
	color: ${KROGER_COLORS.white};
`;

const DragHandleBar = styled.div`
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 6px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.6);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  pointer-events: none;
`;

const DragHint = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.18);
  color: ${KROGER_COLORS.white};
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 600;
  backdrop-filter: blur(6px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const LogoMark = styled.div<{
	$backgroundColor?: string | undefined;
	$borderColor?: string | undefined;
}>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${({ $backgroundColor }) => $backgroundColor ?? '#ffffff'};
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px rgba(0,0,0,0.15);
  border: ${({ $borderColor }) => ($borderColor ? `2px solid ${$borderColor}` : 'none')};
  overflow: hidden;
`;

const LogoImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const BrandWordmark = styled.div<{ $color?: string | undefined }>`
  font-size: 28px;
  font-weight: 800;
  color: ${({ $color }) => $color ?? KROGER_COLORS.white};
  letter-spacing: 1px;
`;

const Subtitle = styled.div<{ $color?: string | undefined }>`
  font-size: 14px;
  color: ${({ $color }) => $color ?? 'rgba(255, 255, 255, 0.9)'};
  font-weight: 400;
`;

const Content = styled.div<{
	$contentBackground?: string | undefined;
	$contentTextColor?: string | undefined;
}>`
  padding: 32px 28px;
  background: ${({ $contentBackground }) => $contentBackground ?? '#ffffff'};
  color: ${({ $contentTextColor }) => $contentTextColor ?? '#1f2937'};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const Input = styled.input<{ $accentColor?: string | undefined }>`
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s ease;
  background: ${KROGER_COLORS.white};
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${({ $accentColor }) => $accentColor ?? KROGER_COLORS.red};
    box-shadow: ${({ $accentColor }) => `0 0 0 3px ${$accentColor ? hexToRgba($accentColor, 0.18) : hexToRgba(KROGER_COLORS.red, 0.1)}`};
    background: #fafbff;
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const PasswordInput = styled(Input)`
  padding-right: 42px;
`;

const PasswordToggleButton = styled.button`
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;

  &:hover {
    color: ${KROGER_COLORS.red};
  }
`;

const LoginButton = styled.button<{ $accentColor?: string | undefined }>`
  background: ${({ $accentColor }) => $accentColor ?? `linear-gradient(135deg, ${KROGER_COLORS.green} 0%, ${KROGER_COLORS.darkGreen} 100%)`};
  color: ${KROGER_COLORS.white};
  border: none;
  padding: 13px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
  margin-top: 8px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: ${({ $accentColor }) => `0 8px 16px ${$accentColor ? hexToRgba($accentColor, 0.35) : 'rgba(0, 166, 81, 0.3)'}`};
    background: ${({ $accentColor }) => ($accentColor ? adjustColor($accentColor, -10) : `linear-gradient(135deg, ${KROGER_COLORS.darkGreen} 0%, ${KROGER_COLORS.green} 100%)`)};
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Footer = styled.div`
  padding: 20px 28px;
  text-align: center;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
`;

const FooterText = styled.div`
  font-size: 11px;
  color: #6b7280;
  line-height: 1.6;
  font-weight: 500;
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
  padding: 12px 14px;
  font-size: 13px;
  margin-bottom: 16px;
  font-weight: 500;
`;

const CancelLink = styled.button`
  background: none;
  border: none;
  color: ${KROGER_COLORS.blue};
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  margin-top: 16px;
  transition: color 0.2s ease;
  letter-spacing: 0.3px;

  &:hover {
    color: ${KROGER_COLORS.darkBlue};
    text-decoration: underline;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 14px;
  right: 14px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  font-size: 24px;
  color: ${KROGER_COLORS.white};
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const LoadingSpinner = styled.span`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin-right: 8px;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export interface KrogerLoginCredentials {
	username: string;
	password: string;
}

export interface KrogerBrandingOverrides {
	title?: string;
	subtitle?: string;
	primaryColor?: string;
	secondaryColor?: string;
	headerBackgroundImage?: string;
	logoUrl?: string;
	logoText?: string;
	wordmarkColor?: string;
	subtitleColor?: string;
	logoBackgroundColor?: string;
	logoBorderColor?: string;
	contentBackground?: string;
	contentTextColor?: string;
	formAccentColor?: string;
}

export interface KrogerLoginPopupProps {
	isOpen: boolean;
	onClose: () => void;
	onLogin: (credentials: KrogerLoginCredentials) => Promise<void>;
	overrides?: KrogerBrandingOverrides;
	onOpenDavinciStudio?: () => void;
}

const KrogerLoginPopup: React.FC<KrogerLoginPopupProps> = ({
	isOpen,
	onClose,
	onLogin,
	overrides,
}) => {
	const DEFAULT_USERNAME = 'curtis7';
	const DEFAULT_PASSWORD = 'Wolverine7&';

	const [username, setUsername] = useState(DEFAULT_USERNAME);
	const [password, setPassword] = useState(DEFAULT_PASSWORD);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showPassword, setShowPassword] = useState(false);
	const usernameRef = useRef<HTMLInputElement>(null);
	const popupRef = useRef<HTMLDivElement>(null);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const dragOffset = useRef({ x: 0, y: 0 });

	const clampPosition = useCallback((x: number, y: number) => {
		if (typeof window === 'undefined') {
			return { x, y };
		}

		const width = popupRef.current?.offsetWidth || 420;
		const height = popupRef.current?.offsetHeight || 520;
		const padding = 16;
		const maxX = Math.max(window.innerWidth - width - padding, padding);
		const maxY = Math.max(window.innerHeight - height - padding, padding);
		const clampedX = Math.min(Math.max(x, padding), maxX);
		const clampedY = Math.min(Math.max(y, padding), maxY);
		return { x: clampedX, y: clampedY };
	}, []);

	const handleDragStart = useCallback((event: React.MouseEvent) => {
		if (!popupRef.current) return;
		const rect = popupRef.current.getBoundingClientRect();
		dragOffset.current = {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top,
		};
		setIsDragging(true);
	}, []);

	const handleDragMove = useCallback(
		(event: MouseEvent) => {
			if (!isDragging) return;
			const newPos = clampPosition(
				event.clientX - dragOffset.current.x,
				event.clientY - dragOffset.current.y
			);
			setPosition(newPos);
		},
		[clampPosition, isDragging]
	);

	const handleDragEnd = useCallback(() => {
		setIsDragging(false);
	}, []);

	// Focus username field when popup opens
	useEffect(() => {
		if (!isOpen || typeof window === 'undefined') return;

		const centerModal = () => {
			if (!popupRef.current) return;
			const rect = popupRef.current.getBoundingClientRect();
			const width = rect.width || popupRef.current.offsetWidth || 420;
			const height = rect.height || popupRef.current.offsetHeight || 520;
			const centeredPosition = clampPosition(
				Math.round((window.innerWidth - width) / 2),
				Math.round((window.innerHeight - height) / 2)
			);
			setPosition(centeredPosition);
		};

		// Allow the modal to render before measuring
		requestAnimationFrame(() => {
			centerModal();
			if (usernameRef.current) {
				usernameRef.current.focus();
			}
		});
	}, [clampPosition, isOpen]);

	// Reset form when popup closes
	useEffect(() => {
		if (!isOpen) {
			setUsername(DEFAULT_USERNAME);
			setPassword(DEFAULT_PASSWORD);
			setError(null);
			setIsLoading(false);
			setShowPassword(false);
		}
	}, [isOpen]);

	useEffect(() => {
		if (!isDragging) {
			return;
		}

		document.addEventListener('mousemove', handleDragMove);
		document.addEventListener('mouseup', handleDragEnd);

		return () => {
			document.removeEventListener('mousemove', handleDragMove);
			document.removeEventListener('mouseup', handleDragEnd);
		};
	}, [handleDragEnd, handleDragMove, isDragging]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Prevent double-submission
		if (isLoading) {
			console.log('🔍 [KrogerLoginPopup] Already processing, ignoring duplicate submission');
			return;
		}

		if (!username.trim() || !password.trim()) {
			setError('Please enter both username and password');
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			await onLogin({ username: username.trim(), password });
			// Success - the parent component will handle closing and navigation
			// Popup should stay closed (parent closes it before calling onLogin)
			// Don't reset anything - parent handles all state
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
			setIsLoading(false); // Only reset on error so user can try again
			// Popup stays closed - user must use "Start Over" to restart flow
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Escape' && !isLoading) {
			onClose();
		}
	};

	const branding = useMemo(
		() => ({
			title: overrides?.title ?? 'Custom Login App',
			subtitle: overrides?.subtitle ?? 'Sign in with your Custom Login App',
			primaryColor: overrides?.primaryColor,
			secondaryColor: overrides?.secondaryColor,
			headerBackgroundImage: overrides?.headerBackgroundImage,
			logoUrl: overrides?.logoUrl,
			logoText: overrides?.logoText,
			wordmarkColor: overrides?.wordmarkColor,
			subtitleColor: overrides?.subtitleColor,
			logoBackgroundColor: overrides?.logoBackgroundColor,
			logoBorderColor: overrides?.logoBorderColor,
			contentBackground: overrides?.contentBackground,
			contentTextColor: overrides?.contentTextColor,
			formAccentColor: overrides?.formAccentColor,
		}),
		[overrides]
	);

	if (!isOpen) return null;

	return (
		<PopupOverlay
			onClick={(e) => {
				// Prevent closing during login process
				if (isLoading) return;
				if (e.target === e.currentTarget) {
					onClose();
				}
			}}
		>
			<PopupContainer
				onClick={(e) => e.stopPropagation()}
				onKeyDown={handleKeyDown}
				ref={popupRef}
				$isDragging={isDragging}
				$position={position}
			>
				<CloseButton
					onClick={() => {
						// Prevent closing during login process
						if (!isLoading) {
							onClose();
						}
					}}
					aria-label="Close"
					disabled={isLoading}
					style={{ opacity: isLoading ? 0.5 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
				>
					×
				</CloseButton>

				<Header
					onMouseDown={handleDragStart}
					$primaryColor={branding.primaryColor}
					$secondaryColor={branding.secondaryColor}
					$backgroundImage={branding.headerBackgroundImage}
				>
					<DragHandleBar />
					<DragHint>
						<FiMove size={14} /> Drag Window
					</DragHint>
					<LogoContainer>
						<LogoMark
							$backgroundColor={branding.logoBackgroundColor}
							$borderColor={branding.logoBorderColor}
						>
							{branding.logoUrl ? (
								<LogoImage src={branding.logoUrl} alt="Brand logo" />
							) : (
								<svg
									width="28"
									height="28"
									viewBox="0 0 24 24"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										d="M12 2l7 3v5c0 5.25-3.5 9.75-7 11-3.5-1.25-7-5.75-7-11V5l7-3z"
										fill={branding.primaryColor ?? KROGER_COLORS.red}
									/>
									<path
										d="M12 5l4 1.7V10.5c0 3.2-2.1 6.1-4 7-1.9-.9-4-3.8-4-7V6.7L12 5z"
										fill="#ffffff"
									/>
								</svg>
							)}
						</LogoMark>
						<BrandWordmark $color={branding.wordmarkColor}>
							{branding.logoText ?? branding.title}
						</BrandWordmark>
					</LogoContainer>
					<Subtitle $color={branding.subtitleColor}>{branding.subtitle}</Subtitle>
				</Header>

				<Content
					$contentBackground={branding.contentBackground}
					$contentTextColor={branding.contentTextColor}
				>
					{error && <ErrorMessage>{error}</ErrorMessage>}

					<Form onSubmit={handleSubmit}>
						<InputGroup>
							<Label htmlFor="kroger-username">Username or Email</Label>
							<InputWrapper>
								<Input
									id="kroger-username"
									ref={usernameRef}
									type="text"
									placeholder="Enter your username or email"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									disabled={isLoading}
									autoComplete="username"
									$accentColor={branding.formAccentColor}
								/>
							</InputWrapper>
						</InputGroup>

						<InputGroup>
							<Label htmlFor="kroger-password">Password</Label>
							<InputWrapper>
								<PasswordInput
									id="kroger-password"
									type={showPassword ? 'text' : 'password'}
									placeholder="Enter your password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									disabled={isLoading}
									autoComplete="current-password"
									$accentColor={branding.formAccentColor}
								/>
								<PasswordToggleButton
									type="button"
									onClick={() => setShowPassword((prev) => !prev)}
									aria-label={showPassword ? 'Hide password' : 'Show password'}
								>
									{showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
								</PasswordToggleButton>
							</InputWrapper>
						</InputGroup>

						<LoginButton type="submit" disabled={isLoading} $accentColor={branding.formAccentColor}>
							{isLoading && <LoadingSpinner />}
							{isLoading ? 'Signing In...' : 'Sign In'}
						</LoginButton>
						<CancelLink
							type="button"
							onClick={() => {
								if (!isLoading) {
									onClose();
								}
							}}
							style={{
								opacity: isLoading ? 0.5 : 1,
								cursor: isLoading ? 'not-allowed' : 'pointer',
							}}
						>
							Cancel
						</CancelLink>
					</Form>
				</Content>

				<Footer>
					<FooterText>
						This is a demo login page for testing purposes.
						<br />
						Your credentials are used for OAuth flow demonstration only.
					</FooterText>
				</Footer>
			</PopupContainer>
		</PopupOverlay>
	);
};

export default KrogerLoginPopup;
