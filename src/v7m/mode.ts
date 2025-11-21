// src/v7m/mode.ts
// Lightweight selector for enabling/disabling V7M mock mode for V7 flows.

const STORAGE_KEY = 'v7m:mode';

export type V7MMode = 'off' | 'on';

export function getV7MMode(): V7MMode {
	if (typeof window === 'undefined') return 'off';
	const v = window.localStorage.getItem(STORAGE_KEY);
	return (v as V7MMode) === 'on' ? 'on' : 'off';
}

export function setV7MMode(mode: V7MMode): void {
	if (typeof window === 'undefined') return;
	window.localStorage.setItem(STORAGE_KEY, mode);
}

export function isV7MEnabled(): boolean {
	return getV7MMode() === 'on';
}
