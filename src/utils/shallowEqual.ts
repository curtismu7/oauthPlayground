// src/utils/shallowEqual.ts
// ⭐ V6 UTILITY - Utility for shallow equality comparison to prevent unnecessary re-renders
// Used in: PingOneApplicationConfig, any component needing to prevent infinite loops
// Created: 2025-10-07 - Part of V6 React "Maximum update depth exceeded" fixes

/**
 * Performs a shallow equality check between two values
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns true if values are shallowly equal, false otherwise
 */
export function shallowEqual(a: any, b: any): boolean {
  // Same reference
  if (a === b) return true;
  
  // Null/undefined check
  if (!a || !b) return false;
  
  // Type check
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  
  // Array check
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  // Key comparison
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  
  if (ka.length !== kb.length) return false;
  
  // Value comparison
  for (const k of ka) {
    if (a[k] !== b[k]) return false;
  }
  
  return true;
}

/**
 * Helper to set state only if the value has changed (shallow comparison)
 * @param setter - State setter function
 * @param next - Next value to set
 */
export function setIfChanged<T>(
  setter: (updater: (prev: T) => T) => void,
  next: T
): void {
  setter(prev => (shallowEqual(prev, next) ? prev : next));
}

