import { V9_COLORS } from '../services/v9/V9ColorStandards';
// src/pages/WebhookReceiver.tsx
// Webhook Receiver - Receives and processes PingOne webhook events


import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import { FiAlertTriangle } from '@icons';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const WebhookInfo = styled.div`
  background: V9_COLORS.BG.GRAY_LIGHT;
  border: 2px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 0.75rem;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const WebhookURL = styled.div`
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  word-break: break-all;
`;

const CopyButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: V9_COLORS.PRIMARY.BLUE;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: V9_COLORS.PRIMARY.BLUE_DARK;
  }
`;

const EventsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const EventCard = styled.div`
  background: white;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const EventHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const EventData = styled.pre`
  background: V9_COLORS.BG.GRAY_LIGHT;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 0.5rem;
  padding: 1rem;
  overflow-x: auto;
  font-size: 0.875rem;
  max-height: 300px;
  overflow-y: auto;
`;

interface WebhookEvent {
	id: string;
	timestamp: Date;
	method: string;
	headers: Record<string, string>;
	body: unknown;
}

const WebhookReceiver: React.FC = () => {
	const [webhookUrl, setWebhookUrl] = useState('');
	const [events, setEvents] = useState<WebhookEvent[]>([]);

	useEffect(() => {
		// Generate webhook URL based on current origin
		const origin = window.location.origin;
		const url = `${origin}/webhooks/pingone`;
		setWebhookUrl(url);
	}, []);

	const handleCopyUrl = () => {
		navigator.clipboard.writeText(webhookUrl);
		modernMessaging.showFooterMessage({
			type: 'status',
			message: 'Webhook URL copied to clipboard',
			duration: 4000,
		});
	};

	const handleClearEvents = () => {
		setEvents([]);
		modernMessaging.showFooterMessage({
			type: 'info',
			message: 'Webhook history cleared',
			duration: 4000,
		});
	};

	// This component would typically be backed by an API endpoint
	// that receives POST requests from PingOne webhooks
	// For now, it displays the webhook URL for configuration

	return (
		<Container>
			<Header>
				<Title>
					<span>🖥️</span>
					Webhook Receiver
				</Title>
			</Header>

			<WebhookInfo>
				<h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
					Webhook Endpoint
				</h2>
				<p style={{ color: 'V9_COLORS.TEXT.GRAY_MEDIUM', fontSize: '0.875rem', marginBottom: '1rem' }}>
					Use this URL in your PingOne webhook configuration:
				</p>

				<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
					<WebhookURL>{webhookUrl}</WebhookURL>
					<CopyButton onClick={handleCopyUrl}>
						<span>📋</span>
						Copy URL
					</CopyButton>
				</div>

				<div
					style={{
						marginTop: '1.5rem',
						padding: '1rem',
						background: 'V9_COLORS.BG.WARNING',
						border: '1px solid V9_COLORS.PRIMARY.YELLOW_LIGHT',
						borderRadius: '0.5rem',
					}}
				>
					<div
						style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}
					>
						<FiAlertTriangle color="V9_COLORS.PRIMARY.YELLOW" />
						<strong style={{ color: 'V9_COLORS.PRIMARY.YELLOW_DARK' }}>Note:</strong>
					</div>
					<p style={{ fontSize: '0.875rem', color: 'V9_COLORS.PRIMARY.YELLOW_DARK', margin: 0 }}>
						This endpoint is for demonstration purposes. To receive real webhooks from PingOne,
						you'll need to deploy this application to a publicly accessible server or use a webhook
						tunnel service.
					</p>
				</div>

				<div style={{ marginTop: '1.5rem' }}>
					<h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
						Webhook Setup Instructions:
					</h3>
					<ol
						style={{
							fontSize: '0.875rem',
							color: 'V9_COLORS.TEXT.GRAY_MEDIUM',
							paddingLeft: '1.5rem',
							lineHeight: '1.8',
						}}
					>
						<li>Copy the webhook URL above</li>
						<li>Go to PingOne Admin Console → Notifications → Webhooks</li>
						<li>Click "Create Webhook"</li>
						<li>Enter a name for your webhook</li>
						<li>Paste the copied URL in the "Destination URL" field</li>
						<li>Select the format (JSON recommended)</li>
						<li>Click "Save" to create the webhook</li>
					</ol>
				</div>
			</WebhookInfo>

			{events.length > 0 && (
				<EventsList>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: '1rem',
						}}
					>
						<h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Received Events</h2>
						<button
							type="button"
							onClick={handleClearEvents}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
								padding: '0.5rem 1rem',
								background: 'V9_COLORS.PRIMARY.RED',
								color: 'white',
								border: 'none',
								borderRadius: '0.375rem',
								cursor: 'pointer',
							}}
						>
							<span>🔄</span>
							Clear Events
						</button>
					</div>
					{events.map((event) => (
						<EventCard key={event.id}>
							<EventHeader>
								<div>
									<strong>{event.method}</strong>
									<span style={{ marginLeft: '1rem', color: 'V9_COLORS.TEXT.GRAY_MEDIUM', fontSize: '0.875rem' }}>
										{event.timestamp.toLocaleString()}
									</span>
								</div>
							</EventHeader>
							<EventData>{JSON.stringify(event.body, null, 2)}</EventData>
						</EventCard>
					))}
				</EventsList>
			)}
		</Container>
	);
};

export default WebhookReceiver;
