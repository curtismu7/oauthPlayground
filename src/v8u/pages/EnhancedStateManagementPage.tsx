import React, { useState } from 'react';
import styled from 'styled-components';
import { FiDatabase, FiRefreshCw, FiRotateCcw, FiDownload, FiUpload, FiTrash2, FiSettings, FiActivity, FiClock, FiWifi, FiCheckCircle, FiAlertTriangle, FiZap, FiBell, FiBellOff } from 'react-icons/fi';
import { useUnifiedFlowState, stateUtils } from '../services/enhancedStateManagementV2';
import { initialState } from '../services/enhancedStateManagementV2';

const PageContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;
  text-align: center;
`;

const PageTitle = styled.h1`
  color: #1e293b;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const PageSubtitle = styled.p`
  color: #64748b;
  font-size: 1rem;
  margin: 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const StatIcon = styled.div<{ $color?: string }>`
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: ${props => props.$color || '#64748b'};
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #64748b;
`;

const SectionContainer = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
`;

const SectionTitle = styled.h2`
  color: #1e293b;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
`;

const SectionIcon = styled.div`
  font-size: 1.25rem;
  color: #3b82f6;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 1rem;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
          
          &:hover {
            background: #2563eb;
            border-color: #2563eb;
          }
        `;
      case 'danger':
        return `
          background: #ef4444;
          border-color: #ef4444;
          color: white;
          
          &:hover {
            background: #dc2626;
            border-color: #dc2626;
          }
        `;
      default:
        return `
          background: white;
          border-color: #e2e8f0;
          color: #64748b;
          
          &:hover {
            background: #f8fafc;
            border-color: #cbd5e1;
            color: #475569;
          }
        `;
    }
  }}
`;

const StatusIndicator = styled.div<{ $status: 'online' | 'offline' | 'pending' | 'synced' | 'error' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  
  ${props => {
    switch (props.$status) {
      case 'online':
        return `
          background: #dcfce7;
          color: #166534;
          border-color: #86efac;
        `;
      case 'offline':
        return `
          background: #fee2e2;
          color: #991b1b;
          border-color: #fecaca;
        `;
      case 'pending':
        return `
          background: #fef3c7;
          color: #92400e;
          border-color: #fbbf24;
        `;
      case 'synced':
        return `
          background: #dcfce7;
          color: #166534;
          border-color: #86efac;
        `;
      case 'error':
        return `
          background: #fee2e2;
          color: #991b1b;
          border-color: #fecaca;
        `;
      default:
        return `
          background: #f3f4f6;
          color: #4b5563;
          border-color: #d1d5db;
        `;
    }
  }}
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const FeatureItem = styled.li`
  padding: 0.75rem 0;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  &:last-child {
    border-bottom: none;
  }
`;

const FeatureIcon = styled.div<{ $color?: string }>`
  font-size: 1rem;
  color: ${props => props.$color || '#3b82f6'};
`;

const FeatureText = styled.div`
  flex: 1;
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.4;
`;

const FeatureStatus = styled.span<{ $enabled: boolean }>`
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  
  ${props => {
    return props.$enabled 
      ? `
        background: #dcfce7;
        color: #166534;
        border-color: #86efac;
      `
      : `
        background: #f3f4f6;
        color: #6b7280;
        border-color: #d1d5db;
      `;
  }}
`;

const HistoryControls = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 1rem;
`;

const HistoryButton = styled.button<{ $disabled?: boolean }>`
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  border: 1px solid;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  ${props => {
    return props.$disabled 
      ? `
        background: #f3f4f6;
        color: #9ca3af;
        border-color: #d1d5db;
      `
      : `
        background: white;
        color: #374151;
        border-color: #d1d5db;
        
        &:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #1e293b;
        }
      `;
  }}
`;

const ExportImportControls = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  padding: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin: 1rem 0;
`;

const ExportImportButton = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #3b82f6;
  background: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: #2563eb;
    border-color: #2563eb;
  }
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 1rem;
  color: #991b1b;
  text-align: center;
  font-size: 0.875rem;
`;

const SuccessMessage = styled.div`
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 8px;
  padding: 1rem;
  color: #166534;
  text-align: center;
  font-size: 0.875rem;
`;

export const EnhancedStateManagementPage: React.FC = () => {
  const { state, dispatch } = useUnifiedFlowState();
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [isExporting, setIsExporting] = useState(false);

  // Helper functions for undo/redo
  const canUndo = () => state.history.past.length > 0;
  const canRedo = () => state.history.future.length > 0;
  const undo = () => {
    if (canUndo()) {
      dispatch({ type: 'UNDO' });
      return true;
    }
    return false;
  };
  const redo = () => {
    if (canRedo()) {
      dispatch({ type: 'REDO' });
      return true;
    }
    return false;
  };
  const [isImporting, setIsImporting] = useState(false);

  // Export state
  const handleExport = async () => {
    try {
      setIsExporting(true);
      const stateData = stateUtils.exportState(state);
      
      if (!stateData) {
        throw new Error('Failed to export state data');
      }

      const blob = new Blob([JSON.stringify(stateData, null, 2)], {
        type: 'application/json',
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `enhanced-state-management-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setMessage('State exported successfully!');
      setMessageType('success');
    } catch (error) {
      console.error('Failed to export state:', error);
      setMessage('Failed to export state data');
      setMessageType('error');
    } finally {
      setIsExporting(false);
    }
  };

  // Import state
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const text = await file.text();
      const importedState = stateUtils.importState(text);
      
      if (importedState) {
        dispatch({ type: 'LOAD_STATE', payload: importedState });
        setMessage('State imported successfully');
        setMessageType('success');
      }
    } catch (error) {
      setMessage('Failed to import state');
      setMessageType('error');
    } finally {
      setIsImporting(false);
      // Clear the file input
      event.target.value = '';
    }
  };

  // Reset all state
  const handleResetAll = () => {
    dispatch({ type: 'LOAD_STATE', payload: initialState });
    setMessage('All state has been reset to defaults');
    setMessageType('info');
  };

  // Clear history
  const handleClearHistory = () => {
    dispatch({ type: 'LOAD_STATE', payload: { ...state, history: { past: [], present: [], future: [] } } });
    setMessage('History cleared successfully');
    setMessageType('info');
  };

  // Test undo/redo
  const handleUndo = () => {
    const success = undo();
    setMessage(success ? 'Undo successful' : 'Nothing to undo');
    setMessageType(success ? 'success' : 'info');
  };

  const handleRedo = () => {
    const success = redo();
    setMessage(success ? 'Redo successful' : 'Nothing to redo');
    setMessageType(success ? 'success' : 'info');
  };

  // Get state statistics
  const flowStats = stateUtils.getFlowStats(state.flows);
  const stats = {
    ...flowStats,
    unifiedFlow: { total: flowStats.total, active: flowStats.active },
    performance: { renderTime: '2.3ms', memoryUsage: '12.4MB' },
    history: { past: state.history.past.length, future: state.history.future.length },
    offline: { enabled: true, synced: true, lastSync: new Date().toISOString() },
  };

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>🔧 Enhanced State Management</PageTitle>
        <PageSubtitle>
          Advanced state management with undo/redo, offline capabilities, and persistence
        </PageSubtitle>
      </PageHeader>

      {message && (
        <div style={{
          marginBottom: '1rem',
        }}>
          <div style={{
            padding: '1rem',
            borderRadius: '8px',
            background: messageType === 'success' ? '#f0fdf4' : messageType === 'error' ? '#fef2f2' : '#eff6ff',
            border: `1px solid ${messageType === 'success' ? '#86efac' : messageType === 'error' ? '#fecaca' : '#bfdbfe'}`,
            color: messageType === 'success' ? '#166534' : messageType === 'error' ? '#991b1b' : '#1e40af',
            textAlign: 'center',
          }}>
            {message}
          </div>
        </div>
      )}

      {/* State Statistics */}
      <StatsGrid>
        <StatCard>
          <StatIcon $color="#3b82f6">
            <FiDatabase />
          </StatIcon>
          <StatValue>{stats?.unifiedFlow?.tokenCount || 0}</StatValue>
          <StatLabel>Active Tokens</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatIcon $color="#10b981">
            <FiCheckCircle />
          </StatIcon>
          <StatValue>{stats?.unifiedFlow?.featureCount || 0}</StatValue>
          <StatLabel>Active Features</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatIcon $color="#f59e0b">
            <FiAlertTriangle />
          </StatIcon>
          <StatValue>{stats?.unifiedFlow?.errorCount || 0}</StatValue>
          <StatLabel>Active Errors</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatIcon $color="#8b5cf6">
            <FiClock />
          </StatIcon>
          <StatValue>{stats?.performance?.lastActivity ? new Date(stats.performance.lastActivity).toLocaleTimeString() : 'Never'}</StatValue>
          <StatLabel>Last Activity</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatIcon $color="#8b5cf6">
            <FiRotateCcw />
          </StatIcon>
          <StatValue>{stats?.history?.pastCount || 0}</StatValue>
          <StatLabel>History States</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatIcon $color="#8b5cf6">
            <FiWifi />
          </StatIcon>
          <StatValue>
            <StatusIndicator $status={stats?.offline?.isOnline ? 'online' : 'offline'}>
              {stats?.offline?.isOnline ? 'Online' : 'Offline'}
            </StatusIndicator>
          </StatValue>
          <StatLabel>Connection Status</StatLabel>
        </StatCard>
      </StatsGrid>

      {/* Offline Status */}
      <SectionContainer>
        <SectionHeader>
          <SectionIcon>
            <FiWifi />
          </SectionIcon>
          <SectionTitle>Offline Status</SectionTitle>
        </SectionHeader>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1rem',
          background: stats?.offline?.isOnline ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${stats?.offline?.isOnline ? '#86efac' : '#fecaca'}`,
          borderRadius: '8px',
          marginBottom: '1rem',
        }}>
          <div>
            <strong>Status:</strong> {stats?.offline?.isOnline ? 'Online' : 'Offline'}
          </div>
          <div>
            <strong>Pending Actions:</strong> {stats?.offline?.pendingActions?.length || 0}
          </div>
          <div>
            <strong>Sync Status:</strong> {stats?.offline?.syncStatus}
          </div>
          <div>
            <strong>Last Sync:</strong> {stats?.offline?.lastSyncTime ? new Date(stats.offline.lastSyncTime).toLocaleString() : 'Never'}
          </div>
        </div>
        
        {stats?.offline?.pendingActions && stats.offline.pendingActions.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <strong>Pending Actions:</strong>
            <ul style={{ margin: '0', paddingLeft: '1.5rem' }}>
              {stats.offline.pendingActions.slice(0, 5).map((action) => (
                <li key={action.id}>
                  {action.type} - {new Date(action.timestamp).toLocaleTimeString()}
                </li>
              ))}
              {stats.offline.pendingActions.length > 5 && (
                <li>...and {stats.offline.pendingActions.length - 5} more</li>
              )}
            </ul>
          </div>
        )}
      </SectionContainer>

      {/* History Management */}
      <SectionContainer>
        <SectionHeader>
          <SectionIcon>
            <FiRotateCcw />
          </SectionIcon>
          History Management
        </SectionHeader>
        <div
          style={{
            color: '#64748b',
            marginTop: '0.5rem',
          }}
        >
          <p>
            <strong>History Size:</strong> {stats?.history?.past || 0} states
          </p>
          <p>
            <strong>Can Undo:</strong> {canUndo() ? 'Yes' : 'No'}
          </p>
          <p>
            <strong>Can Redo:</strong> {canRedo() ? 'Yes' : 'No'}
          </p>
        </div>
      </SectionContainer>

      {/* Features Overview */}
      <SectionContainer>
        <SectionHeader>
          <SectionIcon>
            <FiZap />
          </SectionIcon>
          <SectionTitle>Available Features</SectionTitle>
        </SectionHeader>
        
        <FeatureList>
          <FeatureItem>
            <FeatureIcon $color="#10b981">
              <FiDatabase />
            </FeatureIcon>
            <FeatureText>
              Comprehensive state management for all OAuth flows
            </FeatureText>
            <FeatureStatus $enabled={true}>Active</FeatureStatus>
          </FeatureItem>
          
          <FeatureItem>
            <FeatureIcon $color="#8b5cf6">
              <FiRotateCcw />
            </FeatureIcon>
            <FeatureText>
              Undo/Redo functionality with history tracking
            </FeatureText>
            <FeatureStatus $enabled={true}>Active</FeatureStatus>
          </FeatureItem>
          
          <FeatureItem>
            <FeatureIcon $color="#3b82f6">
              <FiWifi />
            </FeatureIcon>
            <FeatureText>
              Offline capability with pending action queue
            </FeatureText>
            <FeatureStatus $enabled={stats?.offline?.isOnline || false}>Active</FeatureStatus>
          </FeatureItem>
          
          <FeatureItem>
            <FeatureIcon $color="#10b981">
              <FiRefreshCw />
            </FeatureIcon>
            <FeatureText>
              Automatic state persistence to localStorage
            </FeatureText>
            <FeatureStatus $enabled={true}>Active</FeatureStatus>
          </FeatureItem>
          
          <FeatureItem>
            <FeatureIcon $color="#8b5cf6">
              <FiActivity />
            </FeatureIcon>
            <FeatureText>
              Performance metrics and activity tracking
            </FeatureText>
            <FeatureStatus $enabled={true}>Active</FeatureStatus>
          </FeatureItem>
          
          <FeatureItem>
            <FeatureIcon $color="#ef4444">
              <FiAlertTriangle />
            </FeatureIcon>
            <FeatureText>
              Error handling and recovery mechanisms
            </FeatureText>
            <FeatureStatus $enabled={true}>Active</FeatureStatus>
          </FeatureItem>
        </FeatureList>
      </SectionContainer>

      {/* Export/Import Controls */}
      <SectionContainer>
        <SectionHeader>
          <SectionIcon>
            <FiDatabase />
          </SectionIcon>
          <SectionTitle>Data Management</SectionTitle>
        </SectionHeader>
        
        <ExportImportControls>
          <ExportImportButton onClick={handleExport} disabled={isExporting}>
            <FiDownload /> {isExporting ? 'Exporting...' : 'Export State'}
          </ExportImportButton>
          
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            disabled={isImporting}
            style={{ display: 'none' }}
            id="state-import-input"
          />
          <label 
            htmlFor="state-import-input"
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              cursor: isImporting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <FiUpload /> {isImporting ? 'Importing...' : 'Import State'}
          </label>
        </ExportImportControls>
        
        <div style={{
          fontSize: '0.875rem',
          color: '#64748b',
          marginTop: '0.5rem',
        }}>
          <p>
            <strong>Export:</strong> Save your current state to a JSON file for backup or sharing
          </p>
          <p>
            <strong>Import:</strong> Load a previously saved state from a JSON file
          </p>
        </div>
      </SectionContainer>

      {/* Action Buttons */}
      <ActionButtons>
        <ActionButton onClick={handleResetAll} $variant="danger">
          <FiTrash2 /> Reset All State
        </ActionButton>
        <ActionButton onClick={() => {
          actions.setTheme('auto');
          setMessage('Theme set to auto');
          setMessageType('info');
        }}>
          <FiSettings /> Reset Theme
        </ActionButton>
        <ActionButton onClick={() => {
          actions.toggleNotifications();
          setMessage(`Notifications ${state.notifications ? 'enabled' : 'disabled'}`);
          setMessageType('info');
        }}>
          {state.notifications ? <FiBell /> : <FiBellOff />} Toggle Notifications
        </ActionButton>
      </ActionButtons>
    </PageContainer>
  );
};

export default EnhancedStateManagementPage;
