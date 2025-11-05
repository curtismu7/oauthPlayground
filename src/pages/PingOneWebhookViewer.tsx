// src/pages/PingOneWebhookViewer.tsx
// PingOne Webhook Viewer - Real-time webhook event monitoring

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FiServer, FiClock, FiTag, FiAlertCircle, FiCheckCircle, FiTrash2, FiFilter, FiRefreshCw, FiDownload, FiActivity, FiCopy, FiCalendar, FiX } from 'react-icons/fi';
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
  flex-wrap: wrap;
`;

const FilterSelect = styled.select`
  padding: 0.5rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.375rem;
  background: white;
  font-size: 0.875rem;
  color: #1e293b;
  min-width: 150px;
`;

const FilterLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ClearFiltersButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.375rem;
  background: white;
  font-size: 0.875rem;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f1f5f9;
    color: #475569;
  }
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
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch webhook events from backend
  const fetchWebhookEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/webhooks/events?limit=1000');
      if (!response.ok) {
        throw new Error('Failed to fetch webhook events');
      }
      const data = await response.json();
      
      // Transform backend events to frontend format
      const transformedEvents: WebhookEvent[] = data.events.map((event: any) => ({
        id: event.id,
        timestamp: new Date(event.timestamp),
        type: event.type || event.event || 'unknown',
        event: event.event || 'webhook.event',
        data: event.data || event.rawBody || {},
        status: event.status || 'success',
        source: event.source || 'pingone-api',
      }));
      
      setWebhooks(transformedEvents);
      console.log(`[Webhook Viewer] Loaded ${transformedEvents.length} webhook events`);
    } catch (error) {
      console.error('[Webhook Viewer] Error fetching events:', error);
      v4ToastManager.showError('Failed to load webhook events');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load webhook events on mount
  useEffect(() => {
    fetchWebhookEvents();
  }, [fetchWebhookEvents]);

  // Poll for new webhook events when monitoring is active
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      fetchWebhookEvents();
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [isActive, fetchWebhookEvents]);

  const handleStartMonitoring = useCallback(() => {
    setIsActive(true);
    fetchWebhookEvents(); // Immediately fetch events
    v4ToastManager.showSuccess('Webhook monitoring started - polling for new events every 3 seconds');
    secureLog('PingOneWebhookViewer', 'Started webhook monitoring');
  }, [fetchWebhookEvents]);

  const handleStopMonitoring = useCallback(() => {
    setIsActive(false);
    v4ToastManager.showSuccess('Webhook monitoring stopped');
    secureLog('PingOneWebhookViewer', 'Stopped webhook monitoring');
  }, []);

  const handleClearWebhooks = useCallback(async () => {
    try {
      const response = await fetch('/api/webhooks/events', {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to clear webhook events');
      }
      setWebhooks([]);
      v4ToastManager.showSuccess('Webhook history cleared');
      secureLog('PingOneWebhookViewer', 'Cleared webhook history');
    } catch (error) {
      console.error('[Webhook Viewer] Error clearing events:', error);
      v4ToastManager.showError('Failed to clear webhook events');
    }
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

  // Get unique event types from webhooks
  const eventTypes = useMemo(() => {
    const types = new Set(webhooks.map(w => w.type));
    return Array.from(types).sort();
  }, [webhooks]);

  // Calculate time filter cutoff
  const getTimeCutoff = useCallback(() => {
    const now = Date.now();
    switch (timeFilter) {
      case '1h':
        return now - 60 * 60 * 1000;
      case '24h':
        return now - 24 * 60 * 60 * 1000;
      case '7d':
        return now - 7 * 24 * 60 * 60 * 1000;
      case '30d':
        return now - 30 * 24 * 60 * 60 * 1000;
      default:
        return 0;
    }
  }, [timeFilter]);

  // Apply all filters
  const filteredWebhooks = useMemo(() => {
    let filtered = webhooks;

    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(w => w.status === filter);
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(w => w.type === typeFilter);
    }

    // Filter by time
    if (timeFilter !== 'all') {
      const cutoff = getTimeCutoff();
      filtered = filtered.filter(w => w.timestamp.getTime() >= cutoff);
    }

    return filtered;
  }, [webhooks, filter, typeFilter, timeFilter, getTimeCutoff]);

  const handleClearFilters = useCallback(() => {
    setFilter('all');
    setTypeFilter('all');
    setTimeFilter('all');
  }, []);

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
          Monitor PingOne webhook events in real-time. Configure the webhook URL above in PingOne, then start monitoring to see events as they arrive.
        </p>
        {isActive && (
          <p style={{ color: '#10b981', fontSize: '0.875rem', marginTop: '0.5rem', fontWeight: 500 }}>
            ✓ Monitoring active - Polling for new events every 3 seconds
          </p>
        )}
      </div>

      {webhooks.length > 0 && (
        <FilterBar>
          <FiFilter size={20} color="#64748b" />
          <FilterLabel>
            Status:
            <FilterSelect value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All ({webhooks.length})</option>
              <option value="success">Success ({webhooks.filter(w => w.status === 'success').length})</option>
              <option value="error">Errors ({webhooks.filter(w => w.status === 'error').length})</option>
              <option value="pending">Pending ({webhooks.filter(w => w.status === 'pending').length})</option>
            </FilterSelect>
          </FilterLabel>
          <FilterLabel>
            <FiCalendar />
            Time:
            <FilterSelect value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}>
              <option value="all">All Time</option>
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </FilterSelect>
          </FilterLabel>
          <FilterLabel>
            <FiTag />
            Type:
            <FilterSelect value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All Types ({eventTypes.length})</option>
              {eventTypes.map(type => (
                <option key={type} value={type}>
                  {type} ({webhooks.filter(w => w.type === type).length})
                </option>
              ))}
            </FilterSelect>
          </FilterLabel>
          {(filter !== 'all' || typeFilter !== 'all' || timeFilter !== 'all') && (
            <ClearFiltersButton onClick={handleClearFilters}>
              <FiX />
              Clear Filters
            </ClearFiltersButton>
          )}
        </FilterBar>
      )}

      <WebhookContainer>
        {filteredWebhooks.length === 0 ? (
          <EmptyState>
            <FiServer size={48} />
            <h3>
              {webhooks.length === 0 
                ? 'No webhooks yet' 
                : 'No webhooks match your filters'}
            </h3>
            <p>
              {webhooks.length === 0 
                ? (isActive 
                    ? 'Waiting for webhook events...' 
                    : 'Click "Start Monitoring" to begin receiving webhook events.')
                : 'Try adjusting your filters to see more results.'}
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

