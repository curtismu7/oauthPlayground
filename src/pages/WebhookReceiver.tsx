// src/pages/WebhookReceiver.tsx
// Webhook Receiver - Receives and processes PingOne webhook events

import React, { useEffect, useState } from 'react';
import { FiAlertTriangle, FiCopy, FiRefreshCw, FiServer } from 'react-icons/fi';
import styled from 'styled-components';
import { v4ToastManager } from '../utils/v4ToastMessages';

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

const _StatusBadge = styled.div<{ $status: 'active' | 'inactive' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  background: ${({ $status }) => ($status === 'active' ? '#dcfce7' : '#fee2e2')};
  color: ${({ $status }) => ($status === 'active' ? '#166534' : '#991b1b')};
`;

const WebhookInfo = styled.div`
  background: #f8fafc;
  border: 2px solid #e2e8f0;
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
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #2563eb;
  }
`;

const EventsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const EventCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
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
  background: #f8fafc;
  border: 1px solid #e2e8f0;
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
	headers: any;
	body: any;
}

const WebhookReceiver: React.FC = () => {
	const [_isActive, _setIsActive] = useState(false);
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
		v4ToastManager.showSuccess('Webhook URL copied to clipboard');
	};

	const handleClearEvents = () => {
		setEvents([]);
		v4ToastManager.showInfo('Webhook history cleared');
	};

	// This component would typically be backed by an API endpoint
	// that receives POST requests from PingOne webhooks
	// For now, it displays the webhook URL for configuration

	return (
		<Container>
			<Header>
				<Title>
					<FiServer />
					Webhook Receiver
				</Title>
			</Header>

			<WebhookInfo>
				<h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
					Webhook Endpoint
				</h2>
				<p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem' }}>
					Use this URL in your PingOne webhook configuration:
				</p>

				<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
					<WebhookURL>{webhookUrl}</WebhookURL>
					<CopyButton onClick={handleCopyUrl}>
						<FiCopy />
						Copy URL
					</CopyButton>
				</div>

				<div
					style={{
						marginTop: '1.5rem',
						padding: '1rem',
						background: '#fef3c7',
						border: '1px solid #fbbf24',
						borderRadius: '0.5rem',
					}}
				>
					<div
						style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}
					>
						<FiAlertTriangle color="#f59e0b" />
						<strong style={{ color: '#92400e' }}>Note:</strong>
					</div>
					<p style={{ fontSize: '0.875rem', color: '#92400e', margin: 0 }}>
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
							color: '#475569',
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
							onClick={handleClearEvents}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
								padding: '0.5rem 1rem',
								background: '#ef4444',
								color: 'white',
								border: 'none',
								borderRadius: '0.375rem',
								cursor: 'pointer',
							}}
						>
							<FiRefreshCw />
							Clear Events
						</button>
					</div>
					{events.map((event) => (
						<EventCard key={event.id}>
							<EventHeader>
								<div>
									<strong>{event.method}</strong>
									<span style={{ marginLeft: '1rem', color: '#64748b', fontSize: '0.875rem' }}>
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
