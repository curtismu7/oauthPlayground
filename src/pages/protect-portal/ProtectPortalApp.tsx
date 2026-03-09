/**
 * @file ProtectPortalApp.tsx
 * @module protect-portal
 * @description FedEx Customer Portal — risk-based authentication demo
 * Redesigned: FedEx branding only, modal-based auth flow.
 */

import { FiLoader } from '@icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { WorkerTokenSectionV8 } from '@/v8/components/WorkerTokenSectionV8';
import { logger } from '../../utils/logger';
import BaseLoginForm from './components/BaseLoginForm';
import MFAAuthenticationFlow from './components/MFAAuthenticationFlow';
import RiskEvaluationDisplay from './components/RiskEvaluationDisplay';
import { BrandThemeProvider } from './themes/theme-provider';
import type {
	LoginContext,
	PortalError,
	RiskEvaluationResult,
	TokenSet,
	UserContext,
} from './types/protectPortal.types';

// ─── FedEx brand tokens ───────────────────────────────────────────────────────
const FX = {
	purple: '#4D148C',
	purpleDark: '#3B0E6F',
	purpleLight: '#6B2DB5',
	orange: '#FF6600',
	orangeHover: '#E85A00',
	white: '#ffffff',
	offWhite: '#F7F7F7',
	gray100: '#F5F5F5',
	gray200: '#E8E8E8',
	gray400: '#AAAAAA',
	gray600: '#666666',
	gray800: '#333333',
	text: '#1A1A1A',
	success: '#1A7F3C',
	successLight: '#EAF7EE',
	error: '#C0392B',
	errorLight: '#FDECEA',
} as const;

// ─── Keyframes ────────────────────────────────────────────────────────────────
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;
const overlayIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;
const modalSlideIn = keyframes`
  from { opacity: 0; transform: translateY(-24px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

// ─── Layout ───────────────────────────────────────────────────────────────────
const Page = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${FX.offWhite};
  font-family: 'Helvetica Neue', Arial, sans-serif;
`;

// ─── Navigation ───────────────────────────────────────────────────────────────
const Nav = styled.nav`
  background: ${FX.purple};
  width: 100%;
  position: sticky;
  top: 0;
  z-index: 100;
`;
const NavInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
const LogoText = styled.span`
  font-size: 1.75rem;
  font-weight: 900;
  letter-spacing: -1px;
  color: ${FX.white};
  span { color: ${FX.orange}; }
`;
const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  @media (max-width: 640px) { display: none; }
`;
const NavLink = styled.a`
  color: rgba(255,255,255,0.85);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.5rem 0.875rem;
  border-radius: 4px;
  transition: background 0.15s;
  &:hover { background: rgba(255,255,255,0.12); color: ${FX.white}; }
`;
const SignInBtn = styled.button`
  background: ${FX.orange};
  color: ${FX.white};
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1.25rem;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  &:hover { background: ${FX.orangeHover}; transform: translateY(-1px); }
  &:active { transform: translateY(0); }
`;

// ─── Hero ─────────────────────────────────────────────────────────────────────
const Hero = styled.section`
  background: linear-gradient(135deg, ${FX.purpleDark} 0%, ${FX.purple} 60%, ${FX.purpleLight} 100%);
  padding: 5rem 2rem 4rem;
  text-align: center;
  position: relative;
  overflow: hidden;
  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0; right: 0;
    height: 48px;
    background: ${FX.offWhite};
    clip-path: ellipse(55% 100% at 50% 100%);
  }
`;
const HeroTag = styled.div`
  display: inline-block;
  background: rgba(255,102,0,0.2);
  border: 1px solid rgba(255,102,0,0.4);
  color: ${FX.orange};
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  padding: 0.3rem 0.875rem;
  border-radius: 999px;
  margin-bottom: 1.5rem;
`;
const HeroTitle = styled.h1`
  font-size: clamp(2rem, 5vw, 3.25rem);
  font-weight: 900;
  color: ${FX.white};
  margin: 0 0 1rem 0;
  line-height: 1.1;
  letter-spacing: -0.5px;
`;
const HeroSub = styled.p`
  font-size: 1.125rem;
  color: rgba(255,255,255,0.8);
  max-width: 560px;
  margin: 0 auto 2.5rem;
  line-height: 1.6;
`;
const HeroCTA = styled.button`
  background: ${FX.orange};
  color: ${FX.white};
  border: none;
  border-radius: 6px;
  padding: 0.9rem 2.5rem;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s, transform 0.1s;
  box-shadow: 0 4px 20px rgba(255,102,0,0.35);
  &:hover { background: ${FX.orangeHover}; transform: translateY(-2px); box-shadow: 0 6px 24px rgba(255,102,0,0.45); }
  &:active { transform: translateY(0); }
`;

// ─── Feature cards ────────────────────────────────────────────────────────────
const Features = styled.section`
  background: ${FX.offWhite};
  padding: 4rem 2rem;
`;
const FeaturesInner = styled.div`
  max-width: 1100px;
  margin: 0 auto;
`;
const FeaturesTitle = styled.h2`
  text-align: center;
  font-size: 1.75rem;
  font-weight: 800;
  color: ${FX.purpleDark};
  margin: 0 0 0.5rem 0;
`;
const FeaturesSubtitle = styled.p`
  text-align: center;
  color: ${FX.gray600};
  font-size: 1rem;
  margin: 0 0 3rem 0;
`;
const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
`;
const Card = styled.div`
  background: ${FX.white};
  border-radius: 12px;
  padding: 2rem 1.75rem;
  border: 1px solid ${FX.gray200};
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  animation: ${fadeIn} 0.4s ease both;
  transition: box-shadow 0.2s, transform 0.2s;
  &:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.1); transform: translateY(-3px); }
`;
const CardIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: ${FX.purple};
  color: ${FX.white};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.375rem;
  margin-bottom: 1.25rem;
`;
const CardTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: ${FX.purpleDark};
  margin: 0 0 0.5rem 0;
`;
const CardDesc = styled.p`
  font-size: 0.9rem;
  color: ${FX.gray600};
  line-height: 1.6;
  margin: 0;
`;

// ─── How it works ─────────────────────────────────────────────────────────────
const HowSection = styled.section`
  background: ${FX.purple};
  padding: 4rem 2rem;
`;
const HowInner = styled.div`
  max-width: 1000px;
  margin: 0 auto;
`;
const HowTitle = styled.h2`
  text-align: center;
  font-size: 1.75rem;
  font-weight: 800;
  color: ${FX.white};
  margin: 0 0 0.5rem 0;
`;
const HowSub = styled.p`
  text-align: center;
  color: rgba(255,255,255,0.75);
  font-size: 1rem;
  margin: 0 0 3rem 0;
`;
const StepRow = styled.div`
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  flex-wrap: wrap;
  justify-content: center;
`;
const Step = styled.div`
  flex: 1;
  min-width: 200px;
  max-width: 260px;
  text-align: center;
`;
const StepNum = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: ${FX.orange};
  color: ${FX.white};
  font-weight: 800;
  font-size: 1.125rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
`;
const StepTitle = styled.h4`
  font-size: 1rem;
  font-weight: 700;
  color: ${FX.white};
  margin: 0 0 0.375rem 0;
`;
const StepDesc = styled.p`
  font-size: 0.875rem;
  color: rgba(255,255,255,0.75);
  margin: 0;
  line-height: 1.5;
`;
const StepDivider = styled.div`
  align-self: flex-start;
  padding-top: 22px;
  color: rgba(255,255,255,0.35);
  font-size: 1.5rem;
  @media (max-width: 640px) { display: none; }
`;

// ─── Footer ───────────────────────────────────────────────────────────────────
const Footer = styled.footer`
  background: ${FX.purpleDark};
  padding: 2rem;
  text-align: center;
  color: rgba(255,255,255,0.6);
  font-size: 0.8rem;
`;
const FooterLinks = styled.div`
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;
const FooterLink = styled.a`
  color: rgba(255,255,255,0.6);
  text-decoration: none;
  font-size: 0.8rem;
  &:hover { color: ${FX.white}; }
`;

// ─── Worker token strip ───────────────────────────────────────────────────────
const TokenStrip = styled.div`
  background: ${FX.gray100};
  border-top: 1px solid ${FX.gray200};
  padding: 1rem 2rem;
`;

// ─── Modal overlay ────────────────────────────────────────────────────────────
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  animation: ${overlayIn} 0.2s ease;
`;
const Modal = styled.div`
  background: ${FX.white};
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 24px 64px rgba(0,0,0,0.25);
  animation: ${modalSlideIn} 0.25s cubic-bezier(0.34,1.56,0.64,1);
  position: relative;
`;
const ModalHeader = styled.div`
  background: linear-gradient(135deg, ${FX.purpleDark} 0%, ${FX.purple} 100%);
  padding: 1.5rem 1.75rem 1.25rem;
  border-radius: 16px 16px 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
const ModalLogoText = styled.span`
  font-size: 1.375rem;
  font-weight: 900;
  letter-spacing: -0.5px;
  color: ${FX.white};
  span { color: ${FX.orange}; }
`;
const ModalClose = styled.button`
  background: rgba(255,255,255,0.15);
  border: none;
  color: ${FX.white};
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 1.125rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  &:hover { background: rgba(255,255,255,0.25); }
`;
const ModalBody = styled.div`
  padding: 1.75rem;
`;
const ModalTitle = styled.h2`
  font-size: 1.375rem;
  font-weight: 800;
  color: ${FX.purpleDark};
  margin: 0 0 0.375rem 0;
`;
const ModalSubtitle = styled.p`
  font-size: 0.9rem;
  color: ${FX.gray600};
  margin: 0 0 1.75rem 0;
`;

// ─── Spinner ──────────────────────────────────────────────────────────────────
const SpinIcon = styled.div`
  animation: ${spin} 0.9s linear infinite;
  display: inline-flex;
`;
const LoadingBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2.5rem 1rem;
  text-align: center;
`;

// ─── Risk badge ───────────────────────────────────────────────────────────────
const RiskBadge = styled.div<{ $level: 'LOW' | 'MEDIUM' | 'HIGH' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.3rem 0.875rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  background: ${p => p.$level === 'LOW' ? FX.successLight : p.$level === 'MEDIUM' ? '#FFF8E1' : FX.errorLight};
  color: ${p => p.$level === 'LOW' ? FX.success : p.$level === 'MEDIUM' ? '#B45309' : FX.error};
  border: 1px solid ${p => p.$level === 'LOW' ? '#6EBF8B' : p.$level === 'MEDIUM' ? '#FCD34D' : '#F5A8A3'};
`;

// ─── Success box ──────────────────────────────────────────────────────────────
const SuccessIconBox = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: ${FX.successLight};
  border: 2px solid ${FX.success};
  color: ${FX.success};
  font-size: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
`;
const BlockedIconBox = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: ${FX.errorLight};
  border: 2px solid ${FX.error};
  color: ${FX.error};
  font-size: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
`;

// ─── Action buttons inside modal ──────────────────────────────────────────────
const OrangeBtn = styled.button`
  width: 100%;
  background: ${FX.orange};
  color: ${FX.white};
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
  margin-top: 1rem;
  &:hover { background: ${FX.orangeHover}; }
`;
const PurpleOutlineBtn = styled.button`
  width: 100%;
  background: transparent;
  color: ${FX.purple};
  border: 2px solid ${FX.purple};
  border-radius: 6px;
  padding: 0.7rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  margin-top: 0.75rem;
  &:hover { background: ${FX.purple}; color: ${FX.white}; }
`;
const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0;
  border-bottom: 1px solid ${FX.gray200};
  font-size: 0.875rem;
  &:last-child { border-bottom: none; }
`;
const InfoLabel = styled.span`
  color: ${FX.gray600};
  font-weight: 500;
`;
const InfoValue = styled.span`
  color: ${FX.text};
  font-weight: 600;
  max-width: 240px;
  text-align: right;
  word-break: break-all;
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
`;

// ─── Types ────────────────────────────────────────────────────────────────────
type ModalStep =
  | null
  | 'login'
  | 'evaluating'
  | 'mfa'
  | 'success'
  | 'blocked'
  | 'error';

interface ProtectPortalAppProps {
  initialStep?: string;
  environmentId: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  protectCredentials?: {
    environmentId: string;
    workerToken: string;
    region: 'us' | 'eu' | 'ap' | 'ca';
  };
}

// ─── Feature card data ────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: '📦',
    title: 'Track & Trace',
    desc: 'Real-time visibility on all your packages and freight worldwide. Get proactive delivery notifications.',
  },
  {
    icon: '🚚',
    title: 'Schedule a Pickup',
    desc: 'Request pickups and manage shipping schedules from any location at any time.',
  },
  {
    icon: '📊',
    title: 'Account Management',
    desc: 'Review invoices, manage billing preferences, and monitor account activity in one place.',
  },
];

// ─── Main component ───────────────────────────────────────────────────────────
const FedExPortalContent: React.FC<Omit<ProtectPortalAppProps, 'initialStep'>> = ({
  environmentId,
  clientId,
  redirectUri,
  protectCredentials,
}) => {
  const [modalStep, setModalStep] = useState<ModalStep>(null);
  const [userCtx, setUserCtx] = useState<UserContext | null>(null);
  const [loginCtx, setLoginCtx] = useState<LoginContext | null>(null);
  const [riskResult, setRiskResult] = useState<RiskEvaluationResult | null>(null);
  const [tokens, setTokens] = useState<TokenSet | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const openModal = () => setModalStep('login');

  const closeModal = useCallback(() => {
    setModalStep(null);
    setUserCtx(null);
    setLoginCtx(null);
    setRiskResult(null);
    setTokens(null);
    setErrorMsg('');
  }, []);

  const handleLoginSuccess = useCallback((uc: UserContext, lc: LoginContext) => {
    logger.info('FedExPortal', 'Login success, starting risk evaluation', { userId: uc.id });
    setUserCtx(uc);
    setLoginCtx(lc);
    setModalStep('evaluating');
  }, []);

  const handleLoginError = useCallback((err: PortalError) => {
    logger.error('FedExPortal', 'Login error', err as unknown as Error);
    setErrorMsg(err.message || 'Authentication failed. Please try again.');
    setModalStep('error');
  }, []);

  const handleRiskComplete = useCallback((result: RiskEvaluationResult) => {
    logger.info('FedExPortal', 'Risk evaluation complete', { level: result.result.level });
    setRiskResult(result);
    switch (result.result.level) {
      case 'LOW':
        setModalStep('success');
        break;
      case 'MEDIUM':
        setModalStep('mfa');
        break;
      case 'HIGH':
        setModalStep('blocked');
        break;
      default:
        setErrorMsg('Unable to determine risk level. Please try again.');
        setModalStep('error');
    }
  }, []);

  const handleRiskError = useCallback((err: PortalError) => {
    logger.error('FedExPortal', 'Risk evaluation error', err as unknown as Error);
    setErrorMsg(err.message || 'Risk evaluation failed. Please try again.');
    setModalStep('error');
  }, []);

  const handleMFAComplete = useCallback((ts: TokenSet) => {
    logger.info('FedExPortal', 'MFA complete — portal success');
    setTokens(ts);
    setModalStep('success');
  }, []);

  const handleMFAError = useCallback((err: PortalError) => {
    logger.error('FedExPortal', 'MFA error', err as unknown as Error);
    setErrorMsg(err.message || 'MFA authentication failed. Please try again.');
    setModalStep('error');
  }, []);

  // ─── Modal body content ─────────────────────────────────────────────────────
  const renderModalBody = () => {
    switch (modalStep) {
      case 'login':
        return (
          <>
            <ModalTitle>Sign In to FedEx</ModalTitle>
            <ModalSubtitle>Enter your credentials to access your account</ModalSubtitle>
            <BaseLoginForm
              environmentId={environmentId}
              clientId={clientId}
              redirectUri={redirectUri}
              onLoginSuccess={handleLoginSuccess}
              onError={handleLoginError}
            />
          </>
        );

      case 'evaluating':
        return (
          <LoadingBox>
            <SpinIcon>
              <FiLoader size={36} color={FX.purple} />
            </SpinIcon>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: FX.purpleDark, fontSize: '1.1rem' }}>
                Evaluating Your Login
              </p>
              <p style={{ margin: '0.5rem 0 0', color: FX.gray600, fontSize: '0.9rem' }}>
                PingOne Protect is analyzing risk signals…
              </p>
            </div>
            {/* Hidden — RiskEvaluationDisplay drives the API call */}
            {userCtx && loginCtx && protectCredentials && (
              <div style={{ display: 'none' }}>
                <RiskEvaluationDisplay
                  userContext={userCtx}
                  loginContext={loginCtx}
                  onComplete={handleRiskComplete}
                  onError={handleRiskError}
                  protectCredentials={protectCredentials}
                  educationalContent={{
                    title: '',
                    description: '',
                    keyPoints: [],
                  }}
                />
              </div>
            )}
          </LoadingBox>
        );

      case 'mfa':
        return (
          <>
            <ModalTitle>Additional Verification Required</ModalTitle>
            <ModalSubtitle>
              <RiskBadge $level="MEDIUM">⚠️ Medium Risk Detected</RiskBadge>
              <span style={{ marginLeft: '0.5rem' }}>Complete MFA to continue</span>
            </ModalSubtitle>
            {userCtx && (
              <MFAAuthenticationFlow
                userContext={userCtx}
                riskEvaluation={riskResult!}
                onComplete={handleMFAComplete}
                onError={handleMFAError}
                mfaCredentials={{
                  environmentId: environmentId,
                  accessToken: protectCredentials?.workerToken || '',
                  region: protectCredentials?.region || 'us',
                }}
                loginContext={loginCtx!}
                educationalContent={{
                  title: 'MFA',
                  description: 'Verify your identity',
                  keyPoints: [],
                }}
              />
            )}
          </>
        );

      case 'success': {
        const displayName = userCtx?.name || userCtx?.username || userCtx?.email || 'Customer';
        const riskLevel = riskResult?.result?.level;
        return (
          <div style={{ textAlign: 'center' }}>
            <SuccessIconBox>✓</SuccessIconBox>
            <ModalTitle>Welcome, {displayName}!</ModalTitle>
            <ModalSubtitle>You've securely signed in to your FedEx account.</ModalSubtitle>
            {riskLevel && (
              <div style={{ marginBottom: '1.25rem' }}>
                <RiskBadge $level={riskLevel as 'LOW' | 'MEDIUM' | 'HIGH'}>
                  {riskLevel === 'LOW' ? '✓ Low Risk' : riskLevel === 'MEDIUM' ? '⚠️ Medium Risk' : '🛑 High Risk'}
                </RiskBadge>
              </div>
            )}
            <div style={{ background: FX.gray100, borderRadius: 8, padding: '1rem', textAlign: 'left', marginBottom: '1rem' }}>
              <InfoRow>
                <InfoLabel>User ID</InfoLabel>
                <InfoValue>{userCtx?.id?.substring(0, 20)}…</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Username</InfoLabel>
                <InfoValue>{userCtx?.username || userCtx?.email || '—'}</InfoValue>
              </InfoRow>
              {tokens?.accessToken && (
                <InfoRow>
                  <InfoLabel>Access Token</InfoLabel>
                  <InfoValue>{tokens.accessToken.substring(0, 28)}…</InfoValue>
                </InfoRow>
              )}
              {riskResult?.result?.score !== undefined && (
                <InfoRow>
                  <InfoLabel>Risk Score</InfoLabel>
                  <InfoValue>{riskResult.result.score}</InfoValue>
                </InfoRow>
              )}
            </div>
            <OrangeBtn onClick={closeModal}>Done — Back to Portal</OrangeBtn>
          </div>
        );
      }

      case 'blocked':
        return (
          <div style={{ textAlign: 'center' }}>
            <BlockedIconBox>🛑</BlockedIconBox>
            <ModalTitle style={{ color: FX.error }}>Access Blocked</ModalTitle>
            <p style={{ color: FX.gray600, fontSize: '0.95rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              This login attempt has been blocked due to high-risk indicators detected by PingOne
              Protect. For your security, please contact FedEx support or try again from a trusted
              network.
            </p>
            {riskResult?.result?.score !== undefined && (
              <div style={{ marginBottom: '1.25rem' }}>
                <RiskBadge $level="HIGH">🛑 High Risk — Score: {riskResult.result.score}</RiskBadge>
              </div>
            )}
            <OrangeBtn onClick={closeModal} style={{ background: FX.error }}>
              Return to Portal
            </OrangeBtn>
            <PurpleOutlineBtn onClick={() => { closeModal(); setTimeout(openModal, 100); }}>
              Try Again
            </PurpleOutlineBtn>
          </div>
        );

      case 'error':
        return (
          <div style={{ textAlign: 'center' }}>
            <BlockedIconBox>⚠️</BlockedIconBox>
            <ModalTitle style={{ color: FX.error }}>Something Went Wrong</ModalTitle>
            <p style={{ color: FX.gray600, fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              {errorMsg || 'An unexpected error occurred. Please try again.'}
            </p>
            <OrangeBtn onClick={() => setModalStep('login')}>Try Again</OrangeBtn>
            <PurpleOutlineBtn onClick={closeModal}>Cancel</PurpleOutlineBtn>
          </div>
        );

      default:
        return null;
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <Page>
      {/* Navigation */}
      <Nav>
        <NavInner>
          <LogoText>Fed<span>Ex</span></LogoText>
          <NavLinks>
            <NavLink href="#">Track</NavLink>
            <NavLink href="#">Ship</NavLink>
            <NavLink href="#">Manage</NavLink>
            <NavLink href="#">Support</NavLink>
          </NavLinks>
          <SignInBtn onClick={openModal}>Sign In</SignInBtn>
        </NavInner>
      </Nav>

      {/* Hero */}
      <Hero>
        <HeroTag>🛡️ PingOne Protect Demo</HeroTag>
        <HeroTitle>The World on Time</HeroTitle>
        <HeroSub>
          Securely access your FedEx account to track shipments, schedule pickups, and manage
          your logistics — protected by risk-based authentication.
        </HeroSub>
        <HeroCTA onClick={openModal}>Sign In to Your Account →</HeroCTA>
      </Hero>

      {/* Features */}
      <Features>
        <FeaturesInner>
          <FeaturesTitle>Everything You Need</FeaturesTitle>
          <FeaturesSubtitle>Manage your FedEx account from one place</FeaturesSubtitle>
          <CardGrid>
            {FEATURES.map(f => (
              <Card key={f.title}>
                <CardIcon>{f.icon}</CardIcon>
                <CardTitle>{f.title}</CardTitle>
                <CardDesc>{f.desc}</CardDesc>
              </Card>
            ))}
          </CardGrid>
        </FeaturesInner>
      </Features>

      {/* How it works */}
      <HowSection>
        <HowInner>
          <HowTitle>Risk-Based Authentication</HowTitle>
          <HowSub>PingOne Protect evaluates each login in real time</HowSub>
          <StepRow>
            <Step>
              <StepNum>1</StepNum>
              <StepTitle>Enter Credentials</StepTitle>
              <StepDesc>Sign in with your FedEx username and password</StepDesc>
            </Step>
            <StepDivider>→</StepDivider>
            <Step>
              <StepNum>2</StepNum>
              <StepTitle>Risk Evaluation</StepTitle>
              <StepDesc>PingOne Protect analyzes device, network, and behavior signals</StepDesc>
            </Step>
            <StepDivider>→</StepDivider>
            <Step>
              <StepNum>3</StepNum>
              <StepTitle>Adaptive Response</StepTitle>
              <StepDesc>LOW: instant access · MEDIUM: MFA challenge · HIGH: blocked</StepDesc>
            </Step>
          </StepRow>
        </HowInner>
      </HowSection>

      {/* Worker token */}
      <TokenStrip>
        <WorkerTokenSectionV8 compact environmentId={environmentId} />
      </TokenStrip>

      {/* Footer */}
      <Footer>
        <FooterLinks>
          <FooterLink href="#">Privacy Policy</FooterLink>
          <FooterLink href="#">Terms of Use</FooterLink>
          <FooterLink href="#">Accessibility</FooterLink>
          <FooterLink href="#">Contact Us</FooterLink>
        </FooterLinks>
        © 2026 FedEx. All rights reserved. · PingOne Protect Demo
      </Footer>

      {/* Auth modal */}
      {modalStep !== null && (
        <Overlay
          ref={overlayRef}
          onClick={e => { if (e.target === overlayRef.current) closeModal(); }}
        >
          <Modal>
            <ModalHeader>
              <ModalLogoText>Fed<span>Ex</span></ModalLogoText>
              <ModalClose onClick={closeModal} aria-label="Close">✕</ModalClose>
            </ModalHeader>
            <ModalBody>{renderModalBody()}</ModalBody>
          </Modal>
        </Overlay>
      )}
    </Page>
  );
};

// ─── Wrapper (provides theme CSS vars) ───────────────────────────────────────
const ProtectPortalApp: React.FC<ProtectPortalAppProps> = (props) => (
  <BrandThemeProvider>
    <FedExPortalContent {...props} />
  </BrandThemeProvider>
);

export default ProtectPortalApp;
