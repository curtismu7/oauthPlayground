// File: src/v8/utils/fileUploadMonitor.ts
// Purpose: Runtime monitoring for file upload issues

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  timestamp: number;
  base64Url?: string;
}

export class FileUploadMonitor {
  private static instance: FileUploadMonitor;
  private warnings: string[] = [];

  static getInstance(): FileUploadMonitor {
    if (!FileUploadMonitor.instance) {
      FileUploadMonitor.instance = new FileUploadMonitor();
    }
    return FileUploadMonitor.instance;
  }

  // Monitor for base64 display issues
  monitorLogoDisplay(customLogoUrl: string, uploadedFileInfo: FileInfo | null) {
    // Check if customLogoUrl contains base64 data while uploadedFileInfo is null
    if (customLogoUrl.startsWith('data:') && !uploadedFileInfo) {
      const warning = '⚠️ WARNING: Base64 data detected in customLogoUrl without uploadedFileInfo';
      console.warn(warning);
      this.warnings.push(warning);
    }

    // Check if both states are set (potential state mixing)
    if (customLogoUrl && uploadedFileInfo && customLogoUrl.startsWith('data:')) {
      const warning = '⚠️ WARNING: Both customLogoUrl (base64) and uploadedFileInfo are set';
      console.warn(warning);
      this.warnings.push(warning);
    }
  }

  // Get all warnings
  getWarnings(): string[] {
    return this.warnings;
  }

  // Clear warnings
  clearWarnings(): void {
    this.warnings = [];
  }

  // Log current state for debugging
  logState(customLogoUrl: string, uploadedFileInfo: FileInfo | null): void {
    console.log('🔍 File Upload State Monitor:', {
      hasCustomLogoUrl: !!customLogoUrl,
      isBase64Url: customLogoUrl?.startsWith('data:'),
      hasUploadedFileInfo: !!uploadedFileInfo,
      uploadedFileName: uploadedFileInfo?.name,
      uploadedFileSize: uploadedFileInfo?.size,
      warnings: this.warnings.length
    });
  }
}

// Hook for React components
export function useFileUploadMonitor() {
  const monitor = FileUploadMonitor.getInstance();
  
  return {
    monitorLogoDisplay: monitor.monitorLogoDisplay.bind(monitor),
    getWarnings: monitor.getWarnings.bind(monitor),
    clearWarnings: monitor.clearWarnings.bind(monitor),
    logState: monitor.logState.bind(monitor)
  };
}
