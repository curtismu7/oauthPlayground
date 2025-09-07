import { useEffect, useCallback, useRef, useState } from 'react';
import { 
  accessibilityManager, 
  getFocusManager, 
  getAnnouncer, 
  getContrastChecker,
  ARIA_ROLES,
  ARIA_PROPERTIES,
  KEYBOARD_KEYS
} from '../utils/accessibility';
import { logger } from '../utils/logger';

// Accessibility hook configuration
export interface UseAccessibilityConfig {
  role?: string;
  label?: string;
  description?: string;
  announceChanges?: boolean;
  trapFocus?: boolean;
  keyboardNavigation?: boolean;
  screenReader?: boolean;
}

// Accessibility hook return type
export interface UseAccessibilityReturn {
  // ARIA attributes
  ariaProps: Record<string, string>;
  
  // Event handlers
  onKeyDown: (event: React.KeyboardEvent) => void;
  onFocus: (event: React.FocusEvent) => void;
  onBlur: (event: React.FocusEvent) => void;
  
  // Focus management
  focus: () => void;
  focusNext: () => void;
  focusPrevious: () => void;
  
  // Announcements
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  announceError: (message: string) => void;
  announceSuccess: (message: string) => void;
  
  // State
  isFocused: boolean;
  isKeyboardUser: boolean;
  hasFocus: boolean;
}

// useAccessibility hook
export const useAccessibility = (config: UseAccessibilityConfig = {}): UseAccessibilityReturn => {
  const {
    role,
    label,
    description,
    announceChanges = true,
    trapFocus = false,
    keyboardNavigation = true,
    screenReader = true
  } = config;

  const elementRef = useRef<HTMLElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);

  const focusManager = getFocusManager();
  const announcer = getAnnouncer();
  const contrastChecker = getContrastChecker();

  // Generate ARIA props
  const ariaProps = {
    ...(role && { role }),
    ...(label && { [ARIA_PROPERTIES.LABELLEDBY]: label }),
    ...(description && { [ARIA_PROPERTIES.DESCRIBEDBY]: description }),
    ...(isFocused && { [ARIA_PROPERTIES.CURRENT]: 'true' })
  };

  // Handle keyboard events
  const onKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!keyboardNavigation) return;

    const { key, ctrlKey, metaKey, shiftKey } = event;

    // Mark as keyboard user
    setIsKeyboardUser(true);

    // Handle common keyboard shortcuts
    switch (key) {
      case KEYBOARD_KEYS.ENTER:
      case KEYBOARD_KEYS.SPACE:
        if (role === ARIA_ROLES.BUTTON || role === ARIA_ROLES.LINK) {
          event.preventDefault();
          elementRef.current?.click();
        }
        break;

      case KEYBOARD_KEYS.ESCAPE:
        if (trapFocus) {
          event.preventDefault();
          focusManager.focus(document.body);
        }
        break;

      case KEYBOARD_KEYS.ARROW_DOWN:
        if (role === ARIA_ROLES.MENU || role === ARIA_ROLES.TABLIST) {
          event.preventDefault();
          focusNext();
        }
        break;

      case KEYBOARD_KEYS.ARROW_UP:
        if (role === ARIA_ROLES.MENU || role === ARIA_ROLES.TABLIST) {
          event.preventDefault();
          focusPrevious();
        }
        break;

      case KEYBOARD_KEYS.ARROW_LEFT:
        if (role === ARIA_ROLES.TABLIST) {
          event.preventDefault();
          focusPrevious();
        }
        break;

      case KEYBOARD_KEYS.ARROW_RIGHT:
        if (role === ARIA_ROLES.TABLIST) {
          event.preventDefault();
          focusNext();
        }
        break;

      case KEYBOARD_KEYS.HOME:
        if (role === ARIA_ROLES.MENU || role === ARIA_ROLES.TABLIST) {
          event.preventDefault();
          const firstElement = focusManager.getFocusableElements()[0];
          if (firstElement) {
            focusManager.focus(firstElement);
          }
        }
        break;

      case KEYBOARD_KEYS.END:
        if (role === ARIA_ROLES.MENU || role === ARIA_ROLES.TABLIST) {
          event.preventDefault();
          const focusableElements = focusManager.getFocusableElements();
          const lastElement = focusableElements[focusableElements.length - 1];
          if (lastElement) {
            focusManager.focus(lastElement);
          }
        }
        break;

      case KEYBOARD_KEYS.TAB:
        if (trapFocus) {
          event.preventDefault();
          if (shiftKey) {
            focusPrevious();
          } else {
            focusNext();
          }
        }
        break;
    }

    // Handle Ctrl/Cmd + key combinations
    if (ctrlKey || metaKey) {
      switch (key) {
        case 'h':
          event.preventDefault();
          announcer.announce('Help: Use Tab to navigate, Enter to activate, Escape to close');
          break;
        case 'f':
          event.preventDefault();
          const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]') as HTMLInputElement;
          if (searchInput) {
            focusManager.focus(searchInput);
          }
          break;
      }
    }
  }, [role, keyboardNavigation, trapFocus, focusManager, announcer]);

  // Handle focus events
  const onFocus = useCallback((event: React.FocusEvent) => {
    setIsFocused(true);
    setHasFocus(true);
    
    if (announceChanges && screenReader) {
      const element = event.target as HTMLElement;
      const accessibleName = element.getAttribute('aria-label') || 
                           element.getAttribute('aria-labelledby') ||
                           element.textContent?.trim() ||
                           element.getAttribute('title');
      
      if (accessibleName) {
        announcer.announce(accessibleName);
      }
    }

    logger.info('[useAccessibility] Element focused:', event.target);
  }, [announceChanges, screenReader, announcer]);

  // Handle blur events
  const onBlur = useCallback((event: React.FocusEvent) => {
    setIsFocused(false);
    setHasFocus(false);
    
    logger.info('[useAccessibility] Element blurred:', event.target);
  }, []);

  // Focus management functions
  const focus = useCallback(() => {
    if (elementRef.current) {
      focusManager.focus(elementRef.current);
    }
  }, [focusManager]);

  const focusNext = useCallback(() => {
    const nextElement = focusManager.getNextFocusable(elementRef.current || undefined);
    if (nextElement) {
      focusManager.focus(nextElement);
    }
  }, [focusManager]);

  const focusPrevious = useCallback(() => {
    const previousElement = focusManager.getPreviousFocusable(elementRef.current || undefined);
    if (previousElement) {
      focusManager.focus(previousElement);
    }
  }, [focusManager]);

  // Announcement functions
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (screenReader) {
      announcer.announce(message, priority);
    }
  }, [screenReader, announcer]);

  const announceError = useCallback((message: string) => {
    if (screenReader) {
      announcer.announceError(message);
    }
  }, [screenReader, announcer]);

  const announceSuccess = useCallback((message: string) => {
    if (screenReader) {
      announcer.announceSuccess(message);
    }
  }, [screenReader, announcer]);

  // Setup focus trap
  useEffect(() => {
    if (trapFocus && elementRef.current) {
      focusManager.trapFocus(elementRef.current);
      
      return () => {
        focusManager.releaseFocusTrap(elementRef.current!);
      };
    }
  }, [trapFocus, focusManager]);

  // Detect keyboard user
  useEffect(() => {
    const handleMouseDown = () => setIsKeyboardUser(false);
    const handleKeyDown = () => setIsKeyboardUser(true);

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return {
    ariaProps,
    onKeyDown,
    onFocus,
    onBlur,
    focus,
    focusNext,
    focusPrevious,
    announce,
    announceError,
    announceSuccess,
    isFocused,
    isKeyboardUser,
    hasFocus
  };
};

// Hook for ARIA labels
export const useARIALabel = (label: string, description?: string) => {
  const [labelId] = useState(() => `label-${Math.random().toString(36).substr(2, 9)}`);
  const [descriptionId] = useState(() => `desc-${Math.random().toString(36).substr(2, 9)}`);

  const ariaProps = {
    [ARIA_PROPERTIES.LABELLEDBY]: labelId,
    ...(description && { [ARIA_PROPERTIES.DESCRIBEDBY]: descriptionId })
  };

  const labelElement = (
    <span id={labelId} className="sr-only">
      {label}
    </span>
  );

  const descriptionElement = description ? (
    <span id={descriptionId} className="sr-only">
      {description}
    </span>
  ) : null;

  return {
    ariaProps,
    labelElement,
    descriptionElement
  };
};

// Hook for keyboard navigation
export const useKeyboardNavigation = (items: any[], onSelect: (item: any, index: number) => void) => {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case KEYBOARD_KEYS.ARROW_DOWN:
        event.preventDefault();
        setSelectedIndex(prev => (prev + 1) % items.length);
        break;

      case KEYBOARD_KEYS.ARROW_UP:
        event.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? items.length - 1 : prev - 1);
        break;

      case KEYBOARD_KEYS.ENTER:
      case KEYBOARD_KEYS.SPACE:
        event.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          onSelect(items[selectedIndex], selectedIndex);
        }
        break;

      case KEYBOARD_KEYS.ESCAPE:
        event.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;

      case KEYBOARD_KEYS.HOME:
        event.preventDefault();
        setSelectedIndex(0);
        break;

      case KEYBOARD_KEYS.END:
        event.preventDefault();
        setSelectedIndex(items.length - 1);
        break;
    }
  }, [items, selectedIndex, onSelect]);

  const selectItem = useCallback((index: number) => {
    setSelectedIndex(index);
    if (index >= 0 && index < items.length) {
      onSelect(items[index], index);
    }
  }, [items, onSelect]);

  return {
    selectedIndex,
    isOpen,
    setIsOpen,
    handleKeyDown,
    selectItem
  };
};

// Hook for focus management
export const useFocusManagement = () => {
  const focusManager = getFocusManager();
  const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null);

  const focus = useCallback((element: HTMLElement) => {
    focusManager.focus(element);
    setFocusedElement(element);
  }, [focusManager]);

  const focusNext = useCallback(() => {
    const nextElement = focusManager.getNextFocusable(focusedElement || undefined);
    if (nextElement) {
      focus(nextElement);
    }
  }, [focusManager, focusedElement, focus]);

  const focusPrevious = useCallback(() => {
    const previousElement = focusManager.getPreviousFocusable(focusedElement || undefined);
    if (previousElement) {
      focus(previousElement);
    }
  }, [focusManager, focusedElement, focus]);

  const trapFocus = useCallback((container: HTMLElement) => {
    focusManager.trapFocus(container);
  }, [focusManager]);

  const releaseFocusTrap = useCallback((container: HTMLElement) => {
    focusManager.releaseFocusTrap(container);
  }, [focusManager]);

  return {
    focusedElement,
    focus,
    focusNext,
    focusPrevious,
    trapFocus,
    releaseFocusTrap
  };
};

export default useAccessibility;
