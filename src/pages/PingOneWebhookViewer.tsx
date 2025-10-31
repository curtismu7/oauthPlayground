// src/pages/PingOneWebhookViewer.tsx
// PingOne Webhook Viewer - Real-time webhook event monitoring

import React, { useState, useEffect, useCallback } from 'react';
import { FiServer, FiClock, FiTag, FiAlertCircle, FiCheckCircle, FiTrash2, FiFilter, FiRefreshCw, FiDownload, FiActivity, FiCopy } from 'react-icons/fi';
import styled from 'styled-components';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { secureLog, secureErrorLog } from '../utils/secureLogging';

// Container
const Container = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1.5rem 3rem;
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

const ActionButtons = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  ${({ $variant = 'secondary' }) => {
    switch ($variant) {
      case 'primary':
        return `
          background: #3b82f6;
          color: white;
          &:hover { background: #2563eb; }
        `;
      case 'danger':
        return `
          background: #ef4444;
          color: white;
          &:hover { background: #dc2626; }
        `;
      default:
        return `
          background: #f1f5f9;
          color: #475569;
          &:hover { background: #e2e8f0; }
        `;
    }
  }}
`;

// Webhook List
const WebhookContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
`;

const WebhookCard = styled.div<{ $type?: string }>`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
  
  &:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    border-color: #cbd5e1;
  }
`;

const WebhookHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const WebhookTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
`;

const WebhookMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.875rem;
  color: #64748b;
`;

const WebhookBody = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  overflow-x: auto;
`;

const StatusBadge = styled.span<{ $status?: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  
  ${({ $status }) => {
    switch ($status) {
      case 'success':
        return 'background: #dcfce7; color: #166534;';
      case 'error':
        return 'background: #fee2e2; color: #991b1b;';
      case 'pending':
        return 'background: #fef3c7; color: #92400e;';
      default:
        return 'background: #f1f5f9; color: #475569;';
    }
  }}
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: #64748b;
  
  svg {
    margin-bottom: 1rem;
    opacity: 0.5;
  }
`;

// Filter Bar
const FilterBar = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
`;

const FilterSelect = styled.select`
  padding: 0.5rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.375rem;
  background: white;
  font-size: 0.875rem;
  color: #1e293b;
`;

interface WebhookEvent {
  id: string;
  timestamp: Date;
  type: string;
  event: string;
  data: any;
  status: 'success' | 'error' | 'pending';
  source: string;
}

const PingOneWebhookViewer: React.FC = () => {
  const [webhooks, setWebhooks] = useState<WebhookEvent[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [isActive, setIsActive] = useState(false);

  // Simulate incoming webhooks
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const eventTypes = [
        'user.created',
        'user.updated',
        'group.created',
        'application.created',
        'environment.updated',
        'authorization.success',
        'authorization.error',
      ];

      const statuses: Array<'success' | 'error' | 'pending'> = ['success', 'error', 'pending'];
      
      const newWebhook: WebhookEvent = {
        id: `webhook-${Date.now()}`,
        timestamp: new Date(),
        type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        event: 'webhook.event',
        data: {
          resource_id: `res_${Math.random().toString(36).substr(2, 9)}`,
          environment_id: 'env_default',
          data: { test: 'sample data', timestamp: new Date().toISOString() }
        },
        status: statuses[Math.floor(Math.random() * statuses.length)],
        source: 'pingone-api'
      };

      setWebhooks(prev => [newWebhook, ...prev].slice(0, 50)); // Keep last 50
    }, 5000); // Simulate new webhook every 5 seconds

    return () => clearInterval(interval);
  }, [isActive]);

  const handleStartMonitoring = useCallback(() => {
    setIsActive(true);
    v4ToastManager.showSuccess('Webhook monitoring started');
    secureLog('PingOneWebhookViewer', 'Started webhook monitoring');
  }, []);

  const handleStopMonitoring = useCallback(() => {
    setIsActive(false);
    v4ToastManager.showSuccess('Webhook monitoring stopped');
    secureLog('PingOneWebhookViewer', 'Stopped webhook monitoring');
  }, []);

  const handleClearWebhooks = useCallback(() => {
    setWebhooks([]);
    v4ToastManager.showInfo('Webhook history cleared');
  }, []);

  const handleExportWebhooks = useCallback(() => {
    const dataStr = JSON.stringify(webhooks, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pingone-webhooks-${new Date().toISOString()}.json`;
    link.click();
    v4ToastManager.showSuccess('Webhooks exported');
  }, [webhooks]);

  const filteredWebhooks = filter === 'all' 
    ? webhooks 
    : webhooks.filter(w => w.status === filter);

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(timestamp);
  };

  const formatData = (data: any) => {
    return JSON.stringify(data, null, 2);
  };

  return (
    <Container>
      <Header>
        <Title>
          <FiServer />
          PingOne Webhook Viewer
        </Title>
        <ActionButtons>
          {!isActive ? (
            <Button $variant="primary" onClick={handleStartMonitoring}>
              <FiActivity />
              Start Monitoring
            </Button>
          ) : (
            <Button $variant="danger" onClick={handleStopMonitoring}>
              <FiActivity />
              Stop Monitoring
            </Button>
          )}
          <Button $variant="secondary" onClick={handleClearWebhooks} disabled={webhooks.length === 0}>
            <FiTrash2 />
            Clear History
          </Button>
          <Button $variant="secondary" onClick={handleExportWebhooks} disabled={webhooks.length === 0}>
            <FiDownload />
            Export
          </Button>
        </ActionButtons>
      </Header>

      <div style={{ 
        background: '#fef3c7', 
        border: '2px solid #f59e0b', 
        borderRadius: '0.5rem', 
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <FiAlertCircle color="#f59e0b" size={20} />
          <strong style={{ color: '#92400e', fontSize: '1rem' }}>Webhook Configuration URL</strong>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ 
            background: 'white', 
            border: '1px solid #f59e0b', 
            borderRadius: '0.375rem', 
            padding: '0.75rem 1rem', 
            flex: 1,
            fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
            fontSize: '0.875rem',
            wordBreak: 'break-all'
          }}>
            {window.location.origin}/api/webhooks/pingone
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/pingone`);
              v4ToastManager.showSuccess('Webhook URL copied to clipboard');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <FiCopy />
            Copy URL
          </button>
        </div>
        <p style={{ color: '#92400e', fontSize: '0.875rem', margin: '1rem 0 0 0' }}>
          Copy this URL and paste it into the "Destination URL" field in your PingOne webhook configuration.
        </p>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
          Monitor PingOne webhook events in real-time. Start monitoring to begin receiving simulated webhook events.
        </p>
      </div>

      {webhooks.length > 0 && (
        <FilterBar>
          <FiFilter size={20} color="#64748b" />
          <FilterSelect value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Events ({webhooks.length})</option>
            <option value="success">Success ({webhooks.filter(w => w.status === 'success').length})</option>
            <option value="error">Errors ({webhooks.filter(w => w.status === 'error').length})</option>
            <option value="pending">Pending ({webhooks.filter(w => w.status === 'pending').length})</option>
          </FilterSelect>
        </FilterBar>
      )}

      <WebhookContainer>
        {filteredWebhooks.length === 0 ? (
          <EmptyState>
            <FiServer size={48} />
            <h3>No webhooks yet</h3>
            <p>
              {isActive 
                ? 'Waiting for webhook events...' 
                : 'Click "Start Monitoring" to begin receiving webhook events.'}
            </p>
          </EmptyState>
        ) : (
          filteredWebhooks.map((webhook) => (
            <WebhookCard key={webhook.id} $type={webhook.type}>
              <WebhookHeader>
                <WebhookTitle>
                  <StatusBadge $status={webhook.status}>
                    {webhook.status === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
                    {webhook.status}
                  </StatusBadge>
                  <span>{webhook.type}</span>
                </WebhookTitle>
                <WebhookMeta>
                  <FiClock size={16} />
                  {formatTimestamp(webhook.timestamp)}
                  <FiTag size={16} />
                  {webhook.source}
                </WebhookMeta>
              </WebhookHeader>
              <WebhookBody>
                <pre>{formatData(webhook.data)}</pre>
              </WebhookBody>
            </WebhookCard>
          ))
        )}
      </WebhookContainer>
    </Container>
  );
};

export default PingOneWebhookViewer;

