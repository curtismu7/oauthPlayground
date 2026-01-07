import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import App from './App';
import { GlobalStyle, theme } from './styles/global';

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

ReactDOM.createRoot(document.getElementById('root')).render(
	<React.StrictMode>
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
	</React.StrictMode>
);
