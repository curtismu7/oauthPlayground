import 'styled-components';

declare module 'styled-components' {
	export interface DefaultTheme {
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
}
