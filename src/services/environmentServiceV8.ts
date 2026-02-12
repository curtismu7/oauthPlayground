// src/services/environmentServiceV8.ts
// V8 Environment Management Service for PingOne Environment CRUD operations

import { pingOneFetch } from '../utils/pingOneFetch';

export interface PingOneEnvironment {
  id: string;
  name: string;
  description?: string;
  type: 'PRODUCTION' | 'SANDBOX' | 'DEVELOPMENT';
  status: 'ACTIVE' | 'INACTIVE' | 'DELETE_PENDING';
  region?: string;
  createdAt: string;
  updatedAt: string;
  softDeletedAt?: string;
  hardDeleteAllowedAt?: string;
  enabledServices: string[];
  capabilities?: EnvironmentCapabilities;
  usage?: EnvironmentUsage;
}

export interface EnvironmentCapabilities {
  applications: {
    enabled: boolean;
    maxApplications: number;
    currentApplications: number;
  };
  users: {
    enabled: boolean;
    maxUsers: number;
    currentUsers: number;
  };
  mfa: {
    enabled: boolean;
    supportedMethods: string[];
  };
  protect: {
    enabled: boolean;
    features: string[];
  };
  advancedIdentityVerification: {
    enabled: boolean;
    supportedMethods: string[];
  };
}

export interface EnvironmentUsage {
  apiCalls: number;
  activeUsers: number;
  storageUsed: number;
  lastActivity: string;
  errorRate: number;
}

export interface CreateEnvironmentRequest {
  name: string;
  description?: string;
  type: 'PRODUCTION' | 'SANDBOX' | 'DEVELOPMENT';
  region?: string;
}

export interface UpdateEnvironmentRequest {
  name?: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'DELETE_PENDING';
  region?: string;
}

export interface EnvironmentListResponse {
  environments: PingOneEnvironment[];
  totalCount: number;
  page: number;
  pageSize: number;
  filters?: {
    type?: string[];
    status?: string[];
    region?: string[];
    search?: string;
  };
}

export interface BulkOperationRequest {
  environmentIds: string[];
  operation: 'status_update' | 'delete' | 'clone';
  parameters?: {
    status?: 'ACTIVE' | 'INACTIVE' | 'DELETE_PENDING';
    newName?: string;
  };
}

export interface BulkOperationResult {
  successful: string[];
  failed: {
    environmentId: string;
    error: string;
  }[];
  totalCount: number;
}

class EnvironmentServiceV8 {
  private static readonly BASE_PATH = '/api/environments';

  /**
   * Get all environments with filtering and pagination
   */
  static async getEnvironments(
    filters?: {
      type?: string[];
      status?: string[];
      region?: string[];
      search?: string;
      page?: number;
      pageSize?: number;
    }
  ): Promise<EnvironmentListResponse> {
    const params = new URLSearchParams();
    
    if (filters?.type?.length) {
      filters.type.forEach(type => {
        params.append('type', type);
      });
    }
    if (filters?.status?.length) {
      filters.status.forEach(status => {
        params.append('status', status);
      });
    }
    if (filters?.region?.length) {
      filters.region.forEach(region => {
        params.append('region', region);
      });
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.page) {
      params.append('page', filters.page.toString());
    }
    if (filters?.pageSize) {
      params.append('pageSize', filters.pageSize.toString());
    }

    const response = await pingOneFetch(
      `${EnvironmentServiceV8.BASE_PATH}?${params.toString()}`
    );
    
    return response.json() as Promise<EnvironmentListResponse>;
  }

  /**
   * Get detailed environment information by ID
   */
  static async getEnvironmentById(id: string): Promise<PingOneEnvironment> {
    const response = await pingOneFetch(
      `${EnvironmentServiceV8.BASE_PATH}/${id}`
    );
    
    return response.json() as Promise<PingOneEnvironment>;
  }

  /**
   * Create a new environment
   */
  static async createEnvironment(
    environmentData: CreateEnvironmentRequest
  ): Promise<PingOneEnvironment> {
    const response = await pingOneFetch(
      EnvironmentServiceV8.BASE_PATH,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(environmentData),
      }
    );
    
    return response.json() as Promise<PingOneEnvironment>;
  }

  /**
   * Update environment properties
   */
  static async updateEnvironment(
    id: string,
    updateData: UpdateEnvironmentRequest
  ): Promise<PingOneEnvironment> {
    const response = await pingOneFetch(
      `${EnvironmentServiceV8.BASE_PATH}/${id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      }
    );
    
    return response.json() as Promise<PingOneEnvironment>;
  }

  /**
   * Update environment status
   */
  static async updateEnvironmentStatus(
    id: string,
    status: 'ACTIVE' | 'INACTIVE' | 'DELETE_PENDING'
  ): Promise<PingOneEnvironment> {
    const response = await pingOneFetch(
      `${EnvironmentServiceV8.BASE_PATH}/${id}/status`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      }
    );
    
    return response.json() as Promise<PingOneEnvironment>;
  }

  /**
   * Delete an environment (only sandbox/development environments)
   */
  static async deleteEnvironment(id: string): Promise<void> {
    await pingOneFetch(
      `${EnvironmentServiceV8.BASE_PATH}/${id}`,
      {
        method: 'DELETE',
      }
    );
  }

  /**
   * Get environment capabilities
   */
  static async getEnvironmentCapabilities(id: string): Promise<EnvironmentCapabilities> {
    const response = await pingOneFetch(
      `${EnvironmentServiceV8.BASE_PATH}/${id}/capabilities`
    );
    
    return response.json() as Promise<EnvironmentCapabilities>;
  }

  /**
   * Get environment usage statistics
   */
  static async getEnvironmentUsage(id: string): Promise<EnvironmentUsage> {
    const response = await pingOneFetch(
      `${EnvironmentServiceV8.BASE_PATH}/${id}/usage`
    );
    
    return response.json() as Promise<EnvironmentUsage>;
  }

  /**
   * Perform bulk operations on multiple environments
   */
  static async performBulkOperation(
    bulkRequest: BulkOperationRequest
  ): Promise<BulkOperationResult> {
    const response = await pingOneFetch(
      `${EnvironmentServiceV8.BASE_PATH}/bulk`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bulkRequest),
      }
    );
    
    return response.json() as Promise<BulkOperationResult>;
  }

  /**
   * Clone an environment
   */
  static async cloneEnvironment(
    id: string,
    newName: string
  ): Promise<PingOneEnvironment> {
    const response = await pingOneFetch(
      `${EnvironmentServiceV8.BASE_PATH}/${id}/clone`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newName }),
      }
    );
    
    return response.json() as Promise<PingOneEnvironment>;
  }

  /**
   * Get organization capabilities
   */
  static async getOrganizationCapabilities(organizationId: string): Promise<EnvironmentCapabilities> {
    const response = await pingOneFetch(
      `/organizations/${organizationId}/capabilities`
    );
    
    return response.json() as Promise<EnvironmentCapabilities>;
  }

  /**
   * Validate environment deletion permissions
   */
  static validateDeletionPermissions(environment: PingOneEnvironment): boolean {
    // Production environments cannot be deleted
    if (environment.type === 'PRODUCTION') {
      return false;
    }
    
    // Check if hard delete is allowed (30-day waiting period for soft delete)
    if (environment.status === 'DELETE_PENDING') {
      const softDeletedAt = environment.softDeletedAt;
      if (softDeletedAt) {
        const softDeletedDate = new Date(softDeletedAt);
        const waitingPeriod = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
        const now = Date.now();
        return now - softDeletedDate.getTime() >= waitingPeriod;
      }
    }
    
    // Sandbox and development environments can be deleted
    return environment.type === 'SANDBOX' || environment.type === 'DEVELOPMENT';
  }

  /**
   * Validate environment promotion permissions
   */
  static validatePromotionPermissions(environment: PingOneEnvironment): boolean {
    // Only sandbox and development environments can be promoted
    return environment.type === 'SANDBOX' || environment.type === 'DEVELOPMENT';
  }

  /**
   * Get environment deletion waiting period
   */
  static getDeletionWaitingPeriod(environment: PingOneEnvironment): number {
    if (environment.type === 'PRODUCTION') {
      return Infinity; // Cannot delete production environments
    }
    
    // 30 days for sandbox and development environments
    return 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
  }

  /**
   * Format environment type for display
   */
  static formatEnvironmentType(type: string): string {
    switch (type) {
      case 'PRODUCTION':
        return 'Production';
      case 'SANDBOX':
        return 'Sandbox';
      case 'DEVELOPMENT':
        return 'Development';
      default:
        return type;
    }
  }

  /**
   * Format environment status for display
   */
  static formatEnvironmentStatus(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'Active';
      case 'INACTIVE':
        return 'Inactive';
      case 'DELETE_PENDING':
        return 'Delete Pending';
      default:
        return status;
    }
  }

  /**
   * Get status color for UI display
   */
  static getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return '#22c55e'; // Green
      case 'INACTIVE':
        return '#f59e0b'; // Yellow
      case 'DELETE_PENDING':
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  }

  /**
   * Get type color for UI display
   */
  static getTypeColor(type: string): string {
    switch (type) {
      case 'PRODUCTION':
        return '#dc2626'; // Red
      case 'SANDBOX':
        return '#f59e0b'; // Yellow
      case 'DEVELOPMENT':
        return '#3b82f6'; // Blue
      default:
        return '#6b7280'; // Gray
    }
  }

  /**
   * Check if environment can be edited
   */
  static canEditEnvironment(environment: PingOneEnvironment): boolean {
    return environment.status !== 'DELETE_PENDING';
  }

  /**
   * Check if environment can be deleted
   */
  static canDeleteEnvironment(environment: PingOneEnvironment): boolean {
    return EnvironmentServiceV8.validateDeletionPermissions(environment);
  }

  /**
   * Check if environment can be promoted
   */
  static canPromoteEnvironment(environment: PingOneEnvironment): boolean {
    return EnvironmentServiceV8.validatePromotionPermissions(environment);
  }
}

export default EnvironmentServiceV8;
