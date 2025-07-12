// ElementRegistry: Centralized DOM element lookup utility
// Provides safe, memoized access to all required UI elements with logging for missing elements
// Usage: import { ElementRegistry } from './element-registry.js';

const elementCache = {};

function getElement(selector, description, required = true) {
  if (elementCache[selector]) return elementCache[selector];
  const el = document.querySelector(selector);
  if (!el && required) {
    console.warn(`[ElementRegistry] Missing required element: ${description} (${selector})`);
  } else if (!el) {
    console.info(`[ElementRegistry] Optional element not found: ${description} (${selector})`);
  }
  elementCache[selector] = el;
  return el;
}

export const ElementRegistry = {
  // Main UI elements (add more as needed)
  importButton: () => getElement('#import-btn', 'Import Button'),
  fileInput: () => getElement('#file-input', 'File Input'),
  statusBar: () => getElement('#status-bar', 'Status Bar'),
  dashboardTab: () => getElement('#dashboard-tab', 'Dashboard Tab'),
  dragDropArea: () => getElement('#drag-drop-area', 'Drag-and-Drop Area', false),
  // Add all other required selectors here, e.g.:
  // userTable: () => getElement('#user-table', 'User Table'),
  // settingsForm: () => getElement('#settings-form', 'Settings Form'),
  // ...
}; 