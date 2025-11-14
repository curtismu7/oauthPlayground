import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import App from './App';
import { GlobalStyle, theme } from './styles/global';

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
