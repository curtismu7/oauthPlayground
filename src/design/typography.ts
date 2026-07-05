// src/design/typography.ts
//
// Typography recipe for the standard visual language. Body text uses the system
// sans stack; IBM Plex Mono is the SIGNATURE ACCENT — used for numeric badges,
// eyebrows/labels, and action buttons. Mono is never the body font.

export const fonts = {
	body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
	mono: "'IBM Plex Mono', monospace",
} as const;
