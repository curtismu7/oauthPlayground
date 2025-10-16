// src/services/accessibilityService.ts
// V6 Accessibility and Responsive Design Service

import { logger } from '../utils/logger';

export interface AccessibilityConfig {
  enableScreenReader: boolean;
  enableKeyboardNavigation: boolean;
  enableHighContrast: boolean;
  enableReducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  colorScheme: 'light' | 'dark' | 'auto';
  announceChanges: boolean;
  focusManagement: boolean;
}

export interface ResponsiveBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
  wide: number;
}

export interface AccessibilityFeatures {
  ariaLabels: Record<string, string>;
  keyboardShortcuts: Record<string, () => void>;
  screenReaderText: Record<string, string>;
  focusTraps: string[];
  liveRegions: string[];
}

export interface DeviceCapabilities {
  screenReader: boolean;
  touchScreen: boolean;
  keyboard: boolean;
  mouse: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  darkMode: boolean;
}

class AccessibilityService {
  private static config: AccessibilityConfig = {
    enableScreenReader: true,
    enableKeyboardNavigation: true,
    enableHighContrast: false,
    enableReducedMotion: false,
    fontSize: 'medium',
    colorScheme: 'auto',
    announceChanges: true,
    focusManagement: true
  };

  private static breakpoints: ResponsiveBreakpoints = {
    mobile: 768,
    tablet: 1024,
    desktop: 1440,
    wide: 1920
  };

  private static features: AccessibilityFeatures = {
    ariaLabels: {},
    keyboardShortcuts: {},
    screenReaderText: {},
    focusTraps: [],
    liveRegions: []
  };

  private static deviceCapabilities: DeviceCapabilities | null = null;
  private static currentBreakpoint: keyof ResponsiveBreakpoints = 'desktop';
  private static focusHistory: HTMLElement[] = [];
  private static announcer: HTMLElement | null = null;

  /**
   * Initialize accessibility service
   */
  static initialize(config?: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Detect device capabilities
    this.detectDeviceCapabilities();
    
    // Set up responsive breakpoints
    this.setupResponsiveBreakpoints();
    
    // Initialize accessibility features
    this.setupAccessibilityFeatures();
    
    // Set up keyboard navigation
    if (this.config.enableKeyboardNavigation) {
      this.setupKeyboardNavigation();
    }
    
    // Set up screen reader support
    if (this.config.enableScreenReader) {
      this.setupScreenReaderSupport();
    }
    
    // Apply user preferences
    this.applyUserPreferences();
    
    logger.info('AccessibilityService', 'Accessibility service initialized', {
      config: this.config,
      deviceCapabilities: this.deviceCapabilities,
      currentBreakpoint: this.currentBreakpoint
    });
  }

  /**
   * Get current device capabilities
   */
  static getDeviceCapabilities(): DeviceCapabilities {
    if (!this.deviceCapabilities) {
      this.detectDeviceCapabilities();
    }
    return this.deviceCapabilities!;
  }

  /**
   * Get current responsive breakpoint
   */
  static getCurrentBreakpoint(): keyof ResponsiveBreakpoints {
    return this.currentBreakpoint;
  }

  /**
   * Check if current viewport matches breakpoint
   */
  static matchesBreakpoint(breakpoint: keyof ResponsiveBreakpoints): boolean {
    if (typeof window === 'undefined') return false;
    
    const width = window.innerWidth;
    
    switch (breakpoint) {
      case 'mobile':
        return width < this.breakpoints.mobile;
      case 'tablet':
        return width >= this.breakpoints.mobile && width < this.breakpoints.tablet;
      case 'desktop':
        return width >= this.breakpoints.tablet && width < this.breakpoints.desktop;
      case 'wide':
        return width >= this.breakpoints.desktop;
      default:
        return false;
    }
  }

  /**
   * Get responsive CSS classes
   */
  static getResponsiveClasses(): string[] {
    const classes: string[] = [];
    
    classes.push(`breakpoint-${this.currentBreakpoint}`);
    
    if (this.deviceCapabilities?.touchScreen) {
      classes.push('touch-device');
    }
    
    if (this.deviceCapabilities?.screenReader) {
      classes.push('screen-reader');
    }
    
    if (this.config.enableHighContrast) {
      classes.push('high-contrast');
    }
    
    if (this.config.enableReducedMotion) {
      classes.push('reduced-motion');
    }
    
    classes.push(`font-size-${this.config.fontSize}`);
    classes.push(`color-scheme-${this.config.colorScheme}`);
    
    return classes;
  }

  /**
   * Announce message to screen readers
   */
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.config.announceChanges || !this.announcer) {
      return;
    }
    
    this.announcer.setAttribute('aria-live', priority);
    this.announcer.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      if (this.announcer) {
        this.announcer.textContent = '';
      }
    }, 1000);
    
    logger.debug('AccessibilityService', 'Screen reader announcement', {
      message,
      priority
    });
  }

  /**
   * Set focus to element with focus management
   */
  static setFocus(element: HTMLElement | string, options?: {
    preventScroll?: boolean;
    restoreFocus?: boolean;
  }): void {
    if (!this.config.focusManagement) {
      return;
    }
    
    const targetElement = typeof element === 'string' 
      ? document.querySelector(element) as HTMLElement
      : element;
    
    if (!targetElement) {
      logger.warn('AccessibilityService', 'Focus target not found', { element });
      return;
    }
    
    // Store current focus for restoration
    if (options?.restoreFocus && document.activeElement instanceof HTMLElement) {
      this.focusHistory.push(document.activeElement);
    }
    
    // Set focus
    targetElement.focus({ preventScroll: options?.preventScroll });
    
    // Announce focus change if needed
    const ariaLabel = targetElement.getAttribute('aria-label') || 
                     targetElement.getAttribute('title') ||
                     targetElement.textContent?.trim();
    
    if (ariaLabel) {
      this.announce(`Focused on ${ariaLabel}`);
    }
    
    logger.debug('AccessibilityService', 'Focus set', {
      element: targetElement.tagName,
      ariaLabel
    });
  }

  /**
   * Restore previous focus
   */
  static restoreFocus(): void {
    if (!this.config.focusManagement || this.focusHistory.length === 0) {
      return;
    }
    
    const previousElement = this.focusHistory.pop();
    if (previousElement && document.contains(previousElement)) {
      previousElement.focus();
      logger.debug('AccessibilityService', 'Focus restored');
    }
  }

  /**
   * Create focus trap for modal/dialog
   */
  static createFocusTrap(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
      
      if (e.key === 'Escape') {
        this.restoreFocus();
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    
    // Set initial focus
    if (firstElement) {
      this.setFocus(firstElement, { restoreFocus: true });
    }
    
    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }

  /**
   * Add ARIA labels and descriptions
   */
  static addAriaLabels(labels: Record<string, string>): void {
    Object.entries(labels).forEach(([selector, label]) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        element.setAttribute('aria-label', label);
      });
    });
    
    this.features.ariaLabels = { ...this.features.ariaLabels, ...labels };
  }

  /**
   * Register keyboard shortcuts
   */
  static registerKeyboardShortcuts(shortcuts: Record<string, () => void>): void {
    Object.entries(shortcuts).forEach(([key, handler]) => {
      this.features.keyboardShortcuts[key] = handler;
    });
    
    logger.info('AccessibilityService', 'Keyboard shortcuts registered', {
      shortcuts: Object.keys(shortcuts)
    });
  }

  /**
   * Update user preferences
   */
  static updatePreferences(preferences: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...preferences };
    this.applyUserPreferences();
    
    logger.info('AccessibilityService', 'User preferences updated', {
      preferences
    });
  }

  /**
   * Get accessibility compliance report
   */
  static getComplianceReport(): {
    wcagLevel: 'A' | 'AA' | 'AAA';
    issues: Array<{
      severity: 'error' | 'warning' | 'info';
      rule: string;
      description: string;
      elements: string[];
    }>;
    score: number;
    recommendations: string[];
  } {
    const issues: Array<{
      severity: 'error' | 'warning' | 'info';
      rule: string;
      description: string;
      elements: string[];
    }> = [];
    
    // Check for missing alt text
    const imagesWithoutAlt = Array.from(document.querySelectorAll('img:not([alt])'));
    if (imagesWithoutAlt.length > 0) {
      issues.push({
        severity: 'error',
        rule: 'WCAG 1.1.1',
        description: 'Images must have alternative text',
        elements: imagesWithoutAlt.map(img => img.outerHTML.substring(0, 100))
      });
    }
    
    // Check for missing form labels
    const inputsWithoutLabels = Array.from(document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])'))
      .filter(input => !document.querySelector(`label[for="${input.id}"]`));
    
    if (inputsWithoutLabels.length > 0) {
      issues.push({
        severity: 'error',
        rule: 'WCAG 1.3.1',
        description: 'Form inputs must have labels',
        elements: inputsWithoutLabels.map(input => input.outerHTML.substring(0, 100))
      });
    }
    
    // Check color contrast (simplified)
    const lowContrastElements = Array.from(document.querySelectorAll('*'))
      .filter(el => {
        const styles = window.getComputedStyle(el);
        const color = styles.color;
        const backgroundColor = styles.backgroundColor;
        // Simplified contrast check - in real implementation, calculate actual contrast ratio
        return color === backgroundColor;
      });
    
    if (lowContrastElements.length > 0) {
      issues.push({
        severity: 'warning',
        rule: 'WCAG 1.4.3',
        description: 'Insufficient color contrast',
        elements: lowContrastElements.slice(0, 5).map(el => el.tagName)
      });
    }
    
    // Calculate score
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    const score = Math.max(0, 100 - (errorCount * 20) - (warningCount * 5));
    
    // Determine WCAG level
    let wcagLevel: 'A' | 'AA' | 'AAA';
    if (errorCount === 0 && warningCount === 0) {
      wcagLevel = 'AAA';
    } else if (errorCount === 0) {
      wcagLevel = 'AA';
    } else {
      wcagLevel = 'A';
    }
    
    const recommendations = [
      'Add alternative text to all images',
      'Ensure all form inputs have labels',
      'Maintain sufficient color contrast ratios',
      'Provide keyboard navigation for all interactive elements',
      'Use semantic HTML elements',
      'Test with screen readers'
    ];
    
    return {
      wcagLevel,
      issues,
      score,
      recommendations
    };
  }

  // Private helper methods

  private static detectDeviceCapabilities(): void {
    if (typeof window === 'undefined') {
      this.deviceCapabilities = {
        screenReader: false,
        touchScreen: false,
        keyboard: true,
        mouse: true,
        reducedMotion: false,
        highContrast: false,
        darkMode: false
      };
      return;
    }
    
    this.deviceCapabilities = {
      screenReader: this.detectScreenReader(),
      touchScreen: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      keyboard: true, // Assume keyboard is available
      mouse: window.matchMedia('(pointer: fine)').matches,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      highContrast: window.matchMedia('(prefers-contrast: high)').matches,
      darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches
    };
  }

  private static detectScreenReader(): boolean {
    // Check for common screen reader indicators
    if (typeof window === 'undefined') return false;
    
    // Check for NVDA, JAWS, VoiceOver, etc.
    const userAgent = navigator.userAgent.toLowerCase();
    const screenReaderIndicators = [
      'nvda', 'jaws', 'voiceover', 'talkback', 'orca'
    ];
    
    return screenReaderIndicators.some(indicator => 
      userAgent.includes(indicator)
    ) || window.speechSynthesis !== undefined;
  }

  private static setupResponsiveBreakpoints(): void {
    if (typeof window === 'undefined') return;
    
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width < this.breakpoints.mobile) {
        this.currentBreakpoint = 'mobile';
      } else if (width < this.breakpoints.tablet) {
        this.currentBreakpoint = 'tablet';
      } else if (width < this.breakpoints.desktop) {
        this.currentBreakpoint = 'desktop';
      } else {
        this.currentBreakpoint = 'wide';
      }
      
      // Update CSS classes
      document.body.className = document.body.className
        .replace(/breakpoint-\w+/g, '')
        .trim();
      document.body.classList.add(`breakpoint-${this.currentBreakpoint}`);
    };
    
    // Initial check
    updateBreakpoint();
    
    // Listen for resize
    window.addEventListener('resize', updateBreakpoint);
  }

  private static setupAccessibilityFeatures(): void {
    if (typeof document === 'undefined') return;
    
    // Create screen reader announcer
    this.announcer = document.createElement('div');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.style.position = 'absolute';
    this.announcer.style.left = '-10000px';
    this.announcer.style.width = '1px';
    this.announcer.style.height = '1px';
    this.announcer.style.overflow = 'hidden';
    document.body.appendChild(this.announcer);
    
    // Add skip links
    this.addSkipLinks();
    
    // Set up focus indicators
    this.setupFocusIndicators();
  }

  private static setupKeyboardNavigation(): void {
    if (typeof document === 'undefined') return;
    
    document.addEventListener('keydown', (e) => {
      // Handle registered shortcuts
      const shortcutKey = this.getShortcutKey(e);
      const handler = this.features.keyboardShortcuts[shortcutKey];
      
      if (handler) {
        e.preventDefault();
        handler();
        return;
      }
      
      // Default keyboard navigation
      switch (e.key) {
        case 'Tab':
          // Tab navigation is handled by browser
          break;
        case 'Escape':
          // Close modals, dropdowns, etc.
          this.handleEscapeKey();
          break;
        case 'Enter':
        case ' ':
          // Activate buttons, links
          if (e.target instanceof HTMLElement && 
              (e.target.tagName === 'BUTTON' || e.target.getAttribute('role') === 'button')) {
            e.target.click();
          }
          break;
      }
    });
  }

  private static setupScreenReaderSupport(): void {
    // Add screen reader specific styles
    const style = document.createElement('style');
    style.textContent = `
      .sr-only {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      }
      
      .sr-only-focusable:focus {
        position: static !important;
        width: auto !important;
        height: auto !important;
        padding: inherit !important;
        margin: inherit !important;
        overflow: visible !important;
        clip: auto !important;
        white-space: inherit !important;
      }
    `;
    document.head.appendChild(style);
  }

  private static applyUserPreferences(): void {
    if (typeof document === 'undefined') return;
    
    // Apply font size
    document.documentElement.style.fontSize = this.getFontSizeValue(this.config.fontSize);
    
    // Apply color scheme
    if (this.config.colorScheme !== 'auto') {
      document.documentElement.setAttribute('data-color-scheme', this.config.colorScheme);
    }
    
    // Apply high contrast
    if (this.config.enableHighContrast) {
      document.body.classList.add('high-contrast');
    }
    
    // Apply reduced motion
    if (this.config.enableReducedMotion) {
      document.body.classList.add('reduced-motion');
    }
    
    // Update responsive classes
    const classes = this.getResponsiveClasses();
    document.body.className = document.body.className
      .replace(/breakpoint-\w+|touch-device|screen-reader|high-contrast|reduced-motion|font-size-\w+|color-scheme-\w+/g, '')
      .trim();
    document.body.classList.add(...classes);
  }

  private static addSkipLinks(): void {
    const skipLinks = document.createElement('div');
    skipLinks.className = 'skip-links';
    skipLinks.innerHTML = `
      <a href="#main-content" class="sr-only-focusable">Skip to main content</a>
      <a href="#navigation" class="sr-only-focusable">Skip to navigation</a>
    `;
    
    document.body.insertBefore(skipLinks, document.body.firstChild);
  }

  private static setupFocusIndicators(): void {
    const style = document.createElement('style');
    style.textContent = `
      :focus {
        outline: 2px solid #3b82f6 !important;
        outline-offset: 2px !important;
      }
      
      .focus-visible:focus {
        outline: 2px solid #3b82f6 !important;
        outline-offset: 2px !important;
      }
      
      .reduced-motion * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    `;
    document.head.appendChild(style);
  }

  private static getFontSizeValue(size: AccessibilityConfig['fontSize']): string {
    switch (size) {
      case 'small': return '14px';
      case 'medium': return '16px';
      case 'large': return '18px';
      case 'extra-large': return '20px';
      default: return '16px';
    }
  }

  private static getShortcutKey(e: KeyboardEvent): string {
    const modifiers = [];
    if (e.ctrlKey) modifiers.push('ctrl');
    if (e.altKey) modifiers.push('alt');
    if (e.shiftKey) modifiers.push('shift');
    if (e.metaKey) modifiers.push('meta');
    
    return [...modifiers, e.key.toLowerCase()].join('+');
  }

  private static handleEscapeKey(): void {
    // Close any open modals or dropdowns
    const openModals = document.querySelectorAll('[role="dialog"][aria-hidden="false"]');
    openModals.forEach(modal => {
      const closeButton = modal.querySelector('[data-dismiss="modal"]') as HTMLElement;
      if (closeButton) {
        closeButton.click();
      }
    });
    
    this.restoreFocus();
  }
}

export default AccessibilityService;