# PingOne User Management Interfaces Documentation

## 📊 **Overview**
This document provides comprehensive TypeScript interface definitions for all PingOne User Management services and data structures. These interfaces ensure type safety and smooth migration from the P1-Import-Subsystem to the V9 integrated solution.

## 🎯 **Core Data Interfaces**

### **User Management Settings**
```typescript
/**
 * User Management application settings
 * Stored in unified storage with automatic backup
 */
export interface UserManagementSettings {
  /** PingOne Environment ID */
  pingone_environment_id: string;
  
  /** PingOne Client ID */
  pingone_client_id: string;
  
  /** PingOne Region (NorthAmerica, Europe, AsiaPacific, etc.) */
  pingone_region: 'NorthAmerica' | 'Europe' | 'AsiaPacific' | 'Canada';
  
  /** Default batch size for import operations */
  import_batch_size: number;
  
  /** Default export format */
  export_format: 'csv' | 'json' | 'xlsx';
  
  /** Enable real-time progress tracking */
  enable_real_time_progress: boolean;
  
  /** Default population ID for operations */
  default_population_id?: string;
  
  /** Enable automatic backup of settings */
  auto_backup_enabled: boolean;
  
  /** Maximum file size for uploads (in bytes) */
  max_file_size: number;
  
  /** Enable debug logging */
  debug_enabled: boolean;
  
  /** Session timeout for operations (in milliseconds) */
  session_timeout: number;
  
  /** When these settings were last saved */
  savedAt: number;
  
  /** Version of the settings schema */
  version: string;
}
```

### **Import Operation Data**
```typescript
/**
 * Import operation configuration and status
 */
export interface ImportOperation {
  /** Unique identifier for the import operation */
  id: string;
  
  /** Session identifier for tracking */
  sessionId: string;
  
  /** Name of the file being imported */
  filename: string;
  
  /** File size in bytes */
  fileSize: number;
  
  /** Current status of the import operation */
  status: 'pending' | 'processing' | 'validating' | 'importing' | 'completed' | 'failed' | 'cancelled';
  
  /** Total number of records in the file */
  totalRecords: number;
  
  /** Number of records successfully processed */
  processedRecords: number;
  
  /** Number of records that failed to import */
  errors: number;
  
  /** Number of warnings encountered */
  warnings: number;
  
  /** Number of records skipped */
  skipped: number;
  
  /** Number of records updated (for modify operations) */
  updated: number;
  
  /** Import operation type */
  operationType: 'import' | 'update' | 'modify';
  
  /** Target population ID */
  populationId?: string;
  
  /** Field mapping for column mapping */
  fieldMapping?: Record<string, string>;
  
  /** Import validation rules */
  validationRules?: ImportValidationRules;
  
  /** When the operation started */
  startTime: number;
  
  /** When the operation ended (if completed) */
  endTime?: number;
  
  /** Estimated time remaining */
  estimatedTimeRemaining?: number;
  
  /** Current progress percentage (0-100) */
  progress: number;
  
  /** Current step being processed */
  currentStep?: string;
  
  /** Total number of steps */
  totalSteps?: number;
  
  /** Error message if operation failed */
  errorMessage?: string;
  
  /** Warning messages encountered */
  warningMessages?: string[];
  
  /** Statistics about the operation */
  statistics?: ImportStatistics;
  
  /** User who initiated the operation */
  initiatedBy?: string;
  
  /** User agent information */
  userAgent?: string;
}
```

### **Export Operation Data**
```typescript
/**
 * Export operation configuration and status
 */
export interface ExportOperation {
  /** Unique identifier for the export operation */
  id: string;
  
  /** Session identifier for tracking */
  sessionId: string;
  
  /** Target population ID for export */
  populationId: string;
  
  /** Export format */
  format: 'csv' | 'json' | 'xlsx';
  
  /** Export filters applied */
  filters?: ExportFilters;
  
  /** Fields to include in export */
  fields?: string[];
  
  /** Current status of the export operation */
  status: 'pending' | 'processing' | 'generating' | 'completed' | 'failed' | 'cancelled';
  
  /** Total number of records found */
  totalRecords: number;
  
  /** Number of records successfully exported */
  exportedRecords: number;
  
  /** Number of records that failed to export */
  errors: number;
  
  /** Number of records skipped */
  skipped: number;
  
  /** When the operation started */
  startTime: number;
  
  /** When the operation ended (if completed) */
  endTime?: number;
  
  /** Estimated time remaining */
  estimatedTimeRemaining?: number;
  
  /** Current progress percentage (0-100) */
  progress: number;
  
  /** Current step being processed */
  currentStep?: string;
  
  /** Total number of steps */
  totalSteps?: number;
  
  /** Download URL for completed export */
  downloadUrl?: string;
  
  /** File path for completed export */
  filePath?: string;
  
  /** File name for completed export */
  fileName?: string;
  
  /** File size in bytes */
  fileSize?: number;
  
  /** Expiration time for download link */
  expiresAt?: number;
  
  /** Error message if operation failed */
  errorMessage?: string;
  
  /** User who initiated the operation */
  initiatedBy?: string;
  
  /** User agent information */
  userAgent?: string;
}
```

### **Population Data**
```typescript
/**
 * PingOne Population information
 */
export interface PopulationData {
  /** Population ID */
  id: string;
  
  /** Population name */
  name: string;
  
  /** Population description */
  description?: string;
  
  /** Environment ID the population belongs to */
  environmentId: string;
  
  /** Number of users in the population */
  userCount: number;
  
  /** Population enabled status */
  enabled: boolean;
  
  /** Population type */
  type?: 'default' | 'custom';
  
  /** Population priority */
  priority?: number;
  
  /** Creation timestamp */
  createdAt: string;
  
  /** Last updated timestamp */
  updatedAt: string;
  
  /** Population attributes */
  attributes?: Record<string, any>;
  
  /** Population metadata */
  metadata?: PopulationMetadata;
}
```

### **Population Metadata**
```typescript
/**
 * Additional metadata for populations
 */
export interface PopulationMetadata {
  /** Custom attributes */
  customAttributes?: Record<string, any>;
  
  /** Population tags */
  tags?: string[];
  
  /** Population category */
  category?: string;
  
  /** Population owner */
  owner?: string;
  
  /** Population description for UI */
  description?: string;
  
  /** Population color theme for UI */
  color?: string;
  
  /** Population icon for UI */
  icon?: string;
  
  /** Population visibility settings */
  visibility?: {
    /** Visible in dropdown */
    dropdown: boolean;
    /** Visible in search */
    search: boolean;
    /** Visible in API */
    api: boolean;
  };
}
```

## 🔧 **Service Interfaces**

### **User Management Repository**
```typescript
/**
 * Repository interface for user management data operations
 * Provides abstraction over unified storage manager
 */
export interface IUserManagementRepository {
  // Settings Management
  saveSettings(settings: UserManagementSettings): Promise<void>;
  loadSettings(): Promise<UserManagementSettings | null>;
  clearSettings(): Promise<void>;
  validateSettings(settings: Partial<UserManagementSettings>): Promise<{
    isValid: boolean;
    errors: string[];
  }>;
  
  // Import History Management
  saveImportHistory(history: ImportOperation): Promise<void>;
  loadImportHistory(): Promise<ImportOperation[]>;
  loadImportHistory(limit?: number): Promise<ImportOperation[]>;
  searchImportHistory(query: string): Promise<ImportOperation[]>;
  getImportHistory(id: string): Promise<ImportOperation | null>;
  deleteImportHistory(id: string): Promise<void>;
  clearImportHistory(): Promise<void>;
  
  // Export History Management
  saveExportHistory(history: ExportOperation): Promise<void>;
  loadExportHistory(): Promise<ExportOperation[]>;
  loadExportHistory(limit?: number): Promise<ExportOperation[]>;
  searchExportHistory(query: string): Promise<ExportOperation[]>;
  getExportHistory(id: string): Promise<ExportOperation | null>;
  deleteExportHistory(id: string): Promise<void>;
  clearExportHistory(): Promise<void>;
  
  // Population Cache Management
  savePopulationCache(population: PopulationData): Promise<void>;
  loadPopulationCache(): Promise<Record<string, PopulationData>>;
  getPopulationCache(id: string): Promise<PopulationData | null>;
  deletePopulationCache(id: string): Promise<void>;
  clearPopulationCache(): Promise<void>;
  refreshPopulationCache(id: string): Promise<PopulationData | null>;
  
  // Active Operations Management
  saveActiveOperation(operation: ActiveOperation): Promise<void>;
  loadActiveOperations(): Promise<Record<string, ActiveOperation>>;
  getActiveOperation(id: string): Promise<ActiveOperation | null>;
  removeActiveOperation(id: string): Promise<void>;
  clearActiveOperations(): Promise<void>;
  
  // Maintenance Operations
  cleanupOldData(): Promise<void>;
  getMetrics(): StorageMetrics;
  resetMetrics(): void;
  
  // Data Migration
  migrateFromLegacyStorage(): Promise<MigrationResult>;
  exportData(): Promise<ExportData>;
  importData(data: ExportData): Promise<ImportResult>;
}
```

### **Active Operation Tracking**
```typescript
/**
 * Active operation tracking for real-time progress
 */
export interface ActiveOperation {
  /** Operation ID */
  id: string;
  
  /** Session ID */
  sessionId: string;
  
  /** Operation type */
  type: 'import' | 'export' | 'modify';
  
  /** Current status */
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  
  /** Progress percentage (0-100) */
  progress: number;
  
  /** Total items to process */
  total: number;
  
  /** Items processed so far */
  processed: number;
  
  /** Items with errors */
  errors: number;
  
  /** Items with warnings */
  warnings: number;
  
  /** Current step description */
  currentStep?: string;
  
  /** Total steps in operation */
  totalSteps?: number;
  
  /** Estimated time remaining (ms) */
  estimatedTimeRemaining?: number;
  
  /** Operation start time */
  startTime: number;
  
  /** Last update time */
  lastUpdated: number;
  
  /** Operation metadata */
  metadata?: Record<string, any>;
  
  /** Error details if failed */
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}
```

### **Import Validation Rules**
```typescript
/**
 * Validation rules for import operations
 */
export interface ImportValidationRules {
  /** Required fields that must be present */
  requiredFields?: string[];
  
  /** Field format validation */
  fieldFormats?: Record<string, {
    type: 'email' | 'phone' | 'url' | 'date' | 'number' | 'string' | 'boolean';
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    customValidator?: string;
  }>;
  
  /** Field value validation */
  fieldValues?: Record<string, {
    allowedValues?: string[];
    forbiddenValues?: string[];
    customValidator?: string;
  }>;
  
  /** Duplicate handling */
  duplicateHandling: {
    strategy: 'skip' | 'update' | 'error';
    uniqueFields?: string[];
  };
  
  /** Data transformation rules */
  transformations?: Record<string, {
    type: 'uppercase' | 'lowercase' | 'trim' | 'format' | 'custom';
    format?: string;
    customFunction?: string;
  }>;
}
```

### **Export Filters**
```typescript
/**
 * Filters for export operations
 */
export interface ExportFilters {
  /** Filter by user attributes */
  userAttributes?: Record<string, any>;
  
  /** Filter by user status */
  userStatus?: string[];
  
  /** Filter by user groups */
  userGroups?: string[];
  
  /** Filter by population */
  populations?: string[];
  
  /** Filter by date range */
  dateRange?: {
    field: string;
    from: string;
    to: string;
  };
  
  /** Custom filter expressions */
  customFilters?: Array<{
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'between';
    value: any;
    value2?: any;
  }>;
  
  /** Sort configuration */
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  
  /** Pagination */
  pagination?: {
    offset: number;
    limit: number;
  };
}
```

### **Import Statistics**
```typescript
/**
 * Statistics collected during import operations
 */
export interface ImportStatistics {
  /** Total processing time in milliseconds */
  totalProcessingTime: number;
  
  /** Average time per record */
  averageTimePerRecord: number;
  
  /** Records per second processing rate */
  recordsPerSecond: number;
  
  /** Field mapping statistics */
  fieldMapping: {
    totalFields: number;
    mappedFields: number;
    unmappedFields: number;
    autoMappedFields: number;
  };
  
  /** Validation statistics */
  validation: {
    totalValidations: number;
    passedValidations: number;
    failedValidations: number;
    warnings: number;
  };
  
  /** Error statistics */
  errors: {
    totalErrors: number;
    errorTypes: Record<string, number>;
    mostCommonError: string;
  };
  
  /** Performance statistics */
  performance: {
    memoryUsage: number;
    cpuUsage: number;
    networkRequests: number;
    databaseQueries: number;
  };
}
```

## 📊 **API Response Interfaces**

### **Standard API Response**
```typescript
/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  /** Success status of the request */
  success: boolean;
  
  /** Response data */
  data?: T;
  
  /** Error information if request failed */
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  
  /** Metadata about the response */
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
```

### **Upload Response**
```typescript
/**
 * Response for file upload operations
 */
export interface UploadResponse {
  /** Upload success status */
  success: boolean;
  
  /** File information */
  file?: {
    originalname: string;
    filename: string;
    size: number;
    mimetype: string;
    encoding: string;
  };
  
  /** Parsed data from file */
  data?: any[];
  
  /** Validation results */
  validation?: {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
  };
  
  /** Import operation created */
  operation?: ImportOperation;
  
  /** Error information */
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

### **Progress Response**
```typescript
/**
 * Real-time progress update response
 */
export interface ProgressResponse {
  /** Operation ID */
  operationId: string;
  
  /** Session ID */
  sessionId: string;
  
  /** Current progress percentage */
  progress: number;
  
  /** Current status */
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  
  /** Current step description */
  currentStep?: string;
  
  /** Total steps */
  totalSteps?: number;
  
  /** Processed items count */
  processed: number;
  
  /** Total items count */
  total: number;
  
  /** Error count */
  errors: number;
  
  /** Warning count */
  warnings: number;
  
  /** Estimated time remaining (ms) */
  estimatedTimeRemaining?: number;
  
  /** Current message */
  message?: string;
  
  /** Timestamp of update */
  timestamp: string;
}
```

## 🔧 **Service Class Interfaces**

### **User Management Service**
```typescript
/**
 * Main service interface for user management operations
 */
export interface IUserManagementService {
  // Import Operations
  startImport(file: File, options: ImportOptions): Promise<ImportOperation>;
  cancelImport(operationId: string): Promise<void>;
  getImportStatus(operationId: string): Promise<ImportOperation>;
  getImportHistory(limit?: number): Promise<ImportOperation[]>;
  
  // Export Operations
  startExport(options: ExportOptions): Promise<ExportOperation>;
  cancelExport(operationId: string): Promise<void>;
  getExportStatus(operationId: string): Promise<ExportOperation>;
  getExportHistory(limit?: number): Promise<ExportOperation[]>;
  downloadExport(operationId: string): Promise<Blob>;
  
  // Population Management
  getPopulations(): Promise<PopulationData[]>;
  getPopulation(id: string): Promise<PopulationData | null>;
  refreshPopulationCache(id: string): Promise<PopulationData | null>;
  
  // Settings Management
  getSettings(): Promise<UserManagementSettings>;
  saveSettings(settings: UserManagementSettings): Promise<void>;
  validateSettings(settings: Partial<UserManagementSettings>): Promise<{
    isValid: boolean;
    errors: string[];
  }>;
  
  // Validation
  validateImportFile(file: File): Promise<ValidationResult>;
  validateExportOptions(options: ExportOptions): Promise<ValidationResult>;
  
  // Progress Tracking
  subscribeToProgress(operationId: string, callback: (progress: ProgressResponse) => void): () => void;
  unsubscribeFromProgress(operationId: string): void;
}
```

### **File Processing Service**
```typescript
/**
 * Service interface for file processing operations
 */
export interface IFileProcessingService {
  // File Parsing
  parseCSV(file: File, options: CSVParseOptions): Promise<ParsedData>;
  parseJSON(file: File): Promise<ParsedData>;
  parseExcel(file: File): Promise<ParsedData>;
  
  // File Validation
  validateFile(file: File, type: 'csv' | 'json' | 'xlsx'): Promise<ValidationResult>;
  
  // File Transformation
  transformData(data: ParsedData, mapping: FieldMapping): Promise<TransformedData>;
  
  // File Generation
  generateCSV(data: any[], options: CSVGenerateOptions): Promise<Blob>;
  generateJSON(data: any[], options: JSONGenerateOptions): Promise<Blob>;
  generateExcel(data: any[], options: ExcelGenerateOptions): Promise<Blob>;
}
```

### **Progress Tracking Service**
```typescript
/**
 * Service interface for real-time progress tracking
 */
export interface IProgressTrackingService {
  // Operation Management
  createOperation(operation: CreateOperationRequest): Promise<ActiveOperation>;
  updateOperation(operationId: string, updates: Partial<ActiveOperation>): Promise<void>;
  getOperation(operationId: string): Promise<ActiveOperation | null>;
  deleteOperation(operationId: string): Promise<void>;
  
  // Progress Updates
  updateProgress(operationId: string, progress: number, message?: string): Promise<void>;
  updateStatus(operationId: string, status: ActiveOperation['status']): Promise<void>;
  updateStep(operationId: string, step: string, totalSteps?: number): Promise<void>;
  
  // Error Handling
  setError(operationId: string, error: Error): Promise<void>;
  clearError(operationId: string): Promise<void>;
  
  // Real-time Notifications
  subscribe(operationId: string, callback: (progress: ProgressResponse) => void): () => void;
  unsubscribe(operationId: string): void;
  
  // Metrics
  getOperationMetrics(operationId: string): Promise<OperationMetrics>;
  getAllActiveOperations(): Promise<ActiveOperation[]>;
}
```

## 📋 **Migration Interfaces**

### **Migration Result**
```typescript
/**
 * Result of data migration operations
 */
export interface MigrationResult {
  /** Migration success status */
  success: boolean;
  
  /** Number of records migrated */
  migratedRecords: number;
  
  /** Number of records that failed to migrate */
  failedRecords: number;
  
  /** Migration warnings */
  warnings: string[];
  
  /** Migration errors */
  errors: Array<{
    record: any;
    error: string;
    details?: any;
  }>;
  
  /** Migration statistics */
  statistics: {
    startTime: number;
    endTime: number;
    duration: number;
    recordsPerSecond: number;
  };
  
  /** Migration metadata */
  metadata: {
    sourceVersion: string;
    targetVersion: string;
    migrationType: string;
    timestamp: string;
  };
}
```

### **Export Data**
```typescript
/**
 * Data export structure for backup/migration
 */
export interface ExportData {
  /** Export version */
  version: string;
  
  /** Export timestamp */
  timestamp: string;
  
  /** User management settings */
  settings: UserManagementSettings;
  
  /** Import history */
  importHistory: ImportOperation[];
  
  /** Export history */
  exportHistory: ExportOperation[];
  
  /** Population cache */
  populationCache: Record<string, PopulationData>;
  
  /** Active operations */
  activeOperations: Record<string, ActiveOperation>;
  
  /** Export metadata */
  metadata: {
    exportedBy: string;
    exportVersion: string;
    totalRecords: number;
    checksum?: string;
  };
}
```

### **Import Result**
```typescript
/**
 * Result of data import operations
 */
export interface ImportResult {
  /** Import success status */
  success: boolean;
  
  /** Number of records imported */
  importedRecords: number;
  
  /** Number of records that failed to import */
  failedRecords: number;
  
  /** Import warnings */
  warnings: string[];
  
  /** Import errors */
  errors: Array<{
    record: any;
    error: string;
    details?: any;
  }>;
  
  /** Import statistics */
  statistics: {
    startTime: number;
    endTime: number;
    duration: number;
    recordsPerSecond: number;
  };
  
  /** Import metadata */
  metadata: {
    sourceVersion: string;
    targetVersion: string;
    importType: string;
    timestamp: string;
  };
}
```

## 🔧 **Validation Interfaces**

### **Validation Result**
```typescript
/**
 * Result of file or data validation
 */
export interface ValidationResult {
  /** Validation success status */
  isValid: boolean;
  
  /** Validation warnings */
  warnings: ValidationWarning[];
  
  /** Validation errors */
  errors: ValidationError[];
  
  /** Validation statistics */
  statistics: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    warningChecks: number;
  };
  
  /** File information */
  fileInfo?: {
    name: string;
    size: number;
    type: string;
    rows?: number;
    columns?: number;
  };
}
```

### **Validation Warning**
```typescript
/**
 * Validation warning information
 */
export interface ValidationWarning {
  /** Warning type */
  type: string;
  
  /** Warning message */
  message: string;
  
  /** Row number where warning occurred */
  row?: number;
  
  /** Column name where warning occurred */
  column?: string;
  
  /** Value that triggered the warning */
  value?: any;
  
  /** Suggested fix */
  suggestion?: string;
}
```

### **Validation Error**
```typescript
/**
 * Validation error information
 */
export interface ValidationError {
  /** Error type */
  type: string;
  
  /** Error message */
  message: string;
  
  /** Row number where error occurred */
  row?: number;
  
  /** Column name where error occurred */
  column?: string;
  
  /** Value that triggered the error */
  value?: any;
  
  /** Error code */
  code?: string;
  
  /** Error details */
  details?: any;
  
  /** Suggested fix */
  suggestion?: string;
}
```

## 📊 **Configuration Interfaces**

### **Import Options**
```typescript
/**
 * Options for import operations
 */
export interface ImportOptions {
  /** Target population ID */
  populationId?: string;
  
  /** Field mapping configuration */
  fieldMapping?: FieldMapping;
  
  /** Validation rules */
  validationRules?: ImportValidationRules;
  
  /** Import operation type */
  operationType?: 'import' | 'update' | 'modify';
  
  /** Skip header row */
  skipHeader?: boolean;
  
  /** Batch size for processing */
  batchSize?: number;
  
  /** Continue on error */
  continueOnError?: boolean;
  
  /** Dry run mode */
  dryRun?: boolean;
  
  /** Enable real-time progress */
  enableProgress?: boolean;
  
  /** Custom processing options */
  customOptions?: Record<string, any>;
}
```

### **Export Options**
```typescript
/**
 * Options for export operations
 */
export interface ExportOptions {
  /** Target population ID */
  populationId: string;
  
  /** Export format */
  format: 'csv' | 'json' | 'xlsx';
  
  /** Fields to include */
  fields?: string[];
  
  /** Export filters */
  filters?: ExportFilters;
  
  /** Include headers */
  includeHeaders?: boolean;
  
  /** Date format for date fields */
  dateFormat?: string;
  
  /** Timezone for date fields */
  timezone?: string;
  
  /** Encoding for text fields */
  encoding?: string;
  
  /** Maximum records to export */
  maxRecords?: number;
  
  /** Sort configuration */
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  
  /** Custom export options */
  customOptions?: Record<string, any>;
}
```

### **Field Mapping**
```typescript
/**
 * Field mapping configuration for import/export
 */
export interface FieldMapping {
  /** Source field name */
  sourceField: string;
  
  /** Target field name */
  targetField: string;
  
  /** Field transformation */
  transformation?: 'none' | 'uppercase' | 'lowercase' | 'trim' | 'format' | 'custom';
  
  /** Field format */
  format?: string;
  
  /** Custom transformation function */
  customFunction?: string;
  
  /** Default value for missing fields */
  defaultValue?: any;
  
  /** Field validation rules */
  validation?: {
    required?: boolean;
    type?: string;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    allowedValues?: string[];
    forbiddenValues?: string[];
  };
}
```

### **CSVParseOptions**
```typescript
/**
 * Options for CSV file parsing
 */
export interface CSVParseOptions {
  /** Delimiter character */
  delimiter?: string;
  
  /** Quote character */
  quote?: string;
  
  /** Escape character */
  escape?: string;
  
  /** Skip empty lines */
  skipEmptyLines?: boolean;
  
  /** Trim fields */
  trimFields?: boolean;
  
  /** Number of header rows to skip */
  skipRows?: number;
  
  /** Column names (if not in file) */
  columns?: string[];
  
  /** Data types for columns */
  columnTypes?: Record<string, string>;
  
  /** Date format for date columns */
  dateFormat?: string;
  
  /** Locale for number/date formatting */
  locale?: string;
  
  /** Custom parser function */
  customParser?: (row: string[], index: number) => any;
}
```

## 🎯 **Usage Examples**

### **Creating a User Management Repository**
```typescript
import { UserManagementRepository } from './services/userManagementRepository.js';

const repository = new UserManagementRepository();

// Save settings
await repository.saveSettings({
  pingone_environment_id: 'env-123',
  pingone_client_id: 'client-456',
  pingone_region: 'NorthAmerica',
  import_batch_size: 100,
  export_format: 'csv',
  enable_real_time_progress: true,
  auto_backup_enabled: true,
  savedAt: Date.now(),
  version: '1.0.0'
});
```

### **Starting an Import Operation**
```typescript
import { UserManagementService } from './services/userManagementService.js';

const service = new UserManagementService();

const file = fileInput.files[0];
const options = {
  populationId: 'pop-789',
  fieldMapping: {
    'Email': 'email',
    'First Name': 'given_name',
    'Last Name': 'family_name'
  },
  validationRules: {
    requiredFields: ['email', 'given_name', 'family_name'],
    fieldFormats: {
      'email': { type: 'email', pattern: '^[^\\s*@\\s*$' },
      'given_name': { type: 'string', minLength: 1, maxLength: 50 },
      'family_name': { type: 'string', minLength: 1, maxLength: 50 }
    }
  },
  enableProgress: true
};

const operation = await service.startImport(file, options);
```

### **Tracking Progress**
```typescript
import { ProgressTrackingService } from './services/progressTrackingService.js';

const progressService = new ProgressTrackingService();

// Subscribe to progress updates
const unsubscribe = progressService.subscribe(operation.id, (progress) => {
  console.log(`Progress: ${progress.progress}% - ${progress.message}`);
  updateProgressBar(progress.progress);
});

// Later, unsubscribe when done
unsubscribe();
```

This comprehensive interface documentation ensures type safety and provides clear guidance for implementing the PingOne User Management services with proper TypeScript interfaces and smooth migration from the P1-Import-Subsystem.
