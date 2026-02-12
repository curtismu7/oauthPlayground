// src/pages/EnvironmentManagementPageV8.tsx
// V8 Environment Management Page - Main dashboard for PingOne environment management

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiDownload, FiUpload } from 'react-icons/fi';
import EnvironmentServiceV8, { PingOneEnvironment } from '../services/environmentServiceV8';

const Container = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h1`
  color: #333;
  font-size: 2rem;
  font-weight: 600;
`;

const Actions = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  background: ${props => {
    switch (props.variant) {
      case 'primary': return '#007bff';
      case 'secondary': return '#6c757d';
      case 'danger': return '#dc3545';
      default: return '#007bff';
    }
  }};
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;

  &:hover {
    background: ${props => {
      switch (props.variant) {
        case 'primary': return '#0056b3';
        case 'secondary': return '#545b62';
        case 'danger': return '#c82333';
        default: return '#0056b3';
      }
    }};
  }

  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
`;

const SearchContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 300px;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const FilterSelect = styled.select`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  background: white;

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
`;

const EnvironmentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const EnvironmentCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const CardTitle = styled.h3`
  color: #333;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  flex: 1;
`;

const CardStatus = styled.span<{ status: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  background: ${props => EnvironmentServiceV8.getStatusColor(props.status)}20;
  color: ${props => EnvironmentServiceV8.getStatusColor(props.status)};
`;

const CardType = styled.span<{ type: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  background: ${props => EnvironmentServiceV8.getTypeColor(props.type)}20;
  color: ${props => EnvironmentServiceV8.getTypeColor(props.type)};
  margin-left: 0.5rem;
`;

const CardDescription = styled.p`
  color: #666;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  line-height: 1.5;
`;

const CardInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
`;

const InfoLabel = styled.span`
  color: #666;
`;

const InfoValue = styled.span`
  color: #333;
  font-weight: 500;
`;

const CardActions = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
`;

const IconButton = styled.button`
  background: none;
  border: 1px solid #ddd;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: #f8f9fa;
    border-color: #007bff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
  font-size: 1.1rem;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #dc3545;
  font-size: 1.1rem;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
`;

const PaginationButton = styled.button<{ active?: boolean }>`
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: ${props => props.active ? '#007bff' : 'white'};
  color: ${props => props.active ? 'white' : '#333'};
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${props => props.active ? '#0056b3' : '#f8f9fa'};
    border-color: #007bff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EnvironmentManagementPageV8: React.FC = () => {
  const [environments, setEnvironments] = useState<PingOneEnvironment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedEnvironments, setSelectedEnvironments] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const pageSize = 12;

  const fetchEnvironments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: {
        type?: string[];
        status?: string[];
        region?: string[];
        search?: string;
        page?: number;
        pageSize?: number;
      } = {
        page: currentPage,
        pageSize,
      };

      if (searchTerm) {
        filters.search = searchTerm;
      }

      if (typeFilter !== 'all') {
        filters.type = [typeFilter];
      }

      if (statusFilter !== 'all') {
        filters.status = [statusFilter];
      }

      if (regionFilter !== 'all') {
        filters.region = [regionFilter];
      }

      const response = await EnvironmentServiceV8.getEnvironments(filters);
      setEnvironments(response.environments);
      setTotalPages(Math.ceil(response.totalCount / pageSize));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch environments');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, typeFilter, statusFilter, regionFilter, currentPage]);

  useEffect(() => {
    fetchEnvironments();
  }, [fetchEnvironments]);

  const handleRefresh = () => {
    fetchEnvironments();
  };

  const handleCreateEnvironment = () => {
    // TODO: Implement create environment modal
    console.log('Create environment');
  };

  const handleEditEnvironment = (id: string) => {
    // TODO: Implement edit environment modal
    console.log('Edit environment:', id);
  };

  const handleDeleteEnvironment = (id: string) => {
    // TODO: Implement delete confirmation modal
    console.log('Delete environment:', id);
  };

  const handleToggleEnvironmentStatus = async (id: string) => {
    try {
      const environment = environments.find(env => env.id === id);
      if (!environment) return;

      const newStatus = environment.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await EnvironmentServiceV8.updateEnvironmentStatus(id, newStatus);
      fetchEnvironments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update environment status');
    }
  };

  const handleSelectEnvironment = (id: string) => {
    setSelectedEnvironments(prev => 
      prev.includes(id) 
        ? prev.filter(envId => envId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedEnvironments.length === environments.length) {
      setSelectedEnvironments([]);
    } else {
      setSelectedEnvironments(environments.map(env => env.id));
    }
  };

  const handleBulkDelete = async () => {
    try {
      await EnvironmentServiceV8.performBulkOperation({
        environmentIds: selectedEnvironments,
        operation: 'delete'
      });
      setSelectedEnvironments([]);
      fetchEnvironments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete environments');
    }
  };

  const handleBulkStatusUpdate = async (status: 'ACTIVE' | 'INACTIVE') => {
    try {
      await EnvironmentServiceV8.performBulkOperation({
        environmentIds: selectedEnvironments,
        operation: 'status_update',
        parameters: { status }
      });
      setSelectedEnvironments([]);
      fetchEnvironments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update environments');
    }
  };

  useEffect(() => {
    setShowBulkActions(selectedEnvironments.length > 0);
  }, [selectedEnvironments]);

  if (loading && environments.length === 0) {
    return <LoadingMessage>Loading environments...</LoadingMessage>;
  }

  if (error) {
    return <ErrorMessage>Error: {error}</ErrorMessage>;
  }

  return (
    <Container>
      <Header>
        <Title>PingOne Environment Management</Title>
        <Actions>
          <Button onClick={handleRefresh}>
            <FiRefreshCw />
            Refresh
          </Button>
          <Button variant="primary" onClick={handleCreateEnvironment}>
            <FiPlus />
            Create Environment
          </Button>
        </Actions>
      </Header>

      <SearchContainer>
        <SearchInput
          type="text"
          placeholder="Search environments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <FilterContainer>
          <FilterSelect value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All Types</option>
            <option value="PRODUCTION">Production</option>
            <option value="SANDBOX">Sandbox</option>
            <option value="DEVELOPMENT">Development</option>
          </FilterSelect>
          <FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="DELETE_PENDING">Delete Pending</option>
          </FilterSelect>
          <FilterSelect value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}>
            <option value="all">All Regions</option>
            <option value="us-east-1">US East</option>
            <option value="us-west-2">US West</option>
            <option value="eu-west-1">Europe West</option>
            <option value="ap-southeast-2">Asia Pacific</option>
          </FilterSelect>
        </FilterContainer>
      </SearchContainer>

      {showBulkActions && (
        <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{selectedEnvironments.length} environments selected</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="secondary" onClick={() => handleBulkStatusUpdate('ACTIVE')}>
                Activate
              </Button>
              <Button variant="secondary" onClick={() => handleBulkStatusUpdate('INACTIVE')}>
                Deactivate
              </Button>
              <Button variant="danger" onClick={handleBulkDelete}>
                Delete
              </Button>
              <Button variant="secondary" onClick={() => setSelectedEnvironments([])}>
                Clear Selection
              </Button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <input
            type="checkbox"
            checked={selectedEnvironments.length === environments.length && environments.length > 0}
            onChange={handleSelectAll}
            style={{ marginRight: '0.5rem' }}
            id="select-all-checkbox"
          />
          <label htmlFor="select-all-checkbox">Select All ({environments.length} environments)</label>
        </div>
        <div>
          <Button variant="secondary">
            <FiDownload />
            Export
          </Button>
          <Button variant="secondary">
            <FiUpload />
            Import
          </Button>
        </div>
      </div>

      <EnvironmentGrid>
        {environments.map((environment) => (
          <EnvironmentCard key={environment.id}>
            <CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={selectedEnvironments.includes(environment.id)}
                  onChange={() => handleSelectEnvironment(environment.id)}
                  style={{ marginRight: '0.5rem' }}
                />
                <CardTitle>{environment.name}</CardTitle>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                <CardStatus status={environment.status}>
                  {EnvironmentServiceV8.formatEnvironmentStatus(environment.status)}
                </CardStatus>
                <CardType type={environment.type}>
                  {EnvironmentServiceV8.formatEnvironmentType(environment.type)}
                </CardType>
              </div>
            </CardHeader>

            {environment.description && (
              <CardDescription>{environment.description}</CardDescription>
            )}

            <CardInfo>
              <InfoItem>
                <InfoLabel>ID:</InfoLabel>
                <InfoValue>{environment.id}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Region:</InfoLabel>
                <InfoValue>{environment.region || 'N/A'}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Created:</InfoLabel>
                <InfoValue>{new Date(environment.createdAt).toLocaleDateString()}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Updated:</InfoLabel>
                <InfoValue>{new Date(environment.updatedAt).toLocaleDateString()}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Services:</InfoLabel>
                <InfoValue>{environment.enabledServices.length}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Status:</InfoLabel>
                <InfoValue>{EnvironmentServiceV8.formatEnvironmentStatus(environment.status)}</InfoValue>
              </InfoItem>
            </CardInfo>

            <CardActions>
              <IconButton
                onClick={() => handleToggleEnvironmentStatus(environment.id)}
                disabled={!EnvironmentServiceV8.canEditEnvironment(environment)}
                title={environment.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
              >
                <FiRefreshCw />
              </IconButton>
              <IconButton
                onClick={() => handleEditEnvironment(environment.id)}
                disabled={!EnvironmentServiceV8.canEditEnvironment(environment)}
                title="Edit"
              >
                <FiEdit2 />
              </IconButton>
              <IconButton
                onClick={() => handleDeleteEnvironment(environment.id)}
                disabled={!EnvironmentServiceV8.canDeleteEnvironment(environment)}
                title="Delete"
              >
                <FiTrash2 />
              </IconButton>
            </CardActions>
          </EnvironmentCard>
        ))}
      </EnvironmentGrid>

      {totalPages > 1 && (
        <Pagination>
          <PaginationButton
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </PaginationButton>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <PaginationButton
              key={page}
              onClick={() => setCurrentPage(page)}
              active={page === currentPage}
            >
              {page}
            </PaginationButton>
          ))}
          
          <PaginationButton
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </PaginationButton>
        </Pagination>
      )}
    </Container>
  );
};

export default EnvironmentManagementPageV8;
