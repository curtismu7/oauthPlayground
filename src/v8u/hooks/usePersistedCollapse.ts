/**
 * @file usePersistedCollapse.ts
 * @module v8u/hooks
 * @description Hook for persisting section collapse/expand state in Unified OAuth flow.
 * Survives flow restart and browser refresh via FlowSettingsServiceV8U localStorage.
 */

import { useCallback, useEffect, useState } from 'react';
import type { FlowType } from '@/v8/services/specVersionServiceV8';
import { loadSettings, saveSettings } from '@/v8u/services/flowSettingsServiceV8U';

/**
 * Returns [collapsed, setCollapsed] with persistence. State is saved to localStorage
 * per flowType + sectionId so it survives refresh and flow restart.
 */
export function usePersistedCollapse(
	flowType: FlowType,
	sectionId: string,
	defaultCollapsed: boolean
): [boolean, (collapsed: boolean) => void] {
	const [collapsed, setCollapsedState] = useState(() => {
		const s = loadSettings(flowType);
		if (sectionId === 'credentials' || sectionId === 'worker-token-status') {
			const val =
				sectionId === 'credentials' ? s?.credentialsCollapsed : s?.workerTokenStatusCollapsed;
			return val ?? defaultCollapsed;
		}
		return s?.sectionCollapsed?.[sectionId] ?? defaultCollapsed;
	});

	// Sync from storage when flowType or sectionId changes (e.g. user switched flows)
	useEffect(() => {
		const s = loadSettings(flowType);
		let stored: boolean | undefined;
		if (sectionId === 'credentials') {
			stored = s?.credentialsCollapsed;
		} else if (sectionId === 'worker-token-status') {
			stored = s?.workerTokenStatusCollapsed;
		} else {
			stored = s?.sectionCollapsed?.[sectionId];
		}
		if (stored !== undefined) {
			setCollapsedState(stored);
		}
	}, [flowType, sectionId]);

	const setCollapsed = useCallback(
		(val: boolean) => {
			setCollapsedState(val);
			const existing = loadSettings(flowType);
			const updates: Record<string, unknown> = {};
			if (sectionId === 'credentials') {
				updates.credentialsCollapsed = val;
			} else if (sectionId === 'worker-token-status') {
				updates.workerTokenStatusCollapsed = val;
			} else {
				updates.sectionCollapsed = {
					...(existing?.sectionCollapsed || {}),
					[sectionId]: val,
				};
			}
			saveSettings(flowType, updates as Parameters<typeof saveSettings>[1]);
		},
		[flowType, sectionId]
	);

	return [collapsed, setCollapsed];
}
