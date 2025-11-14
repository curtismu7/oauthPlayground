// src/pages/flows/kroger/krogerFlowStyles.tsx

import styled from 'styled-components';

export const Container = styled.div`
	min-height: 100vh;
	background-color: #f9fafb;
	padding: 2rem 0 6rem;
`;

export const ContentWrapper = styled.div`
	max-width: 90rem;
	margin: 0 auto;
	padding: 0 1rem;
`;

export const HeroWrapper = styled.section`
	margin: 0 auto 2.5rem;
	padding: 2.75rem 2.25rem;
	border-radius: 28px;
	background: linear-gradient(145deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%);
	color: white;
	text-align: center;
	box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
	width: 100%;
`;

export const HeroBadge = styled.span`
	display: inline-block;
	background: rgba(255, 255, 255, 0.2);
	color: white;
	padding: 0.5rem 1rem;
	border-radius: 50px;
	font-size: 0.875rem;
	font-weight: 600;
	margin-bottom: 1.5rem;
	backdrop-filter: blur(10px);
`;

export const HeroTitle = styled.h1`
	font-size: 3rem;
	font-weight: 800;
	margin: 0 0 1rem;
	background: linear-gradient(to right, #ffffff, #e0e7ff);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
`;

export const HeroSubtitle = styled.p`
	font-size: 1.25rem;
	margin: 0 0 2rem;
	opacity: 0.9;
	line-height: 1.6;
`;

export const HeroFooter = styled.p`
	margin: 2rem 0 0;
	opacity: 0.8;
	font-size: 0.875rem;
`;

export const HeroLogoRow = styled.div`
	margin-top: 2rem;
	display: flex;
	justify-content: center;
	align-items: center;
`;

export const StepSection = styled.section`
	background: white;
	border-radius: 12px;
	margin-bottom: 2rem;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	overflow: hidden;
`;

export const AuthSection = styled.div`
	padding: 1.5rem;
	background: #f8fafc;
	border-radius: 8px;
	margin: 1rem 0;
`;

export const RadioGroup = styled.div`
	display: flex;
	gap: 1.5rem;
	margin: 1rem 0;
`;

export const RadioLabel = styled.label`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	cursor: pointer;
	font-weight: 500;
	color: #374151;

	input[type='radio'] {
		width: 1rem;
		height: 1rem;
	}
`;

export const KrogerLoginOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 25%, #f1f5f9 100%);
	display: flex;
	flex-direction: column;
	z-index: 1000;
	animation: fadeIn 0.3s ease-out;

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
`;

export const KrogerHeader = styled.div`
	background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%);
	color: white;
	padding: 1rem 2rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
	box-shadow: 0 4px 12px rgba(220, 38, 38, 0.15);
	position: relative;

	&::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%);
	}
`;

export const KrogerLogo = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	font-size: 1.5rem;
	font-weight: 800;
	letter-spacing: -0.025em;
	text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

	svg {
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
	}
`;

export const KrogerNav = styled.div`
	display: flex;
	align-items: center;
	gap: 2rem;
`;

export const SearchBox = styled.div`
	display: flex;
	align-items: center;
	background: rgba(255, 255, 255, 0.95);
	border-radius: 24px;
	padding: 0.625rem 1.25rem;
	min-width: 350px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	backdrop-filter: blur(8px);
	border: 1px solid rgba(255, 255, 255, 0.2);
	transition: all 0.2s ease;

	&:focus-within {
		background: white;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
		transform: translateY(-1px);
	}

	input {
		border: none;
		outline: none;
		flex: 1;
		margin-left: 0.5rem;
		color: #374151;
		font-size: 0.95rem;

		&::placeholder {
			color: #6b7280;
		}
	}
`;

export const NavItem = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	cursor: pointer;
	padding: 0.625rem 1rem;
	border-radius: 8px;
	transition: all 0.2s ease;
	font-weight: 500;
	font-size: 0.95rem;

	&:hover {
		background: rgba(255, 255, 255, 0.15);
		transform: translateY(-1px);
	}

	svg {
		transition: transform 0.2s ease;
	}

	&:hover svg {
		transform: scale(1.1);
	}
`;

export const LoginContainer = styled.div`
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 2rem;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="%23e2e8f0" stroke-width="1" opacity="0.3"/></pattern></defs><rect width="100%" height="100%" fill="url(%23grid)"/></svg>');
		opacity: 0.5;
		z-index: -1;
	}
`;

export const LoginCard = styled.div`
	background: white;
	padding: 3rem;
	border-radius: 20px;
	box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
	width: 100%;
	max-width: 440px;
	position: relative;
	border: 1px solid rgba(255, 255, 255, 0.2);
	backdrop-filter: blur(20px);
	animation: slideUp 0.4s ease-out;

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: linear-gradient(90deg, #dc2626 0%, #f59e0b 50%, #dc2626 100%);
		border-radius: 20px 20px 0 0;
	}
`;

export const LoginTitle = styled.h2`
	font-size: 2rem;
	font-weight: 800;
	color: #1f2937;
	margin: 0 0 2.5rem 0;
	text-align: center;
	position: relative;

	&::after {
		content: '';
		position: absolute;
		bottom: -0.5rem;
		left: 50%;
		transform: translateX(-50%);
		width: 60px;
		height: 3px;
		background: linear-gradient(90deg, #dc2626 0%, #f59e0b 100%);
		border-radius: 2px;
	}
`;

export const FormGroup = styled.div`
	margin-bottom: 2rem;
	position: relative;
`;

export const Label = styled.label`
	display: block;
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.75rem;
	font-size: 0.875rem;
	text-transform: uppercase;
	letter-spacing: 0.025em;
`;

export const InputWrapper = styled.div`
	position: relative;
	display: flex;
	align-items: center;
`;

export const Input = styled.input`
	width: 100%;
	padding: 1rem 1.25rem;
	border: 2px solid #e5e7eb;
	border-radius: 12px;
	font-size: 1rem;
	transition: all 0.2s ease;
	background: #fafafa;
	font-weight: 500;

	&:focus {
		outline: none;
		border-color: #dc2626;
		box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.1);
		background: white;
		transform: translateY(-1px);
	}

	&:hover:not(:focus) {
		border-color: #d1d5db;
		background: white;
	}

	&::placeholder {
		color: #9ca3af;
		font-weight: 400;
	}

	&[type='password'] {
		padding-right: 3rem;
	}
`;

export const PasswordToggle = styled.button`
	position: absolute;
	right: 1rem;
	top: 50%;
	transform: translateY(-50%);
	background: none;
	border: none;
	color: #6b7280;
	cursor: pointer;
	padding: 0.5rem;
	display: flex;
	align-items: center;
	border-radius: 8px;
	transition: all 0.2s ease;
	z-index: 2;

	&:hover {
		color: #dc2626;
		background: rgba(220, 38, 38, 0.05);
		transform: translateY(-50%) scale(1.1);
	}

	&:active {
		transform: translateY(-50%) scale(0.95);
	}
`;

export const HelperText = styled.p`
	font-size: 0.8rem;
	color: #6b7280;
	margin: 0.75rem 0 0 0;
	font-weight: 400;
	line-height: 1.4;
`;

export const LoginButton = styled.button`
	width: 100%;
	background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
	color: white;
	border: none;
	padding: 1.25rem;
	border-radius: 12px;
	font-size: 1.1rem;
	font-weight: 700;
	cursor: pointer;
	margin: 2rem 0 1.5rem 0;
	transition: all 0.2s ease;
	text-transform: uppercase;
	letter-spacing: 0.025em;
	box-shadow: 0 4px 14px 0 rgba(220, 38, 38, 0.3);
	position: relative;
	overflow: hidden;

	&:not(:disabled) {
		&:hover {
			background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
			transform: translateY(-2px);
			box-shadow: 0 8px 20px 0 rgba(220, 38, 38, 0.4);
		}

		&:active {
			transform: translateY(0);
			box-shadow: 0 4px 14px 0 rgba(220, 38, 38, 0.3);
		}
	}

	&:disabled {
		background: #9ca3af;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		transition: left 0.5s;
	}

	&:hover:not(:disabled)::before {
		left: 100%;
	}
`;

export const SignUpLink = styled.p`
	text-align: center;
	color: #6b7280;
	font-size: 0.9rem;
	margin: 0;
	font-weight: 400;

	a {
		color: #dc2626;
		text-decoration: none;
		font-weight: 600;
		transition: all 0.2s ease;

		&:hover {
			color: #b91c1c;
			text-decoration: underline;
		}
	}
`;

export const CloseButton = styled.button`
	position: absolute;
	top: 1.25rem;
	right: 1.25rem;
	background: rgba(107, 114, 128, 0.1);
	border: none;
	font-size: 1.5rem;
	color: #6b7280;
	cursor: pointer;
	padding: 0.75rem;
	border-radius: 50%;
	width: 2.5rem;
	height: 2.5rem;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s ease;

	&:hover {
		background: rgba(220, 38, 38, 0.1);
		color: #dc2626;
		transform: rotate(90deg) scale(1.1);
	}

	&:active {
		transform: rotate(90deg) scale(0.95);
	}
`;

export const ErrorMessage = styled.div`
	background: linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%);
	color: #dc2626;
	padding: 1rem 1.25rem;
	border-radius: 12px;
	margin: 1.5rem 0;
	border: 1px solid #fecaca;
	font-weight: 500;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	box-shadow: 0 2px 8px rgba(220, 38, 38, 0.1);
	white-space: pre-wrap;

	&::before {
		content: '⚠️';
		font-size: 1.2rem;
	}
`;

export const SuccessMessage = styled.div`
	background: linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%);
	color: #16a34a;
	padding: 1rem 1.25rem;
	border-radius: 12px;
	margin: 1.5rem 0;
	border: 1px solid #bbf7d0;
	font-weight: 500;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	box-shadow: 0 2px 8px rgba(22, 163, 74, 0.1);

	&::before {
		content: '✅';
		font-size: 1.2rem;
	}
`;

export const MissingConfigCard = styled.div`
	border: 1px dashed #cbd5f5;
	border-radius: 12px;
	padding: 1.5rem;
	background: #f8fafc;
	color: #1e3a8a;
	font-size: 0.95rem;
	line-height: 1.6;
`;


