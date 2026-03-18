// Polyfill Buffer for browser (Node.js API not available in browser by default)
import { Buffer } from 'buffer';

if (typeof globalThis !== 'undefined') {
	(globalThis as unknown as { Buffer?: typeof Buffer }).Buffer = Buffer;
}

// Suppress known external errors (WebSocket/HMR, browser autofill) as early as possible
import { suppressExternalErrors } from './utils/errorBoundaryUtils';

suppressExternalErrors();

import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/vendor/end-user-nano.css';
import './styles/icons.css';
import './styles/nano-overrides.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import App from './App';
import { initDomainCache } from './services/customDomainService';
import { EducationPreferenceService } from './services/educationPreferenceService';
import { initRegionCache } from './services/regionService';
import { GlobalStyle, theme } from './styles/global';

// Expose React globally for any third-party vendor bundles that expect window.React
// (Vite config maps the bare `React` identifier to window.React for vendor chunks)
if (typeof window !== 'undefined') {
	const w = window as unknown as Record<string, unknown>;
	w.React = React;
	w.ReactDOM = ReactDOM;
	// Expose EducationPreferenceService for testing
	w.EducationPreferenceService = EducationPreferenceService;
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

// Warm the domain and region caches from IndexedDB/SQLite before first render.
initDomainCache()
	.catch(() => {})
	.finally(() => {
		// Warm region cache in background — non-fatal if unavailable
		void initRegionCache().catch(() => {});
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
	});
