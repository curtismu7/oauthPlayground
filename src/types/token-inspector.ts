export interface ClaimEntry {
	key: string;
	value: unknown;
	isJson: boolean;
}

export interface ThemeType {
	colors: {
		primary: string;
		secondary: string;
		success: string;
		danger: string;
		warning: string;
		info: string;
		light: string;
		dark: string;
		white: string;
		gray100: string;
		gray200: string;
		gray300: string;
		gray400: string;
		gray500: string;
		gray600: string;
		gray700: string;
		gray800: string;
		gray900: string;
		[key: string]: string;
	};
	fonts: {
		body: string;
		monospace: string;
	};
	spacing: {
		xs: string;
		sm: string;
		md: string;
		lg: string;
		xl: string;
	};
	borderRadius: {
		sm: string;
		md: string;
		lg: string;
	};
	shadows: {
		sm: string;
		md: string;
		lg: string;
		xl: string;
		[key: string]: string;
	};
	breakpoints: {
		sm: string;
		md: string;
		lg: string;
		xl: string;
		[key: string]: string;
	};
}

export const defaultTheme: ThemeType = {
	colors: {
		primary: '#007bff',
		secondary: '#6c757d',
		success: '#28a745',
		danger: '#dc3545',
		warning: '#ffc107',
		info: '#17a2b8',
		light: '#f8f9fa',
		dark: '#343a40',
		white: '#ffffff',
		gray100: '#f8f9fa',
		gray200: '#e9ecef',
		gray300: '#dee2e6',
		gray400: '#ced4da',
		gray500: '#adb5bd',
		gray600: '#6c757d',
		gray700: '#495057',
		gray800: '#343a40',
		gray900: '#212529',
	},
	fonts: {
		body: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
		monospace:
			'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
	},
	spacing: {
		xs: '0.25rem',
		sm: '0.5rem',
		md: '1rem',
		lg: '1.5rem',
		xl: '3rem',
	},
	borderRadius: {
		sm: '0.2rem',
		md: '0.25rem',
		lg: '0.3rem',
	},
	shadows: {
		sm: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
		md: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
		lg: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
		xl: '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)',
	},
	breakpoints: {
		sm: '576px',
		md: '768px',
		lg: '992px',
		xl: '1200px',
	},
};
