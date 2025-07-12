/**
 * @fileoverview Swagger/OpenAPI configuration for PingOne Import Tool API
 * 
 * This file configures Swagger documentation for all API endpoints,
 * including request/response schemas, authentication, and examples.
 * 
 * @author PingOne Import Tool
 * @version 4.9
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

/**
 * Swagger configuration options
 */
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PingOne Import Tool API',
      version: '4.9',
      description: `
        Comprehensive API for importing, exporting, and managing users in PingOne.
        
        ## Features
        - **User Import**: Upload CSV files to create users in PingOne populations
        - **User Export**: Export users from populations in JSON/CSV formats
        - **User Modification**: Update existing users with batch operations
        - **Real-time Progress**: Server-Sent Events for import progress tracking
        - **Population Management**: Create and manage user populations
        - **Token Management**: Handle PingOne API authentication
        - **Feature Flags**: Enable/disable application features
        - **Comprehensive Logging**: Detailed logging for debugging and monitoring
        
        ## Authentication
        Most endpoints require valid PingOne API credentials configured via settings.
        
        ## Rate Limiting
        API endpoints are rate-limited to prevent abuse:
        - Health checks: 200 requests/second
        - Logs API: 100 requests/second
        - General API: 150 requests/second
        
        ## File Uploads
        CSV files for import/modify operations have a 10MB size limit.
        
        ## Error Handling
        All endpoints return consistent error responses with appropriate HTTP status codes.
      `,
      contact: {
        name: 'PingOne Import Tool Support',
        email: 'support@pingone-import.com',
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC',
      },
      servers: [
        {
          url: 'http://localhost:4000',
          description: 'Development server',
        },
        {
          url: 'https://api.pingone-import.com',
          description: 'Production server',
        },
      ],
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'PingOne API access token',
        },
      },
      schemas: {
        // Common response schemas
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Operation completed successfully',
            },
            data: {
              type: 'object',
              description: 'Response data (varies by endpoint)',
            },
          },
          required: ['success'],
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Validation failed',
            },
            details: {
              type: 'object',
              description: 'Additional error details',
            },
          },
          required: ['success', 'error'],
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'healthy',
            },
            message: {
              type: 'string',
              example: 'All services are healthy',
            },
            details: {
              type: 'object',
              properties: {
                server: {
                  type: 'string',
                  example: 'ok',
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                },
                uptime: {
                  type: 'number',
                  example: 1234.56,
                },
                memory: {
                  type: 'object',
                  properties: {
                    used: {
                      type: 'number',
                      example: 15,
                    },
                    total: {
                      type: 'number',
                      example: 17,
                    },
                  },
                },
                checks: {
                  type: 'object',
                  properties: {
                    server: {
                      type: 'string',
                      example: 'ok',
                    },
                    database: {
                      type: 'string',
                      example: 'ok',
                    },
                    storage: {
                      type: 'string',
                      example: 'ok',
                    },
                    pingone: {
                      type: 'string',
                      example: 'ok',
                    },
                  },
                },
              },
            },
          },
        },
        // Import schemas
        ImportRequest: {
          type: 'object',
          properties: {
            file: {
              type: 'string',
              format: 'binary',
              description: 'CSV file containing user data',
            },
            populationId: {
              type: 'string',
              description: 'PingOne population ID',
              example: '3840c98d-202d-4f6a-8871-f3bc66cb3fa8',
            },
            populationName: {
              type: 'string',
              description: 'PingOne population name',
              example: 'Sample Users',
            },
          },
          required: ['file', 'populationId', 'populationName'],
        },
        ImportResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            sessionId: {
              type: 'string',
              description: 'Unique session ID for progress tracking',
              example: 'session-12345',
            },
            message: {
              type: 'string',
              example: 'Import session created successfully',
            },
            totalUsers: {
              type: 'number',
              example: 100,
            },
          },
        },
        ImportProgress: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            progress: {
              type: 'object',
              properties: {
                current: {
                  type: 'number',
                  example: 50,
                },
                total: {
                  type: 'number',
                  example: 100,
                },
                percentage: {
                  type: 'number',
                  example: 50.0,
                },
                message: {
                  type: 'string',
                  example: 'Processing user 50 of 100',
                },
                counts: {
                  type: 'object',
                  properties: {
                    processed: {
                      type: 'number',
                      example: 50,
                    },
                    created: {
                      type: 'number',
                      example: 45,
                    },
                    skipped: {
                      type: 'number',
                      example: 3,
                    },
                    failed: {
                      type: 'number',
                      example: 2,
                    },
                  },
                },
              },
            },
          },
        },
        // Export schemas
        ExportRequest: {
          type: 'object',
          properties: {
            populationId: {
              type: 'string',
              description: 'PingOne population ID to export',
              example: '3840c98d-202d-4f6a-8871-f3bc66cb3fa8',
            },
            format: {
              type: 'string',
              enum: ['json', 'csv'],
              description: 'Export format',
              example: 'json',
            },
            includeDisabled: {
              type: 'boolean',
              description: 'Include disabled users in export',
              example: false,
            },
          },
          required: ['populationId', 'format'],
        },
        ExportResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    example: 'user-123',
                  },
                  username: {
                    type: 'string',
                    example: 'john.doe@example.com',
                  },
                  email: {
                    type: 'string',
                    example: 'john.doe@example.com',
                  },
                  firstName: {
                    type: 'string',
                    example: 'John',
                  },
                  lastName: {
                    type: 'string',
                    example: 'Doe',
                  },
                  enabled: {
                    type: 'boolean',
                    example: true,
                  },
                },
              },
            },
            total: {
              type: 'number',
              example: 100,
            },
          },
        },
        // Settings schemas
        Settings: {
          type: 'object',
          properties: {
            clientId: {
              type: 'string',
              description: 'PingOne client ID',
              example: 'client-123',
            },
            clientSecret: {
              type: 'string',
              description: 'PingOne client secret',
              example: 'secret-456',
            },
            environmentId: {
              type: 'string',
              description: 'PingOne environment ID',
              example: 'b9817c16-9910-4415-b67e-4ac687da74d9',
            },
            region: {
              type: 'string',
              enum: ['NorthAmerica', 'Europe', 'AsiaPacific'],
              description: 'PingOne region',
              example: 'NorthAmerica',
            },
          },
        },
        // Feature flags schemas
        FeatureFlags: {
          type: 'object',
          properties: {
            A: {
              type: 'boolean',
              description: 'Feature flag A',
              example: false,
            },
            B: {
              type: 'boolean',
              description: 'Feature flag B',
              example: false,
            },
            C: {
              type: 'boolean',
              description: 'Feature flag C',
              example: false,
            },
          },
        },
        // Log schemas
        LogEntry: {
          type: 'object',
          properties: {
            level: {
              type: 'string',
              enum: ['info', 'warning', 'error', 'debug'],
              example: 'info',
            },
            message: {
              type: 'string',
              example: 'User import completed',
            },
            details: {
              type: 'object',
              description: 'Additional log details',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
          required: ['level', 'message'],
        },
        // Population schemas
        Population: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '3840c98d-202d-4f6a-8871-f3bc66cb3fa8',
            },
            name: {
              type: 'string',
              example: 'Sample Users',
            },
            description: {
              type: 'string',
              example: 'This is a sample user population',
            },
            userCount: {
              type: 'number',
              example: 380,
            },
            default: {
              type: 'boolean',
              example: false,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: [
    './routes/api/index.js',
    './routes/settings.js',
    './routes/logs.js',
    './routes/pingone-proxy.js',
    './server.js',
  ],
};

/**
 * Generate Swagger specification
 */
const specs = swaggerJsdoc(swaggerOptions);

/**
 * Swagger UI configuration
 */
const swaggerUiOptions = {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'PingOne Import Tool API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    showRequestHeaders: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
  },
};

/**
 * Setup Swagger middleware
 */
const setupSwagger = (app) => {
  // Serve Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));
  
  // Serve Swagger JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
  
  console.log('📚 Swagger documentation available at /api-docs');
  console.log('📄 Swagger JSON available at /api-docs.json');
};

export { setupSwagger, specs }; 