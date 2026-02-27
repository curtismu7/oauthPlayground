import './styles/vendor/end-user-nano.css';
import './styles/icons.css';
import './styles/nano-overrides.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import App from './App';
import { EducationPreferenceService } from './services/educationPreferenceService';
import { GlobalStyle, theme } from './styles/global';

// Make React available globally for vendor bundles and any scripts that might need it
// This must happen before any other code that might use React
if (typeof window !== 'undefined') {
	// Set React on window object
	(window as unknown as Record<string, unknown>).React = React;
	(window as unknown as Record<string, unknown>).ReactDOM = ReactDOM;

	// Expose EducationPreferenceService for testing
	(window as unknown as Record<string, unknown>).EducationPreferenceService =
		EducationPreferenceService;

	// Also make it available on globalThis for broader compatibility
	// Ensure globalThis exists before using it
	if (typeof globalThis !== 'undefined') {
		(globalThis as unknown as Record<string, unknown>).React = React;
		(globalThis as unknown as Record<string, unknown>).ReactDOM = ReactDOM;
	}

	// Ensure React.Children and React.Component are available
	// Add defensive checks to prevent "Cannot set properties of undefined" errors
	if (React && typeof React === 'object') {
		// Only set if the properties exist
		if (React.Children) {
			(window as unknown as Record<string, unknown>).ReactChildren = React.Children;
			if (typeof globalThis !== 'undefined') {
				(globalThis as unknown as Record<string, unknown>).ReactChildren = React.Children;
			}
		}
		if (React.Component) {
			(window as unknown as Record<string, unknown>).ReactComponent = React.Component;
			if (typeof globalThis !== 'undefined') {
				(globalThis as unknown as Record<string, unknown>).ReactComponent = React.Component;
			}
		}
	}
}

// Suppress defaultProps warnings from drag-and-drop libraries (library issue, not our code)
// These warnings are harmless but noisy - some libraries haven't been updated for React 18
const originalWarn = console.warn;
console.warn = (...args) => {
	if (
		typeof args[0] === 'string' &&
		(args[0].includes('Support for defaultProps will be removed from memo components') ||
			args[0].includes('Connect(Droppable)') ||
			args[0].includes('Connect(Draggable)') ||
			args[0].includes('Download the React DevTools'))
	) {
		// Suppress react-beautiful-dnd defaultProps warnings and React DevTools message
		return;
	}
	originalWarn.apply(console, args);
};

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

ReactDOM.createRoot(root).render(
	<BrowserRouter
		future={{
			v7_startTransition: true,
			v7_relativeSplatPath: true,
		}}
	>
		<ThemeProvider theme={theme}>
			<GlobalStyle />
			<App />
		</ThemeProvider>
	</BrowserRouter>
);
