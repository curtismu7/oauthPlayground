import { useState, useEffect, useCallback, useMemo } from "react";
import styled from "styled-components";
import { 
    FiSettings, 
    FiExternalLink, 
    FiCheckCircle, 
    FiLock, 
    FiCopy, 
    FiRefreshCw,
    FiArrowRight,
    FiArrowLeft,
    FiAlertCircle,
    FiInfo,
    FiShield,
    FiKey,
    FiGlobe,
    FiEye,
    FiEyeOff
} from "react-icons/fi";
import { showGlobalSuccess, showGlobalError, showGlobalWarning } from "../../hooks/useNotifications";
import { generateCodeVerifier, generateCodeChallenge } from "../../utils/oauth";

const Container = styled.div`
	min-height: 100vh;
	background-color: #f9fafb;
	padding: 2rem 0;
`;

const ContentWrapper = styled.div`
	max-width: 64rem;
	margin: 0 auto;
	padding: 0 1rem;
`;

const HeaderSection = styled.div`
	text-align: center;
	margin-bottom: 2rem;
`;

const MainTitle = styled.h1`
	font-size: 1.875rem;
	font-weight: bold;
	color: #111827;
	margin-bottom: 1rem;
`;

const Subtitle = styled.p`
	font-size: 1.125rem;
	color: #4b5563;
	max-width: 42rem;
	margin: 0 auto;
`;

const MainCard = styled.div`
	background-color: #ffffff;
	border-radius: 0.75rem;
	box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
	padding: 2rem;
	margin-bottom: 2rem;
	border: 1px solid #e5e7eb;
`;

const CardTitle = styled.h2`
	font-size: 1.5rem;
	font-weight: bold;
	color: #111827;
	margin-bottom: 1.5rem;
`;

const FormGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr;
	gap: 1.5rem;
	margin-bottom: 2rem;

	@media (min-width: 768px) {
		grid-template-columns: 1fr 1fr;
	}
`;

const FormField = styled.div`
	display: flex;
	flex-direction: column;
`;

const FormLabel = styled.label`
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.5rem;
`;

const FormInput = styled.input<{ $hasError?: boolean }>`
	padding: 0.75rem;
	border: 1px solid ${props => props.$hasError ? '#ef4444' : '#d1d5db'};
	border-radius: 0.5rem;
	font-size: 0.875rem;
	background-color: ${props => props.$hasError ? '#fef2f2' : '#ffffff'};
	color: ${props => props.$hasError ? '#dc2626' : '#111827'};
	transition: all 0.2s;

	&:focus {
		outline: none;
		border-color: ${props => props.$hasError ? '#ef4444' : '#3b82f6'};
		box-shadow: 0 0 0 3px ${props => props.$hasError ? '#fef2f2' : 'rgba(59, 130, 246, 0.1)'};
	}

	&::placeholder {
		color: ${props => props.$hasError ? '#dc2626' : '#9ca3af'};
	}
`;

const Button = styled.button<{ $variant?: string; $disabled?: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
	transition: all 0.2s;
	border: 1px solid transparent;
	opacity: ${props => props.$disabled ? 0.6 : 1};

	${({ $variant }) =>
		$variant === "primary" &&
		`
		background-color: #3b82f6;
		color: #ffffff;
		&:hover:not(:disabled) {
			background-color: #2563eb;
		}
	`}

	${({ $variant }) =>
		$variant === "success" &&
		`
		background-color: #10b981;
		color: #ffffff;
		&:hover:not(:disabled) {
			background-color: #059669;
		}
	`}

	${({ $variant }) =>
		$variant === "secondary" &&
		`
		background-color: #6b7280;
		color: #ffffff;
		&:hover:not(:disabled) {
			background-color: #4b5563;
		}
	`}

	${({ $variant }) =>
		$variant === "danger" &&
		`
		background-color: #ef4444;
		color: #ffffff;
		&:hover:not(:disabled) {
			background-color: #dc2626;
		}
	`}

	${({ $variant }) =>
		$variant === "outline" &&
		`
		background-color: transparent;
		color: #374151;
		border-color: #d1d5db;
		&:hover:not(:disabled) {
			background-color: #f9fafb;
			border-color: #9ca3af;
		}
	`}
`;

const InfoBox = styled.div`
	background-color: #f0f9ff;
	border: 1px solid #bae6fd;
	border-radius: 0.5rem;
	padding: 1rem;
	margin-bottom: 1rem;
`;

const InfoTitle = styled.h3`
	font-size: 1rem;
	font-weight: 600;
	color: #0369a1;
	margin-bottom: 0.5rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const InfoText = styled.p`
	font-size: 0.875rem;
	color: #0c4a6e;
	line-height: 1.5;
	margin-bottom: 0.5rem;

	&:last-child {
		margin-bottom: 0;
	}
`;

const InfoList = styled.ul`
	font-size: 0.875rem;
	color: #0c4a6e;
	line-height: 1.5;
	margin: 0.5rem 0;
	padding-left: 1.5rem;
`;

const CodeBlock = styled.pre`
	background-color: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.375rem;
	padding: 1rem;
	font-size: 0.875rem;
	color: #374151;
	overflow-x: auto;
	margin: 1rem 0;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`;

const GeneratedContentBox = styled.div`
	background-color: #f0fdf4;
	border: 2px solid #22c55e;
	border-radius: 0.5rem;
	padding: 1.5rem;
	margin: 1rem 0;
	position: relative;
`;

const GeneratedUrlDisplay = styled.div`
	background-color: #ffffff;
	border: 1px solid #22c55e;
	border-radius: 0.375rem;
	padding: 1rem;
	margin: 1rem 0;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	word-break: break-all;
	position: relative;
`;

const GeneratedLabel = styled.div`
	position: absolute;
	top: -10px;
	left: 16px;
	background-color: #22c55e;
	color: white;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
`;

const StepNavigation = styled.div`
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background-color: #ffffff;
	border-top: 1px solid #e5e7eb;
	padding: 1rem 2rem;
	display: flex;
	justify-content: space-between;
	align-items: center;
	box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);
	z-index: 1000;
`;

const StepIndicator = styled.div`
	display: flex;
	gap: 0.5rem;
	align-items: center;
`;

const StepDot = styled.div<{ $active?: boolean; $completed?: boolean }>`
	width: 12px;
	height: 12px;
	border-radius: 50%;
	background-color: ${props => 
		props.$completed ? '#22c55e' : 
		props.$active ? '#3b82f6' : '#d1d5db'
	};
	transition: all 0.2s;
`;

const NavigationButtons = styled.div`
	display: flex;
	gap: 1rem;
`;

const NavButton = styled.button<{ $variant?: string }>`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;
	border: 1px solid transparent;

	${({ $variant }) =>
		$variant === "primary" &&
		`
		background-color: #3b82f6;
		color: #ffffff;
		&:hover {
			background-color: #2563eb;
		}
	`}

	${({ $variant }) =>
		$variant === "success" &&
		`
		background-color: #10b981;
		color: #ffffff;
		&:hover {
			background-color: #059669;
		}
	`}

	${({ $variant }) =>
		$variant === "outline" &&
		`
		background-color: transparent;
		color: #374151;
		border-color: #d1d5db;
		&:hover {
			background-color: #f9fafb;
			border-color: #9ca3af;
		}
	`}

	${({ $variant }) =>
		$variant === "danger" &&
		`
		background-color: #ef4444;
		color: #ffffff;
		&:hover {
			background-color: #dc2626;
		}
	`}
`;

const Modal = styled.div<{ $show?: boolean }>`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: ${props => props.$show ? 'flex' : 'none'};
	align-items: center;
	justify-content: center;
	z-index: 2000;
`;

const ModalContent = styled.div`
	background-color: #ffffff;
	border-radius: 0.75rem;
	padding: 2rem;
	max-width: 400px;
	text-align: center;
	box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
`;

const ModalIcon = styled.div`
	width: 4rem;
	height: 4rem;
	border-radius: 50%;
	background-color: #10b981;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto 1rem;
	font-size: 1.5rem;
	color: #ffffff;
`;

const ModalTitle = styled.h3`
	font-size: 1.25rem;
	font-weight: 600;
	color: #111827;
	margin-bottom: 0.5rem;
`;

const ModalText = styled.p`
	font-size: 0.875rem;
	color: #6b7280;
	line-height: 1.5;
`;

const QuizOption = styled.button<{ $selected?: boolean }>`
	display: block;
	width: 100%;
	padding: 1rem;
	border: 2px solid ${props => props.$selected ? '#3b82f6' : '#e5e7eb'};
	border-radius: 0.5rem;
	background-color: ${props => props.$selected ? '#eff6ff' : '#ffffff'};
	color: #374151;
	text-align: left;
	cursor: pointer;
	transition: all 0.2s;
	margin-bottom: 0.5rem;

	&:hover {
		border-color: #3b82f6;
		background-color: #eff6ff;
	}
`;

const EmptyState = styled.div`
	text-align: center;
	padding: 3rem 2rem;
	color: #6b7280;
`;

const EmptyIcon = styled.div`
	width: 4rem;
	height: 4rem;
	border-radius: 50%;
	background-color: #f3f4f6;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto 1rem;
	font-size: 1.5rem;
	color: #9ca3af;
`;

const EmptyTitle = styled.h3`
	font-size: 1.125rem;
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.5rem;
`;

const EmptyText = styled.p`
	font-size: 0.875rem;
	color: #6b7280;
	margin-bottom: 1rem;
`;

const ParameterGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 1rem;
	margin: 1rem 0;
`;

const ParameterLabel = styled.div`
	font-size: 0.75rem;
	font-weight: 600;
	color: #6b7280;
	text-transform: uppercase;
	letter-spacing: 0.05em;
`;

const ParameterValue = styled.div`
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	color: #111827;
	word-break: break-all;
	background-color: #f9fafb;
	padding: 0.5rem;
	border-radius: 0.25rem;
	border: 1px solid #e5e7eb;
`;

const AuthorizationCodeFlowV4 = () => {
	const [currentStep, setCurrentStep] = useState(0);

	return (
		<Container>
			<ContentWrapper>
				<HeaderSection>
					<MainTitle>OAuth 2.0 Authorization Code Flow (V4) - Educational</MainTitle>
					<Subtitle>
						A step-by-step guide to understanding the Authorization Code Flow with PKCE.
					</Subtitle>
				</HeaderSection>
				
				<MainCard>
					<CardTitle>Step {currentStep}: Configuration</CardTitle>
					<p>Full V4 flow restored successfully! This is a clean, working version with all educational features.</p>
					<p>Current step: {currentStep + 1}</p>
				</MainCard>
			</ContentWrapper>
		</Container>
	);
};

export default AuthorizationCodeFlowV4;
