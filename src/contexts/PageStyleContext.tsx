import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface PageStyle {
	titleBackgroundColor: string;
	titleTextColor: string;
	accentColor: string;
}

interface PageStyleContextType {
	currentPageStyle: PageStyle;
	setPageStyle: (style: Partial<PageStyle>) => void;
}

const defaultPageStyle: PageStyle = {
	titleBackgroundColor: '#0070cc',
	titleTextColor: '#ffffff',
	accentColor: '#0056b3',
};

// Page-specific styles
const pageStyles: Record<string, PageStyle> = {
	'/dashboard': {
		titleBackgroundColor: '#0070cc',
		titleTextColor: '#ffffff',
		accentColor: '#0056b3',
	},
	'/flows/authorization-code': {
		titleBackgroundColor: '#059669',
		titleTextColor: '#ffffff',
		accentColor: '#047857',
	},
	'/flows/implicit': {
		titleBackgroundColor: '#dc2626',
		titleTextColor: '#ffffff',
		accentColor: '#b91c1c',
	},
	'/flows/client-credentials': {
		titleBackgroundColor: '#0369a1',
		titleTextColor: '#ffffff',
		accentColor: '#075985',
	},
	'/flows/pkce': {
		titleBackgroundColor: '#0891b2',
		titleTextColor: '#ffffff',
		accentColor: '#0e7490',
	},
	'/flows/device-code': {
		titleBackgroundColor: '#ea580c',
		titleTextColor: '#ffffff',
		accentColor: '#c2410c',
	},
	'/oidc/userinfo': {
		titleBackgroundColor: '#16a34a',
		titleTextColor: '#ffffff',
		accentColor: '#15803d',
	},
	'/oidc/id-tokens': {
		titleBackgroundColor: '#059669',
		titleTextColor: '#ffffff',
		accentColor: '#047857',
	},
	'/oauth-2-1': {
		titleBackgroundColor: '#dc2626',
		titleTextColor: '#ffffff',
		accentColor: '#b91c1c',
	},
	'/oidc-session-management': {
		titleBackgroundColor: '#dc2626',
		titleTextColor: '#ffffff',
		accentColor: '#b91c1c',
	},
	'/token-management': {
		titleBackgroundColor: '#0891b2',
		titleTextColor: '#ffffff',
		accentColor: '#0e7490',
	},
	'/configuration': {
		titleBackgroundColor: '#475569',
		titleTextColor: '#ffffff',
		accentColor: '#334155',
	},
	'/documentation': {
		titleBackgroundColor: '#dc2626',
		titleTextColor: '#ffffff',
		accentColor: '#b91c1c',
	},
	'/documentation/mcp': {
		titleBackgroundColor: '#6366f1',
		titleTextColor: '#ffffff',
		accentColor: '#4f46e5',
	},
	'/documentation/oidc-overview': {
		titleBackgroundColor: '#dc2626',
		titleTextColor: '#ffffff',
		accentColor: '#b91c1c',
	},
	'/docs/oauth2-security-best-practices': {
		titleBackgroundColor: '#dc2626',
		titleTextColor: '#ffffff',
		accentColor: '#b91c1c',
	},
	'/comprehensive-oauth-education': {
		titleBackgroundColor: '#dc2626',
		titleTextColor: '#ffffff',
		accentColor: '#b91c1c',
	},
	'/v9/resources-api': {
		titleBackgroundColor: '#dc2626',
		titleTextColor: '#ffffff',
		accentColor: '#b91c1c',
	},
	'/flows/advanced-oauth-params-demo': {
		titleBackgroundColor: '#dc2626',
		titleTextColor: '#ffffff',
		accentColor: '#b91c1c',
	},
	'/par-vs-rar': {
		titleBackgroundColor: '#dc2626',
		titleTextColor: '#ffffff',
		accentColor: '#b91c1c',
	},
	'/ciba-vs-device-authz': {
		titleBackgroundColor: '#dc2626',
		titleTextColor: '#ffffff',
		accentColor: '#b91c1c',
	},
	'/pingone-scopes-reference': {
		titleBackgroundColor: '#dc2626',
		titleTextColor: '#ffffff',
		accentColor: '#b91c1c',
	},
	'/docs/oidc-specs': {
		titleBackgroundColor: '#dc2626',
		titleTextColor: '#ffffff',
		accentColor: '#b91c1c',
	},
	'/docs/spiffe-spire-pingone': {
		titleBackgroundColor: '#dc2626',
		titleTextColor: '#ffffff',
		accentColor: '#b91c1c',
	},
	'/pingone-mock-features': {
		titleBackgroundColor: '#dc2626',
		titleTextColor: '#ffffff',
		accentColor: '#b91c1c',
	},
	'/pingone-sessions-api': {
		titleBackgroundColor: '#dc2626',
		titleTextColor: '#ffffff',
		accentColor: '#b91c1c',
	},
	'/oidc': {
		titleBackgroundColor: '#dc2626',
		titleTextColor: '#ffffff',
		accentColor: '#b91c1c',
	},
	'/about': {
		titleBackgroundColor: '#dc2626',
		titleTextColor: '#ffffff',
		accentColor: '#b91c1c',
	},
	'/ai-overview': {
		titleBackgroundColor: '#7c2d12',
		titleTextColor: '#ffffff',
		accentColor: '#9a3412',
	},
	'/advanced-configuration': {
		titleBackgroundColor: '#374151',
		titleTextColor: '#ffffff',
		accentColor: '#1f2937',
	},
	'/tutorials': {
		titleBackgroundColor: '#166534',
		titleTextColor: '#ffffff',
		accentColor: '#14532d',
	},
};

const PageStyleContext = createContext<PageStyleContextType | undefined>(undefined);

export const usePageStyle = () => {
	const context = useContext(PageStyleContext);
	if (!context) {
		throw new Error('usePageStyle must be used within a PageStyleProvider');
	}
	return context;
};

interface PageStyleProviderProps {
	children: React.ReactNode;
}

export const PageStyleProvider: React.FC<PageStyleProviderProps> = ({ children }) => {
	const [currentPageStyle, setCurrentPageStyle] = useState<PageStyle>(defaultPageStyle);
	const location = useLocation();

	// Update page style when route changes
	useEffect(() => {
		const path = location.pathname;

		// Find exact match first
		if (pageStyles[path]) {
			setCurrentPageStyle(pageStyles[path]);
			return;
		}

		// Find partial matches for nested routes
		const matchingPath = Object.keys(pageStyles).find(
			(pagePath) => path.startsWith(pagePath) || path.includes(pagePath.split('/').pop() || '')
		);

		if (matchingPath) {
			setCurrentPageStyle(pageStyles[matchingPath]);
		} else {
			// Default style for unknown pages
			setCurrentPageStyle(defaultPageStyle);
		}
	}, [location.pathname]);

	const setPageStyle = (style: Partial<PageStyle>) => {
		setCurrentPageStyle((prev) => ({ ...prev, ...style }));
	};

	return (
		<PageStyleContext.Provider value={{ currentPageStyle, setPageStyle }}>
			{children}
		</PageStyleContext.Provider>
	);
};
