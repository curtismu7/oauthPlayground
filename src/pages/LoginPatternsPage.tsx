/**
 * @file LoginPatternsPage.tsx
 * @description Educational page showcasing different login patterns and authentication methods
 * @version 9.27.0
 */

import React, { useState } from 'react';
import {
	FiChevronDown,
	FiChevronUp,
	FiCode,
	FiCopy,
	FiExternalLink,
	FiEye,
	FiEyeOff,
	FiInfo,
	FiLock,
	FiRefreshCw,
	FiShield,
	FiUsers,
} from 'react-icons/fi';
import styled from 'styled-components';
// Import login pattern components
import DropdownLogin from '@/apps/protect/components/LoginPatterns/DropdownLogin';
import EmbeddedLogin from '@/apps/protect/components/LoginPatterns/EmbeddedLogin';
import RightPopoutLogin from '@/apps/protect/components/LoginPatterns/RightPopoutLogin';
import TwoStepOTPLogin from '@/apps/protect/components/LoginPatterns/TwoStepOTPLogin';
import BootstrapButton from '@/components/bootstrap/BootstrapButton';
import { PageHeaderTextColors, PageHeaderV8 } from '@/v8/components/shared/PageHeaderV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const _MODULE_TAG = '[🔐 LOGIN-PATTERNS-PAGE]';

interface LoginPattern {
	id: string;
	name: string;
	description: string;
	example: string;
	features: string[];
	useCase: string;
	implementation: string;
	pros: string[];
	cons: string[];
}

const Container = styled.div`
	padding: 2rem;
	max-width: 1400px;
	margin: 0 auto;
`;

const Section = styled.div`
	background: white;
	border-radius: 0.5rem;
	padding: 1.5rem;
	margin-bottom: 2rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
	font-size: 1.25rem;
	font-weight: 600;
	color: #1f2937;
	margin: 0 0 1rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const PatternGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
	gap: 2rem;
	margin-top: 2rem;
`;

const PatternCard = styled.div<{ $expanded: boolean }>`
	background: white;
	border: 2px solid #e5e7eb;
	border-radius: 0.5rem;
	overflow: hidden;
	transition: all 0.3s ease;
	${({ $expanded }) =>
		$expanded &&
		`
		border-color: #3b82f6;
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
	`}
`;

const PatternHeader = styled.div`
	padding: 1.5rem;
	background: #f8fafc;
	border-bottom: 1px solid #e5e7eb;
	cursor: pointer;
	display: flex;
	justify-content: space-between;
	align-items: center;
	&:hover {
		background: #f1f5f9;
	}
`;

const PatternTitle = styled.h3`
	font-size: 1.125rem;
	font-weight: 600;
	color: #1f2937;
	margin: 0;
`;

const PatternDescription = styled.p`
	color: #6b7280;
	margin: 0.5rem 0 0 0;
	font-size: 0.875rem;
`;

const PatternContent = styled.div<{ $expanded: boolean }>`
	max-height: ${({ $expanded }) => ($expanded ? '2000px' : '0')};
	overflow: hidden;
	transition: max-height 0.3s ease;
`;

const PatternBody = styled.div`
	padding: 1.5rem;
`;

const FeatureList = styled.ul`
	margin: 1rem 0;
	padding-left: 1.5rem;
	color: #4b5563;
	li {
		margin-bottom: 0.5rem;
	}
`;

const ProsConsGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 1rem;
	margin: 1rem 0;
`;

const ProsConsList = styled.div<{ $type: 'pros' | 'cons' }>`
	background: ${({ $type }) => ($type === 'pros' ? '#f0fdf4' : '#fef2f2')};
	border: 1px solid ${({ $type }) => ($type === 'pros' ? '#bbf7d0' : '#fecaca')};
	border-radius: 0.375rem;
	padding: 1rem;
	h4 {
		color: ${({ $type }) => ($type === 'pros' ? '#166534' : '#dc2626')};
		margin: 0 0 0.5rem 0;
		font-size: 0.875rem;
		font-weight: 600;
	}
	ul {
		margin: 0;
		padding-left: 1rem;
		color: ${({ $type }) => ($type === 'pros' ? '#166534' : '#dc2626')};
		font-size: 0.875rem;
		li {
			margin-bottom: 0.25rem;
		}
	}
`;

const DemoSection = styled.div`
	background: #f9fafb;
	border: 1px solid #e5e7eb;
	border-radius: 0.375rem;
	padding: 1rem;
	margin: 1rem 0;
`;

const CodeBlock = styled.pre`
	background: #1f2937;
	color: #f3f4f6;
	padding: 1rem;
	border-radius: 0.375rem;
	overflow-x: auto;
	font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
	font-size: 0.875rem;
	margin: 1rem 0;
`;

const InfoBox = styled.div`
	background: #eff6ff;
	border: 1px solid #bfdbfe;
	border-radius: 0.375rem;
	padding: 1rem;
	margin: 1rem 0;
	color: #1e40af;
`;

const ActionButtons = styled.div`
	display: flex;
	gap: 0.5rem;
	margin-top: 1rem;
	flex-wrap: wrap;
`;

const loginPatterns: LoginPattern[] = [
	{
		id: 'dropdown',
		name: 'Dropdown Login',
		description: 'Header dropdown form that slides down from navigation',
		example: 'Southwest Airlines',
		features: [
			'Space-efficient design',
			'Quick access from header',
			'Clean user experience',
			'Minimal page disruption',
		],
		useCase: 'Best for applications where login is secondary to main content',
		implementation: 'Dropdown positioned in header with toggle functionality',
		pros: [
			'Non-intrusive design',
			'Fast access to login',
			'Preserves page context',
			'Mobile-friendly',
		],
		cons: [
			'Limited space for form fields',
			'May interfere with navigation',
			'Not suitable for complex forms',
			'Accessibility challenges',
		],
	},
	{
		id: 'embedded',
		name: 'Embedded Login',
		description: 'Login form integrated directly into the main page content',
		example: 'Bank of America',
		features: [
			'Seamless integration',
			'Prominent placement',
			'Customizable design',
			'Marketing opportunities',
		],
		useCase: 'Ideal for applications where login is the primary action',
		implementation: 'Form embedded in hero section or dedicated landing area',
		pros: [
			'High visibility',
			'Flexible design options',
			'Can include marketing content',
			'Good conversion rates',
		],
		cons: [
			'Takes significant page space',
			'May distract from other content',
			'Less elegant for returning users',
			'Scrolling required on mobile',
		],
	},
	{
		id: 'right-popout',
		name: 'Right Popout Login',
		description: 'Slide-out panel from the right side of the screen',
		example: 'United Airlines',
		features: [
			'Dedicated login space',
			'Smooth animations',
			'Focus on authentication',
			'Professional appearance',
		],
		useCase: 'Perfect for enterprise applications requiring secure, focused login experience',
		implementation: 'Slide-out panel with overlay and smooth transitions',
		pros: [
			'Full-screen focus on login',
			'Professional appearance',
			'Good for complex forms',
			'Excellent for enterprise',
		],
		cons: [
			'Requires more development effort',
			'May feel heavy for simple apps',
			'Overlay can be intrusive',
			'Mobile implementation challenges',
		],
	},
	{
		id: 'two-step-otp',
		name: 'Two-Step OTP Login',
		description: 'Username entry followed by OTP verification on separate screens',
		example: 'PingIdentity Default',
		features: ['Enhanced security', 'Clean user flow', 'Mobile-optimized', 'MFA integration ready'],
		useCase: 'Best for security-conscious applications requiring multi-factor authentication',
		implementation: 'Two-step process with username screen followed by OTP entry',
		pros: [
			'Superior security',
			'Reduced form complexity',
			'Mobile-friendly',
			'MFA-ready architecture',
		],
		cons: [
			'More user steps',
			'Longer login time',
			'Higher user friction',
			'Requires careful UX design',
		],
	},
	{
		id: 'new-page',
		name: 'Separate Login Page',
		description: 'Dedicated login page separate from main application',
		example: 'American Airlines, FedEx',
		features: [
			'Complete design freedom',
			'Optimized for authentication',
			'Professional branding',
			'Security focus',
		],
		useCase: 'Ideal for enterprise applications with strong security requirements',
		implementation: 'Standalone page with full authentication focus',
		pros: [
			'Maximum security',
			'Complete design control',
			'Optimized user flow',
			'Professional appearance',
		],
		cons: [
			'Requires page navigation',
			'Context switching',
			'Higher bounce rates',
			'More development overhead',
		],
	},
];

export const LoginPatternsPage: React.FC = () => {
	const [expandedPatterns, setExpandedPatterns] = useState<Set<string>>(new Set(['dropdown']));
	const [showCode, setShowCode] = useState<Set<string>>(new Set());
	const [copiedCode, setCopiedCode] = useState<string>('');

	const togglePattern = (patternId: string) => {
		const newExpanded = new Set(expandedPatterns);
		if (newExpanded.has(patternId)) {
			newExpanded.delete(patternId);
		} else {
			newExpanded.add(patternId);
		}
		setExpandedPatterns(newExpanded);
	};

	const toggleCode = (patternId: string) => {
		const newShowCode = new Set(showCode);
		if (newShowCode.has(patternId)) {
			newShowCode.delete(patternId);
		} else {
			newShowCode.add(patternId);
		}
		setShowCode(newShowCode);
	};

	const copyToClipboard = (text: string, patternId: string) => {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				setCopiedCode(patternId);
				toastV8.success('Code copied to clipboard');
				setTimeout(() => setCopiedCode(''), 2000);
			})
			.catch(() => {
				toastV8.error('Failed to copy to clipboard');
			});
	};

	const generateImplementationCode = (pattern: LoginPattern) => {
		const codes = {
			dropdown: `// Dropdown Login Implementation
import React, { useState } from 'react';
import { FiLock, FiX } from 'react-icons/fi';

const DropdownLogin = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)}>
        <FiLock /> Login
      </button>
      
      {isOpen && (
        <div className="absolute dropdown-login">
          <div className="dropdown-header">
            <h3>Login</h3>
            <FiX onClick={() => setIsOpen(false)} />
          </div>
          <form>
            <input type="email" placeholder="Email" />
            <input type="password" placeholder="Password" />
            <button type="submit">Sign In</button>
          </form>
        </div>
      )}
    </div>
  );
};`,
			embedded: `// Embedded Login Implementation
import React from 'react';

const EmbeddedLogin = () => {
  return (
    <div className="embedded-login">
      <div className="login-hero">
        <h2>Welcome Back</h2>
        <p>Sign in to access your account</p>
      </div>
      
      <form className="login-form">
        <div className="form-group">
          <label>Email Address</label>
          <input type="email" required />
        </div>
        
        <div className="form-group">
          <label>Password</label>
          <input type="password" required />
        </div>
        
        <button type="submit" className="login-button">
          Sign In
        </button>
        
        <div className="login-links">
          <a href="/forgot-password">Forgot Password?</a>
          <a href="/register">Create Account</a>
        </div>
      </form>
    </div>
  );
};`,
			'right-popout': `// Right Popout Login Implementation
import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';

const RightPopoutLogin = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Login
      </button>
      
      {isOpen && (
        <>
          <div className="overlay" onClick={() => setIsOpen(false)} />
          <div className="right-popout">
            <div className="popout-header">
              <h2>Sign In</h2>
              <FiX onClick={() => setIsOpen(false)} />
            </div>
            
            <form className="popout-form">
              <input type="email" placeholder="Email" />
              <input type="password" placeholder="Password" />
              <button type="submit">Login</button>
            </form>
          </div>
        </>
      )}
    </>
  );
};`,
			'two-step-otp': `// Two-Step OTP Login Implementation
import React, { useState } from 'react';

const TwoStepOTPLogin = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  
  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    // Send OTP logic here
    setStep(2);
  };
  
  if (step === 1) {
    return (
      <form onSubmit={handleUsernameSubmit}>
        <h2>Enter Your Email</h2>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          required
        />
        <button type="submit">Send OTP</button>
      </form>
    );
  }
  
  return (
    <form>
      <h2>Enter OTP</h2>
      <p>Code sent to {email}</p>
      <input
        type="text"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        placeholder="Enter 6-digit code"
        maxLength={6}
        required
      />
      <button type="submit">Verify</button>
    </form>
  );
};`,
			'new-page': `// Separate Login Page Implementation
import React from 'react';
import { Link } from 'react-router-dom';

const LoginPage = () => {
  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Welcome Back</h1>
          <p>Sign in to continue to your account</p>
        </div>
        
        <form className="login-form">
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" required />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input type="password" required />
          </div>
          
          <div className="form-options">
            <label>
              <input type="checkbox" />
              Remember me
            </label>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
          
          <button type="submit" className="login-submit">
            Sign In
          </button>
          
          <div className="login-footer">
            <p>Don't have an account? <Link to="/register">Sign up</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
};`,
		};

		return codes[pattern.id] || '';
	};

	return (
		<Container>
			<PageHeaderV8
				title="Login Patterns Explorer"
				subtitle="Learn about different login patterns and authentication methods used in modern web applications"
				gradient="#3b82f6"
				textColor={PageHeaderTextColors.white}
			/>

			<Section>
				<SectionTitle>
					<FiInfo />
					About Login Patterns
				</SectionTitle>
				<p style={{ marginBottom: '1rem', color: '#6b7280' }}>
					Login patterns define how users authenticate with web applications. Different patterns
					serve different use cases, from quick dropdown access to secure enterprise authentication.
					Explore each pattern to understand its strengths, implementation considerations, and best
					use cases.
				</p>

				<InfoBox>
					<div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
						<FiInfo style={{ marginTop: '2px' }} />
						<div>
							<strong>Educational Note:</strong> This page demonstrates real-world login patterns
							used by major companies. Each pattern includes implementation examples, pros/cons
							analysis, and best practices for choosing the right approach.
						</div>
					</div>
				</InfoBox>
			</Section>

			<PatternGrid>
				{loginPatterns.map((pattern) => (
					<PatternCard key={pattern.id} $expanded={expandedPatterns.has(pattern.id)}>
						<PatternHeader onClick={() => togglePattern(pattern.id)}>
							<div>
								<PatternTitle>{pattern.name}</PatternTitle>
								<PatternDescription>{pattern.description}</PatternDescription>
								<div style={{ marginTop: '0.5rem' }}>
									<span
										style={{
											background: '#e5e7eb',
											color: '#374151',
											padding: '0.25rem 0.5rem',
											borderRadius: '0.25rem',
											fontSize: '0.75rem',
											fontWeight: 500,
										}}
									>
										{pattern.example}
									</span>
								</div>
							</div>
							{expandedPatterns.has(pattern.id) ? (
								<FiChevronUp size={20} color="#6b7280" />
							) : (
								<FiChevronDown size={20} color="#6b7280" />
							)}
						</PatternHeader>

						<PatternContent $expanded={expandedPatterns.has(pattern.id)}>
							<PatternBody>
								<div>
									<h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>Key Features</h4>
									<FeatureList>
										{pattern.features.map((feature, index) => (
											<li key={index}>{feature}</li>
										))}
									</FeatureList>
								</div>

								<div>
									<h4 style={{ margin: '1rem 0 0.5rem 0', color: '#1f2937' }}>Best Use Case</h4>
									<p style={{ color: '#6b7280', margin: '0 0 1rem 0' }}>{pattern.useCase}</p>
								</div>

								<ProsConsGrid>
									<ProsConsList $type="pros">
										<h4>Pros</h4>
										<ul>
											{pattern.pros.map((pro, index) => (
												<li key={index}>{pro}</li>
											))}
										</ul>
									</ProsConsList>
									<ProsConsList $type="cons">
										<h4>Cons</h4>
										<ul>
											{pattern.cons.map((con, index) => (
												<li key={index}>{con}</li>
											))}
										</ul>
									</ProsConsList>
								</ProsConsGrid>

								<DemoSection>
									<h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>
										Implementation Approach
									</h4>
									<p style={{ color: '#6b7280', margin: '0 0 1rem 0' }}>{pattern.implementation}</p>

									<ActionButtons>
										<BootstrapButton variant="secondary" onClick={() => toggleCode(pattern.id)}>
											{showCode.has(pattern.id) ? <FiEyeOff /> : <FiEye />}
											{showCode.has(pattern.id) ? 'Hide Code' : 'Show Code'}
										</BootstrapButton>

										{showCode.has(pattern.id) && (
											<BootstrapButton
												variant="primary"
												onClick={() =>
													copyToClipboard(generateImplementationCode(pattern), pattern.id)
												}
											>
												{copiedCode === pattern.id ? <FiRefreshCw /> : <FiCopy />}
												{copiedCode === pattern.id ? 'Copied!' : 'Copy Code'}
											</BootstrapButton>
										)}
									</ActionButtons>

									{showCode.has(pattern.id) && (
										<div style={{ marginTop: '1rem' }}>
											<CodeBlock>{generateImplementationCode(pattern)}</CodeBlock>
										</div>
									)}
								</DemoSection>
							</PatternBody>
						</PatternContent>
					</PatternCard>
				))}
			</PatternGrid>

			<Section>
				<SectionTitle>
					<FiShield />
					Security Considerations
				</SectionTitle>
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
						gap: '1rem',
					}}
				>
					<div
						style={{
							padding: '1rem',
							background: '#f9fafb',
							border: '1px solid #e5e7eb',
							borderRadius: '0.375rem',
						}}
					>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>Authentication Security</h4>
						<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#6b7280' }}>
							<li>Always use HTTPS for login forms</li>
							<li>Implement rate limiting to prevent brute force</li>
							<li>Use secure password hashing (bcrypt, Argon2)</li>
							<li>Enable multi-factor authentication (MFA)</li>
						</ul>
					</div>
					<div
						style={{
							padding: '1rem',
							background: '#f9fafb',
							border: '1px solid #e5e7eb',
							borderRadius: '0.375rem',
						}}
					>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>User Experience</h4>
						<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#6b7280' }}>
							<li>Provide clear error messages</li>
							<li>Offer password recovery options</li>
							<li>Implement remember me functionality</li>
							<li>Design for mobile accessibility</li>
						</ul>
					</div>
					<div
						style={{
							padding: '1rem',
							background: '#f9fafb',
							border: '1px solid #e5e7eb',
							borderRadius: '0.375rem',
						}}
					>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>Best Practices</h4>
						<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#6b7280' }}>
							<li>Test login flows across devices</li>
							<li>Monitor login success rates</li>
							<li>Implement session management</li>
							<li>Log security events appropriately</li>
						</ul>
					</div>
				</div>
			</Section>

			<Section>
				<SectionTitle>
					<FiCode />
					Choosing the Right Pattern
				</SectionTitle>
				<div
					style={{
						padding: '1rem',
						background: '#eff6ff',
						border: '1px solid #bfdbfe',
						borderRadius: '0.375rem',
						color: '#1e40af',
					}}
				>
					<h4 style={{ margin: '0 0 0.5rem 0' }}>Decision Framework</h4>
					<p style={{ margin: '0 0 1rem 0' }}>
						Consider these factors when choosing a login pattern:
					</p>
					<ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
						<li>
							<strong>Security Requirements:</strong> Higher security needs favor separate pages or
							two-step flows
						</li>
						<li>
							<strong>User Frequency:</strong> Frequent logins benefit from quick access patterns
							like dropdown
						</li>
						<li>
							<strong>Application Type:</strong> Enterprise apps need professional patterns,
							consumer apps can be more flexible
						</li>
						<li>
							<strong>Mobile Priority:</strong> Some patterns work better on mobile devices
						</li>
						<li>
							<strong>Brand Requirements:</strong> Consider how login integrates with overall brand
							experience
						</li>
					</ul>
				</div>
			</Section>
		</Container>
	);
};

export default LoginPatternsPage;
