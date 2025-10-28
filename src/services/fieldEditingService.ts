// src/services/fieldEditingService.ts
// Service to prevent and fix field editing issues across all flows

import { useEffect, useCallback, useRef } from 'react';

interface FieldEditingConfig {
  preventDisabledState?: boolean;
  preventReadonlyState?: boolean;
  ensurePointerEvents?: boolean;
  monitorChanges?: boolean;
  autoFix?: boolean;
}

interface FieldEditingState {
  isMonitoring: boolean;
  lastDiagnostic: any;
  issuesFound: number;
}

class FieldEditingService {
  private static instance: FieldEditingService;
  private config: FieldEditingConfig;
  private state: FieldEditingState;
  private observers: Set<MutationObserver> = new Set();

  constructor() {
    this.config = {
      preventDisabledState: true,
      preventReadonlyState: true,
      ensurePointerEvents: true,
      monitorChanges: true,
      autoFix: true
    };
    
    this.state = {
      isMonitoring: false,
      lastDiagnostic: null,
      issuesFound: 0
    };
  }

  static getInstance(): FieldEditingService {
    if (!FieldEditingService.instance) {
      FieldEditingService.instance = new FieldEditingService();
    }
    return FieldEditingService.instance;
  }

  /**
   * Initialize field editing protection
   */
  initialize(config: Partial<FieldEditingConfig> = {}): void {
    this.config = { ...this.config, ...config };
    
    console.log('🛡️ [FIELD EDITING SERVICE] Initializing field editing protection...');
    
    if (this.config.monitorChanges) {
      this.startMonitoring();
    }
    
    if (this.config.autoFix) {
      this.applyProtection();
    }
  }

  /**
   * Apply protection to all existing fields
   */
  applyProtection(): void {
    console.log('🔒 [FIELD EDITING SERVICE] Applying protection to all fields...');
    
    const allInputs = this.getAllInputElements();
    let protectedCount = 0;

    allInputs.forEach((input) => {
      if (this.protectField(input)) {
        protectedCount++;
      }
    });

    console.log(`✅ Protected ${protectedCount} fields out of ${allInputs.length} total fields`);
  }

  /**
   * Protect a single field
   */
  private protectField(element: HTMLElement): boolean {
    let protected_ = false;

    // Prevent disabled state
    if (this.config.preventDisabledState) {
      if (element.hasAttribute('disabled')) {
        element.removeAttribute('disabled');
        (element as any).disabled = false;
        protected_ = true;
      }
    }

    // Prevent readonly state
    if (this.config.preventReadonlyState) {
      if (element.hasAttribute('readonly')) {
        element.removeAttribute('readonly');
        (element as any).readOnly = false;
        protected_ = true;
      }
    }

    // Ensure pointer events
    if (this.config.ensurePointerEvents) {
      const computedStyle = window.getComputedStyle(element);
      if (computedStyle.pointerEvents === 'none') {
        (element as any).style.pointerEvents = 'auto';
        protected_ = true;
      }
    }

    return protected_;
  }

  /**
   * Start monitoring for field editing issues
   */
  startMonitoring(): void {
    if (this.state.isMonitoring) {
      console.log('⚠️ [FIELD EDITING SERVICE] Already monitoring');
      return;
    }

    console.log('👀 [FIELD EDITING SERVICE] Starting field monitoring...');
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          const target = mutation.target as HTMLElement;
          if (this.isInputElement(target)) {
            this.handleFieldChange(target, mutation);
          }
        }
        
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement;
              if (this.isInputElement(element)) {
                this.protectField(element);
              }
              
              // Check for input elements within the added node
              const inputs = element.querySelectorAll('input, textarea, select');
              inputs.forEach((input) => this.protectField(input as HTMLElement));
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['disabled', 'readonly'],
      childList: true,
      subtree: true
    });

    this.observers.add(observer);
    this.state.isMonitoring = true;
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    console.log('🛑 [FIELD EDITING SERVICE] Stopping field monitoring...');
    
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.state.isMonitoring = false;
  }

  /**
   * Handle field changes
   */
  private handleFieldChange(element: HTMLElement, mutation: MutationRecord): void {
    const attributeName = mutation.attributeName;
    
    if (attributeName === 'disabled' || attributeName === 'readonly') {
      console.warn('🚨 [FIELD EDITING SERVICE] Field editing state changed:', {
        element,
        attribute: attributeName,
        newValue: element.getAttribute(attributeName)
      });
      
      this.state.issuesFound++;
      
      if (this.config.autoFix) {
        this.protectField(element);
        console.log('🔧 [FIELD EDITING SERVICE] Auto-fixed field editing issue');
      }
    }
  }

  /**
   * Check if element is an input element
   */
  private isInputElement(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();
    return tagName === 'input' || tagName === 'textarea' || tagName === 'select';
  }

  /**
   * Get all input elements
   */
  private getAllInputElements(): HTMLElement[] {
    const selectors = [
      'input[type="text"]',
      'input[type="email"]',
      'input[type="password"]',
      'input[type="url"]',
      'input[type="tel"]',
      'input[type="search"]',
      'textarea',
      'select'
    ];

    const elements: HTMLElement[] = [];
    selectors.forEach(selector => {
      const found = document.querySelectorAll(selector) as NodeListOf<HTMLElement>;
      elements.push(...Array.from(found));
    });

    return elements;
  }

  /**
   * Get current state
   */
  getState(): FieldEditingState {
    return { ...this.state };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<FieldEditingConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('⚙️ [FIELD EDITING SERVICE] Configuration updated:', this.config);
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.stopMonitoring();
    console.log('🧹 [FIELD EDITING SERVICE] Cleaned up');
  }
}

// React hook for field editing protection
export const useFieldEditingProtection = (config: Partial<FieldEditingConfig> = {}) => {
  const serviceRef = useRef<FieldEditingService | null>(null);

  useEffect(() => {
    const service = FieldEditingService.getInstance();
    serviceRef.current = service;
    
    service.initialize(config);
    
    return () => {
      // Don't cleanup the singleton service here as it's shared
      // Individual components should not stop the global monitoring
    };
  }, []);

  const protectField = useCallback((element: HTMLElement) => {
    if (serviceRef.current) {
      return (serviceRef.current as any).protectField(element);
    }
    return false;
  }, []);

  const getState = useCallback(() => {
    if (serviceRef.current) {
      return serviceRef.current.getState();
    }
    return null;
  }, []);

  return {
    protectField,
    getState,
    service: serviceRef.current
  };
};

// Global access for debugging
if (typeof window !== 'undefined') {
  const service = FieldEditingService.getInstance();
  (window as any).FieldEditingService = service;
  
  // Convenience functions
  (window as any).protectFields = () => service.applyProtection();
  (window as any).startFieldMonitoring = () => service.startMonitoring();
  (window as any).stopFieldMonitoring = () => service.stopMonitoring();
  (window as any).getFieldState = () => service.getState();

  console.log('🛡️ Field Editing Service loaded. Available commands:');
  console.log('  - protectFields() - Apply protection to all fields');
  console.log('  - startFieldMonitoring() - Start monitoring');
  console.log('  - stopFieldMonitoring() - Stop monitoring');
  console.log('  - getFieldState() - Get current state');
}

export default FieldEditingService;
