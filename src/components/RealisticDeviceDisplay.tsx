// src/components/RealisticDeviceDisplay.tsx
// Realistic Device Display Components with Brand-Like Styling

import React from 'react';
import styled from 'styled-components';

// ============================================================================
// SMART TV - Vizio/Roku-Style Interface
// ============================================================================

const VizioTVBrand = styled.div<{ $color: string }>`
	position: absolute;
	top: 1rem;
	left: 1.5rem;
	right: 1.5rem;
	display: flex;
	justify-content: space-between;
	align-items: center;
	z-index: 10;
`;

const VizioLogo = styled.div<{ $color: string }>`
	font-size: 1.25rem;
	font-weight: 700;
	letter-spacing: 0.15em;
	color: ${(props) => props.$color};
	text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
`;

const VizioModelNumber = styled.div`
	font-size: 0.75rem;
	color: #94a3b8;
	font-family: 'Courier New', monospace;
`;

const VizioStatusBar = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	font-size: 0.875rem;
	color: #cbd5e1;
`;

const VizioBottomHint = styled.div`
	position: absolute;
	bottom: 1rem;
	left: 50%;
	transform: translateX(-50%);
	font-size: 0.75rem;
	color: #64748b;
	background: rgba(0, 0, 0, 0.6);
	padding: 0.5rem 1rem;
	border-radius: 1rem;
	backdrop-filter: blur(10px);
`;

// ============================================================================
// GAMING CONSOLE - PlayStation-Style Interface
// ============================================================================

const PlayStationBrand = styled.div`
	position: absolute;
	top: 1rem;
	left: 1.5rem;
	right: 1.5rem;
	display: flex;
	justify-content: space-between;
	align-items: center;
	z-index: 10;
`;

const PSLogo = styled.div`
	font-size: 1.5rem;
	font-weight: 700;
	color: #ffffff;
	font-family: 'Arial', sans-serif;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const PSIcon = styled.div`
	width: 32px;
	height: 32px;
	background: linear-gradient(135deg, #0070cc 0%, #003d99 100%);
	border-radius: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 900;
	font-size: 1.25rem;
	box-shadow: 0 2px 8px rgba(0, 112, 204, 0.5);
`;

const PSUserProfile = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	background: rgba(0, 0, 0, 0.4);
	padding: 0.375rem 0.75rem;
	border-radius: 1.5rem;
	backdrop-filter: blur(10px);
`;

const PSAvatar = styled.div`
	width: 28px;
	height: 28px;
	background: linear-gradient(135deg, #00a7e1 0%, #0070cc 100%);
	border-radius: 50%;
	border: 2px solid #00a7e1;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 0.875rem;
`;

const PSBottomBar = styled.div`
	position: absolute;
	bottom: 1rem;
	left: 1.5rem;
	right: 1.5rem;
	display: flex;
	justify-content: space-between;
	align-items: center;
	font-size: 0.75rem;
	color: #64748b;
	padding: 0.75rem;
	background: rgba(0, 0, 0, 0.6);
	border-radius: 0.5rem;
	backdrop-filter: blur(10px);
`;

// ============================================================================
// GAS PUMP - Kroger/Commercial Pump Style
// ============================================================================

const GasPumpContainer = styled.div<{ $color: string }>`
	background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
	border: 3px solid #475569;
	border-radius: 1rem;
	padding: 1.5rem;
	width: 100%;
	max-width: 500px;
	margin: 0 auto;
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
`;

const PumpHeader = styled.div<{ $color: string }>`
	background: ${(props) => props.$color};
	color: white;
	padding: 1rem;
	margin: -1.5rem -1.5rem 1rem -1.5rem;
	border-radius: 0.75rem 0.75rem 0 0;
	display: flex;
	justify-content: space-between;
	align-items: center;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
`;

const PumpLogo = styled.div`
	font-size: 1.25rem;
	font-weight: 700;
	letter-spacing: 0.1em;
`;

const PumpNumber = styled.div`
	background: rgba(255, 255, 255, 0.2);
	padding: 0.25rem 0.75rem;
	border-radius: 0.25rem;
	font-size: 0.875rem;
	font-weight: 600;
`;

const LEDDisplay = styled.div`
	background: #000000;
	color: #00ff00;
	font-family: 'Courier New', 'Digital-7', monospace;
	font-size: 2.5rem;
	font-weight: 700;
	text-align: right;
	padding: 1rem;
	border-radius: 0.5rem;
	margin: 1rem 0;
	border: 2px solid #1e293b;
	box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.8);
	letter-spacing: 0.2em;
`;

const GradeButtons = styled.div`
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 0.75rem;
	margin: 1rem 0;
`;

const GradeButton = styled.div<{ $color: string; $active?: boolean }>`
	background: ${(props) => (props.$active ? props.$color : 'rgba(255, 255, 255, 0.1)')};
	border: 2px solid ${(props) => props.$color};
	color: ${(props) => (props.$active ? 'white' : props.$color)};
	padding: 1rem;
	border-radius: 0.5rem;
	text-align: center;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	
	&:hover {
		background: ${(props) => props.$color};
		color: white;
		transform: scale(1.02);
	}
`;

const PumpInstruction = styled.div`
	text-align: center;
	color: #22c55e;
	font-size: 0.875rem;
	margin-top: 1rem;
	padding: 0.75rem;
	background: rgba(34, 197, 94, 0.1);
	border: 1px solid rgba(34, 197, 94, 0.3);
	border-radius: 0.5rem;
`;

// ============================================================================
// Main Component Props
// ============================================================================

export interface RealisticDeviceDisplayProps {
	deviceType: string;
	isWaiting: boolean;
	isSuccess: boolean;
	brandName: string;
	deviceName: string;
	color: string;
	secondaryColor: string;
	apps?: Array<{ label: string; icon: string; color: string }>;
	children?: React.ReactNode;
}

// ============================================================================
// Smart TV Renderer
// ============================================================================

export const SmartTVDisplay: React.FC<RealisticDeviceDisplayProps> = ({
	isSuccess,
	brandName,
	deviceName,
	color,
	apps = [],
	children,
}) => {
	return (
		<>
			<VizioTVBrand $color={color}>
				<div>
					<VizioLogo $color={color}>{brandName}</VizioLogo>
					<VizioModelNumber>{deviceName}</VizioModelNumber>
				</div>
				<VizioStatusBar>
					<span>🌐 WiFi</span>
					<span>12:34 PM</span>
					<span>👤</span>
				</VizioStatusBar>
			</VizioTVBrand>

			{children}

			{isSuccess && <VizioBottomHint>Press OK to select • Home for menu</VizioBottomHint>}
		</>
	);
};

// ============================================================================
// Gaming Console Renderer
// ============================================================================

export const GamingConsoleDisplay: React.FC<RealisticDeviceDisplayProps> = ({
	isSuccess,
	brandName,
	color,
	children,
}) => {
	return (
		<>
			<PlayStationBrand>
				<PSLogo>
					<PSIcon>P</PSIcon>
					<span>{brandName}</span>
				</PSLogo>
				<PSUserProfile>
					<PSAvatar>D</PSAvatar>
					<span style={{ color: 'white', fontSize: '0.875rem' }}>Demo User</span>
					<span style={{ color: '#00a7e1', fontSize: '0.75rem' }}>⭐ Level 24</span>
				</PSUserProfile>
			</PlayStationBrand>

			{children}

			{isSuccess && (
				<PSBottomBar>
					<div>Storage: 625 GB available</div>
					<div style={{ color: '#22c55e' }}>● Online</div>
					<div>Press ✕ to continue</div>
				</PSBottomBar>
			)}
		</>
	);
};

// ============================================================================
// Gas Pump Renderer
// ============================================================================

export const GasPumpDisplay: React.FC<RealisticDeviceDisplayProps> = ({
	isSuccess,
	isWaiting,
	brandName,
	color,
}) => {
	return (
		<GasPumpContainer $color={color}>
			<PumpHeader $color={color}>
				<PumpLogo>{brandName}</PumpLogo>
				<PumpNumber>PUMP 07</PumpNumber>
			</PumpHeader>

			{isSuccess ? (
				<>
					<LEDDisplay>$25.00</LEDDisplay>
					<div style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '1rem' }}>
						<div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#00ff00' }}>
							7.142 GAL
						</div>
						<div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>@ $3.499/gal</div>
					</div>
					<GradeButtons>
						<GradeButton $color="#fbbf24">
							Regular
							<br />
							<small>$3.49</small>
						</GradeButton>
						<GradeButton $color="#3b82f6" $active>
							Premium
							<br />
							<small>$3.99</small>
						</GradeButton>
					</GradeButtons>
					<PumpInstruction>✓ AUTHORIZED • Ready to pump</PumpInstruction>
				</>
			) : isWaiting ? (
				<>
					<LEDDisplay>$0.00</LEDDisplay>
					<div style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '1rem' }}>
						<div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>0.000 GAL</div>
						<div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
							Awaiting authorization...
						</div>
					</div>
					<GradeButtons>
						<GradeButton $color="#fbbf24">
							Regular
							<br />
							<small>$3.49</small>
						</GradeButton>
						<GradeButton $color="#3b82f6">
							Premium
							<br />
							<small>$3.99</small>
						</GradeButton>
					</GradeButtons>
					<PumpInstruction
						style={{
							color: '#fbbf24',
							background: 'rgba(251, 191, 36, 0.1)',
							borderColor: 'rgba(251, 191, 36, 0.3)',
						}}
					>
						⏳ Scan QR code to authorize payment
					</PumpInstruction>
				</>
			) : (
				<>
					<LEDDisplay>------</LEDDisplay>
					<div style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '1rem' }}>
						<div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>----</div>
						<div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Select payment method</div>
					</div>
					<GradeButtons>
						<GradeButton $color="#fbbf24">
							Regular
							<br />
							<small>$3.49</small>
						</GradeButton>
						<GradeButton $color="#3b82f6">
							Premium
							<br />
							<small>$3.99</small>
						</GradeButton>
					</GradeButtons>
					<PumpInstruction
						style={{
							color: '#3b82f6',
							background: 'rgba(59, 130, 246, 0.1)',
							borderColor: 'rgba(59, 130, 246, 0.3)',
						}}
					>
						📱 Tap here to pay with mobile app
					</PumpInstruction>
				</>
			)}

			<div
				style={{
					marginTop: '1rem',
					paddingTop: '1rem',
					borderTop: '1px solid #334155',
					textAlign: 'center',
					fontSize: '0.75rem',
					color: '#64748b',
				}}
			>
				Fuel Rewards: 250 points • Station #4215
			</div>
		</GasPumpContainer>
	);
};

// ============================================================================
// INDUSTRIAL IOT - SCADA/Control System Style
// ============================================================================

const IndustrialDisplay = styled.div<{ $color: string }>`
	background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
	border: 4px solid #475569;
	border-radius: 0.5rem;
	padding: 0;
	width: 100%;
	max-width: 600px;
	margin: 0 auto;
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
	font-family: 'Courier New', monospace;
`;

const IndustrialHeader = styled.div<{ $color: string }>`
	background: ${(props) => props.$color};
	color: white;
	padding: 0.75rem 1rem;
	display: flex;
	justify-content: space-between;
	align-items: center;
	border-bottom: 2px solid #64748b;
`;

const IndustrialScreen = styled.div`
	background: #000000;
	color: #00ff00;
	font-family: 'Courier New', monospace;
	padding: 1.5rem;
	min-height: 300px;
`;

const StatusGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 1rem;
	margin-top: 1rem;
`;

const StatusItem = styled.div<{ $status: string }>`
	background: rgba(255, 255, 255, 0.05);
	border: 1px solid ${(props) =>
		props.$status === 'ok' ? '#22c55e' : props.$status === 'warning' ? '#fbbf24' : '#ef4444'};
	padding: 0.75rem;
	border-radius: 0.25rem;
	font-size: 0.875rem;
`;

// ============================================================================
// AI AGENT - Chat Interface Style
// ============================================================================

const AIAgentDisplay = styled.div<{ $color: string }>`
	background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%);
	border: 2px solid ${(props) => props.$color};
	border-radius: 1rem;
	padding: 0;
	width: 100%;
	max-width: 500px;
	margin: 0 auto;
	box-shadow: 0 0 30px rgba(168, 85, 247, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5);
`;

const AIHeader = styled.div<{ $color: string }>`
	background: linear-gradient(135deg, ${(props) => props.$color} 0%, ${(props) => props.$color}dd 100%);
	color: white;
	padding: 1rem 1.5rem;
	display: flex;
	justify-content: space-between;
	align-items: center;
	border-radius: 0.875rem 0.875rem 0 0;
`;

const AIChatArea = styled.div`
	padding: 1.5rem;
	min-height: 300px;
	max-height: 400px;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const ChatMessage = styled.div<{ $isAgent?: boolean; $color?: string }>`
	background: ${(props) =>
		props.$isAgent
			? `linear-gradient(135deg, ${props.$color || '#a855f7'} 0%, ${props.$color || '#9333ea'} 100%)`
			: 'rgba(255, 255, 255, 0.1)'};
	color: white;
	padding: 0.75rem 1rem;
	border-radius: ${(props) => (props.$isAgent ? '1rem 1rem 1rem 0.25rem' : '1rem 1rem 0.25rem 1rem')};
	align-self: ${(props) => (props.$isAgent ? 'flex-start' : 'flex-end')};
	max-width: 80%;
	font-size: 0.875rem;
	line-height: 1.5;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
`;

const AITypingIndicator = styled.div`
	display: flex;
	gap: 0.5rem;
	align-items: center;
	color: #94a3b8;
	font-size: 0.875rem;
	animation: pulse 1.5s infinite;
`;

// ============================================================================
// SMART SPEAKER - Voice Assistant Style
// ============================================================================

const SpeakerDisplay = styled.div<{ $color: string; $isActive: boolean }>`
	background: linear-gradient(180deg, #2d3748 0%, #1a202c 100%);
	border: 3px solid ${(props) => (props.$isActive ? props.$color : '#4a5568')};
	border-radius: 50%;
	width: 300px;
	height: 300px;
	margin: 0 auto;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	box-shadow: 
		0 0 ${(props) => (props.$isActive ? '30px' : '10px')} ${(props) => (props.$isActive ? props.$color : 'rgba(0,0,0,0.3)')},
		inset 0 0 50px rgba(0, 0, 0, 0.5);
	transition: all 0.3s ease;
	position: relative;
`;

const SpeakerLight = styled.div<{ $color: string; $isActive: boolean }>`
	width: 80px;
	height: 80px;
	border-radius: 50%;
	background: ${(props) =>
		props.$isActive ? `radial-gradient(circle, ${props.$color} 0%, transparent 70%)` : '#1a202c'};
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 2rem;
	animation: ${(props) => (props.$isActive ? 'pulse 2s infinite' : 'none')};
`;

const SpeakerText = styled.div`
	color: #cbd5e1;
	font-size: 0.875rem;
	margin-top: 1rem;
	text-align: center;
	max-width: 200px;
`;

// ============================================================================
// Industrial IoT Renderer
// ============================================================================

export const IndustrialIoTDisplay: React.FC<RealisticDeviceDisplayProps> = ({
	isSuccess,
	isWaiting,
	brandName,
	deviceName,
	color,
}) => {
	return (
		<IndustrialDisplay $color={color}>
			<IndustrialHeader $color={color}>
				<div style={{ fontWeight: 700, letterSpacing: '0.1em' }}>{brandName}</div>
				<div style={{ fontSize: '0.875rem' }}>{deviceName}</div>
			</IndustrialHeader>
			<IndustrialScreen>
				<div
					style={{
						fontSize: '1.25rem',
						marginBottom: '1rem',
						borderBottom: '1px solid #00ff00',
						paddingBottom: '0.5rem',
					}}
				>
					SYSTEM STATUS
				</div>
				{isSuccess ? (
					<>
						<div style={{ marginBottom: '1rem', color: '#22c55e' }}>✓ AUTHORIZATION: GRANTED</div>
						<StatusGrid>
							<StatusItem $status="ok">
								<div style={{ fontWeight: 'bold' }}>VALVE A-01</div>
								<div style={{ color: '#22c55e' }}>● OPERATIONAL</div>
								<div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Pressure: 125 PSI</div>
							</StatusItem>
							<StatusItem $status="ok">
								<div style={{ fontWeight: 'bold' }}>PUMP #04</div>
								<div style={{ color: '#22c55e' }}>● RUNNING</div>
								<div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Flow: 45 GPM</div>
							</StatusItem>
							<StatusItem $status="ok">
								<div style={{ fontWeight: 'bold' }}>SENSOR ARRAY</div>
								<div style={{ color: '#22c55e' }}>● ACTIVE</div>
								<div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>All 12 online</div>
							</StatusItem>
							<StatusItem $status="ok">
								<div style={{ fontWeight: 'bold' }}>NETWORK</div>
								<div style={{ color: '#22c55e' }}>● CONNECTED</div>
								<div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>SCADA Link OK</div>
							</StatusItem>
						</StatusGrid>
					</>
				) : isWaiting ? (
					<>
						<div style={{ marginBottom: '1rem', color: '#fbbf24' }}>
							⏳ AWAITING AUTHORIZATION...
						</div>
						<StatusGrid>
							<StatusItem $status="warning">
								<div style={{ fontWeight: 'bold' }}>AUTH STATUS</div>
								<div style={{ color: '#fbbf24' }}>○ PENDING</div>
								<div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Scan QR code</div>
							</StatusItem>
							<StatusItem $status="ok">
								<div style={{ fontWeight: 'bold' }}>SYSTEM</div>
								<div style={{ color: '#22c55e' }}>● STANDBY</div>
								<div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Ready to start</div>
							</StatusItem>
						</StatusGrid>
					</>
				) : (
					<>
						<div style={{ marginBottom: '1rem', color: '#64748b' }}>■ SYSTEM OFFLINE</div>
						<div style={{ fontSize: '0.875rem', color: '#64748b' }}>
							Authorize controller to begin operations
						</div>
					</>
				)}
			</IndustrialScreen>
		</IndustrialDisplay>
	);
};

// ============================================================================
// AI Agent Renderer
// ============================================================================

export const AIAgentDisplayComponent: React.FC<RealisticDeviceDisplayProps> = ({
	isSuccess,
	isWaiting,
	brandName,
	color,
}) => {
	return (
		<AIAgentDisplay $color={color}>
			<AIHeader $color={color}>
				<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
					<div style={{ fontSize: '1.5rem' }}>🤖</div>
					<div>
						<div style={{ fontWeight: 700, fontSize: '1.125rem' }}>{brandName}</div>
						<div style={{ fontSize: '0.75rem', opacity: 0.9 }}>AI Assistant v3.2</div>
					</div>
				</div>
				<div
					style={{
						fontSize: '0.75rem',
						background: 'rgba(255,255,255,0.2)',
						padding: '0.25rem 0.75rem',
						borderRadius: '1rem',
					}}
				>
					{isSuccess ? '● Online' : isWaiting ? '○ Connecting' : '○ Offline'}
				</div>
			</AIHeader>
			<AIChatArea>
				{isSuccess ? (
					<>
						<ChatMessage $isAgent $color={color}>
							Hello! I'm authorized and ready to assist you. I have access to your enterprise data
							and can help with complex queries, data analysis, and automated workflows.
						</ChatMessage>
						<ChatMessage $isAgent={false}>What can you help me with?</ChatMessage>
						<ChatMessage $isAgent $color={color}>
							I can help you with: • Document analysis and summarization • Data retrieval from
							authorized systems • Workflow automation • Real-time analytics and reporting
						</ChatMessage>
					</>
				) : isWaiting ? (
					<>
						<ChatMessage $isAgent $color={color}>
							I need authorization to access your enterprise resources. Please scan the QR code to
							grant me access.
						</ChatMessage>
						<AITypingIndicator>
							<span>●</span>
							<span>●</span>
							<span>●</span>
							<span>Waiting for authorization...</span>
						</AITypingIndicator>
					</>
				) : (
					<ChatMessage $isAgent $color={color}>
						Welcome! I'm your AI assistant. Please authorize me to get started.
					</ChatMessage>
				)}
			</AIChatArea>
		</AIAgentDisplay>
	);
};

// ============================================================================
// Smart Speaker Renderer
// ============================================================================

export const SmartSpeakerDisplay: React.FC<RealisticDeviceDisplayProps> = ({
	isSuccess,
	isWaiting,
	brandName,
	color,
}) => {
	return (
		<div style={{ textAlign: 'center', padding: '2rem' }}>
			<SpeakerDisplay $color={color} $isActive={isSuccess || isWaiting}>
				<SpeakerLight $color={color} $isActive={isSuccess || isWaiting}>
					{isSuccess ? '✓' : isWaiting ? '●' : '○'}
				</SpeakerLight>
				<SpeakerText>
					<div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>
						{brandName}
					</div>
					{isSuccess && <div style={{ color: '#22c55e' }}>Ready for voice commands</div>}
					{isWaiting && <div style={{ color: '#fbbf24' }}>Waiting for authorization...</div>}
					{!isSuccess && !isWaiting && (
						<div style={{ color: '#64748b' }}>Say "Hey {brandName}" to start</div>
					)}
				</SpeakerText>
			</SpeakerDisplay>
			{isSuccess && (
				<div
					style={{
						marginTop: '1.5rem',
						padding: '1rem',
						background: 'rgba(34, 197, 94, 0.1)',
						border: '1px solid rgba(34, 197, 94, 0.3)',
						borderRadius: '0.5rem',
						color: '#22c55e',
						fontSize: '0.875rem',
					}}
				>
					✓ Voice assistant is now authorized and listening
				</div>
			)}
		</div>
	);
};

// ============================================================================
// Helper function to get realistic display component
// ============================================================================

export const getRealisticDeviceComponent = (deviceType: string) => {
	switch (deviceType) {
		case 'streaming-tv':
			return SmartTVDisplay;
		case 'gaming-console':
			return GamingConsoleDisplay;
		case 'gas-pump':
			return GasPumpDisplay;
		case 'iot-device':
			return IndustrialIoTDisplay;
		case 'ai-agent':
			return AIAgentDisplayComponent;
		case 'smart-speaker':
			return SmartSpeakerDisplay;
		default:
			return null;
	}
};
