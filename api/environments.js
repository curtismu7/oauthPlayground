// api/environments.js
// PingOne Environments API Endpoint

/**
 * Mock PingOne Environments API
 * Provides environment management functionality for the OAuth playground
 */

// Mock environment data
const mockEnvironments = [
  {
    id: 'env-001',
    name: 'Production Environment',
    description: 'Main production environment for customer applications',
    type: 'PRODUCTION',
    status: 'ACTIVE',
    region: 'us-east-1',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-02-10T15:45:00Z',
    enabledServices: ['mfa', 'oauth', 'protect'],
    capabilities: {
      applications: {
        enabled: true,
        maxApplications: 100,
        currentApplications: 45
      },
      users: {
        enabled: true,
        maxUsers: 10000,
        currentUsers: 7500
      },
      mfa: {
        enabled: true,
        supportedMethods: ['totp', 'sms', 'email', 'push', 'fido2']
      },
      protect: {
        enabled: true,
        features: ['risk_evaluation', 'adaptive_authentication', 'device_intelligence']
      },
      advancedIdentityVerification: {
        enabled: true,
        supportedMethods: ['document_verification', 'biometric_verification']
      }
    },
    usage: {
      apiCalls: 1250000,
      activeUsers: 7500,
      storageUsed: 45000000000,
      lastActivity: '2024-02-12T14:30:00Z',
      errorRate: 0.02
    }
  },
  {
    id: 'env-002',
    name: 'Development Sandbox',
    description: 'Development environment for testing and integration',
    type: 'SANDBOX',
    status: 'ACTIVE',
    region: 'us-west-2',
    createdAt: '2024-01-20T09:15:00Z',
    updatedAt: '2024-02-11T11:20:00Z',
    enabledServices: ['mfa', 'oauth'],
    capabilities: {
      applications: {
        enabled: true,
        maxApplications: 50,
        currentApplications: 12
      },
      users: {
        enabled: true,
        maxUsers: 1000,
        currentUsers: 150
      },
      mfa: {
        enabled: true,
        supportedMethods: ['totp', 'sms', 'email']
      },
      protect: {
        enabled: false,
        features: []
      },
      advancedIdentityVerification: {
        enabled: false,
        supportedMethods: []
      }
    },
    usage: {
      apiCalls: 85000,
      activeUsers: 150,
      storageUsed: 1200000000,
      lastActivity: '2024-02-12T16:45:00Z',
      errorRate: 0.05
    }
  },
  {
    id: 'env-003',
    name: 'Staging Environment',
    description: 'Staging environment for pre-production testing',
    type: 'DEVELOPMENT',
    status: 'ACTIVE',
    region: 'eu-west-1',
    createdAt: '2024-01-25T14:20:00Z',
    updatedAt: '2024-02-09T08:30:00Z',
    enabledServices: ['mfa', 'oauth', 'protect'],
    capabilities: {
      applications: {
        enabled: true,
        maxApplications: 25,
        currentApplications: 8
      },
      users: {
        enabled: true,
        maxUsers: 500,
        currentUsers: 75
      },
      mfa: {
        enabled: true,
        supportedMethods: ['totp', 'sms', 'email', 'push']
      },
      protect: {
        enabled: true,
        features: ['risk_evaluation', 'adaptive_authentication']
      },
      advancedIdentityVerification: {
        enabled: false,
        supportedMethods: []
      }
    },
    usage: {
      apiCalls: 125000,
      activeUsers: 75,
      storageUsed: 850000000,
      lastActivity: '2024-02-12T10:15:00Z',
      errorRate: 0.03
    }
  },
  {
    id: 'env-004',
    name: 'Legacy Test Environment',
    description: 'Legacy environment for backwards compatibility testing',
    type: 'DEVELOPMENT',
    status: 'INACTIVE',
    region: 'us-east-1',
    createdAt: '2023-12-01T11:00:00Z',
    updatedAt: '2024-01-15T16:20:00Z',
    softDeletedAt: '2024-02-01T00:00:00Z',
    enabledServices: ['oauth'],
    capabilities: {
      applications: {
        enabled: true,
        maxApplications: 10,
        currentApplications: 2
      },
      users: {
        enabled: true,
        maxUsers: 100,
        currentUsers: 5
      },
      mfa: {
        enabled: false,
        supportedMethods: []
      },
      protect: {
        enabled: false,
        features: []
      },
      advancedIdentityVerification: {
        enabled: false,
        supportedMethods: []
      }
    },
    usage: {
      apiCalls: 15000,
      activeUsers: 5,
      storageUsed: 250000000,
      lastActivity: '2024-01-30T14:20:00Z',
      errorRate: 0.08
    }
  },
  {
    id: 'env-005',
    name: 'APAC Production',
    description: 'Production environment for Asia-Pacific region',
    type: 'PRODUCTION',
    status: 'ACTIVE',
    region: 'ap-southeast-2',
    createdAt: '2024-02-01T08:45:00Z',
    updatedAt: '2024-02-12T12:00:00Z',
    enabledServices: ['mfa', 'oauth', 'protect'],
    capabilities: {
      applications: {
        enabled: true,
        maxApplications: 75,
        currentApplications: 20
      },
      users: {
        enabled: true,
        maxUsers: 5000,
        currentUsers: 1200
      },
      mfa: {
        enabled: true,
        supportedMethods: ['totp', 'sms', 'email', 'push', 'fido2']
      },
      protect: {
        enabled: true,
        features: ['risk_evaluation', 'adaptive_authentication', 'device_intelligence']
      },
      advancedIdentityVerification: {
        enabled: true,
        supportedMethods: ['document_verification']
      }
    },
    usage: {
      apiCalls: 450000,
      activeUsers: 1200,
      storageUsed: 12000000000,
      lastActivity: '2024-02-12T18:30:00Z',
      errorRate: 0.01
    }
  }
];

/**
 * Handler for GET /api/environments
 * Returns filtered and paginated list of environments
 */
function handleGetEnvironments(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const params = url.searchParams;
    
    // Parse query parameters
    const typeFilters = params.getAll('type');
    const statusFilters = params.getAll('status');
    const regionFilters = params.getAll('region');
    const search = params.get('search');
    const page = parseInt(params.get('page')) || 1;
    const pageSize = parseInt(params.get('pageSize')) || 12;
    
    console.log(`[ENVIRONMENTS-API] GET request with params:`, {
      typeFilters,
      statusFilters,
      regionFilters,
      search,
      page,
      pageSize
    });
    
    // Filter environments
    let filteredEnvironments = [...mockEnvironments];
    
    if (typeFilters.length > 0) {
      filteredEnvironments = filteredEnvironments.filter(env => 
        typeFilters.includes(env.type)
      );
    }
    
    if (statusFilters.length > 0) {
      filteredEnvironments = filteredEnvironments.filter(env => 
        statusFilters.includes(env.status)
      );
    }
    
    if (regionFilters.length > 0) {
      filteredEnvironments = filteredEnvironments.filter(env => 
        regionFilters.includes(env.region || '')
      );
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredEnvironments = filteredEnvironments.filter(env => 
        env.name.toLowerCase().includes(searchLower) ||
        env.description?.toLowerCase().includes(searchLower) ||
        env.id.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by name
    filteredEnvironments.sort((a, b) => a.name.localeCompare(b.name));
    
    // Pagination
    const totalCount = filteredEnvironments.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedEnvironments = filteredEnvironments.slice(startIndex, endIndex);
    
    const response = {
      environments: paginatedEnvironments,
      totalCount,
      page,
      pageSize,
      totalPages,
      filters: {
        type: typeFilters.length > 0 ? typeFilters : undefined,
        status: statusFilters.length > 0 ? statusFilters : undefined,
        region: regionFilters.length > 0 ? regionFilters : undefined,
        search: search || undefined
      }
    };
    
    console.log(`[ENVIRONMENTS-API] ✅ Returning ${paginatedEnvironments.length} environments (page ${page} of ${totalPages})`);
    
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(JSON.stringify(response));
    
  } catch (error) {
    console.error('[ENVIRONMENTS-API] ❌ Error handling GET request:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }));
  }
}

/**
 * Handler for OPTIONS requests (CORS preflight)
 */
function handleOptions(req, res) {
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  });
  res.end();
}

/**
 * Main request handler
 */
export default function handler(req, res) {
  console.log(`[ENVIRONMENTS-API] ${req.method} ${req.url}`);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleOptions(req, res);
  }
  
  // Handle GET requests
  if (req.method === 'GET') {
    return handleGetEnvironments(req, res);
  }
  
  // Handle unsupported methods
  res.writeHead(405, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: 'Method not allowed',
    message: `Method ${req.method} is not supported for this endpoint`
  }));
}
