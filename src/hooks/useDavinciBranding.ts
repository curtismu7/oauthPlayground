import { useCallback, useEffect, useMemo, useState } from 'react';

export interface DavinciBranding {
	primaryColor?: string;
	secondaryColor?: string;
	headerBackgroundImage?: string;
	logoUrl?: string;
	wordmarkText?: string;
	wordmarkColor?: string;
	subtitleText?: string;
	subtitleColor?: string;
	logoBackgroundColor?: string;
	logoBorderColor?: string;
	contentBackground?: string;
	contentTextColor?: string;
	formAccentColor?: string;
	modalTitle?: string;
	updatedAt?: number;
	source?: string;
	extensionVersion?: string;
}

interface DavinciBrandingMessage {
	type: string;
	payload?: DavinciBranding;
	version?: string;
}

const DESIGN_STUDIO_URL = 'https://marketplace.pingone.com/item/davinci-design-studio';
const BRANDING_STORAGE_KEY = 'pingone.davinci.branding';
const MESSAGE_TYPE = 'PINGONE_DAVINCI_BRANDING';

const isBrowser = typeof window !== 'undefined';

const getInitialBranding = (): DavinciBranding | null => {
	if (!isBrowser) {
		return null;
	}

	try {
		const stored = window.localStorage.getItem(BRANDING_STORAGE_KEY);
		if (!stored) {
			return null;
		}

		const parsed = JSON.parse(stored) as DavinciBranding | undefined;
		if (parsed && typeof parsed === 'object') {
			return parsed;
		}
	} catch (error) {
		console.warn('[useDavinciBranding] Failed to parse stored branding payload', error);
	}

	return null;
};

const hasBrandingPayload = (
	payload: DavinciBranding | null | undefined
): payload is DavinciBranding => {
	if (!payload) {
		return false;
	}

	return Object.values(payload).some((value) => Boolean(value));
};

export const useDavinciBranding = () => {
	const [branding, setBranding] = useState<DavinciBranding | null>(() => getInitialBranding());

	const persistBranding = useCallback((payload: DavinciBranding | null) => {
		if (!isBrowser) {
			return;
		}

		if (!payload || !hasBrandingPayload(payload)) {
			window.localStorage.removeItem(BRANDING_STORAGE_KEY);
			setBranding(null);
			return;
		}

		const enrichedPayload: DavinciBranding = {
			...payload,
			updatedAt: Date.now(),
		};

		try {
			window.localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(enrichedPayload));
			setBranding(enrichedPayload);
		} catch (error) {
			console.warn('[useDavinciBranding] Failed to persist branding payload', error);
			setBranding(enrichedPayload);
		}
	}, []);

	useEffect(() => {
		if (!isBrowser) {
			return;
		}

		const handleMessage = (event: MessageEvent<unknown>) => {
			const data = event.data as DavinciBrandingMessage | undefined;
			if (!data || typeof data !== 'object') {
				return;
			}

			if (data.type !== MESSAGE_TYPE) {
				return;
			}

			if (data.payload && typeof data.payload === 'object') {
				persistBranding({
					...data.payload,
					source: event.origin,
					extensionVersion: data.version,
				});
				return;
			}

			// Empty payload indicates a reset
			persistBranding(null);
		};

		window.addEventListener('message', handleMessage);

		return () => {
			window.removeEventListener('message', handleMessage);
		};
	}, [persistBranding]);

	const clearBranding = useCallback(() => {
		persistBranding(null);
	}, [persistBranding]);

	const openDesignStudio = useCallback(() => {
		if (!isBrowser) {
			return;
		}

		window.open(DESIGN_STUDIO_URL, '_blank', 'noopener,noreferrer');
	}, []);

	const hasBranding = useMemo(() => hasBrandingPayload(branding), [branding]);

	return {
		branding,
		hasBranding,
		openDesignStudio,
		clearBranding,
		persistBranding,
	};
};
