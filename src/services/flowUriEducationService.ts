import { callbackUriService } from './callbackUriService';

export interface FlowUriEducationEntry {
	flowType: string;
	title: string;
	specification: string;
	requiresRedirectUri: boolean;
	requiresLogoutUri: boolean;
	redirectUri: string;
	logoutUri: string;
	defaultRedirectUri: string;
	defaultLogoutUri: string;
	note: string;
	logoutNote: string;
}

type GetEntriesOptions = {
	/**
	 * When provided, entries that match or relate to the flowType will be returned first.
	 */
	focusFlowType?: string;
	/**
	 * When true, filters out flows that do not require redirect URIs.
	 */
	requireRedirectOnly?: boolean;
};

const normaliseFlowType = (value?: string) => {
	if (!value) return undefined;
	return value.toLowerCase();
};

const matchesFlowType = (candidate: string, focus?: string) => {
	if (!focus) return false;
	const normalisedCandidate = normaliseFlowType(candidate);
	const normalisedFocus = normaliseFlowType(focus);

	if (!normalisedCandidate || !normalisedFocus) return false;

	// Allow partial matches so implicit-flow-v8 will match implicit
	return (
		normalisedCandidate === normalisedFocus ||
		normalisedCandidate.includes(normalisedFocus) ||
		normalisedFocus.includes(normalisedCandidate)
	);
};

const buildEntry = (
	catalogItem: ReturnType<typeof callbackUriService.getRedirectUriCatalog>[number]
): FlowUriEducationEntry => {
	const detail = callbackUriService.getCallbackUriForFlow(catalogItem.flowType);
	const requiresLogoutUri = determineLogoutRequirement(catalogItem.flowType);

	return {
		flowType: catalogItem.flowType,
		title: detail.description || catalogItem.description,
		specification: catalogItem.specification,
		requiresRedirectUri: catalogItem.requiresRedirectUri,
		requiresLogoutUri,
		redirectUri: catalogItem.redirectUri,
		logoutUri: catalogItem.logoutUri,
		defaultRedirectUri: catalogItem.defaultRedirectUri,
		defaultLogoutUri: catalogItem.defaultLogoutUri,
		note: detail.note,
		logoutNote: detail.logoutNote,
	};
};

const determineLogoutRequirement = (flowType: string): boolean => {
	const normalized = normaliseFlowType(flowType) ?? '';

	if (
		normalized.includes('client-credentials') ||
		normalized.includes('worker-token') ||
		normalized.includes('device') ||
		normalized.includes('jwt-bearer') ||
		normalized.includes('saml-bearer') ||
		normalized.includes('redirectless')
	) {
		return false;
	}

	return true;
};

class FlowUriEducationService {
	private getAllEntries(): FlowUriEducationEntry[] {
		const catalog = callbackUriService.getRedirectUriCatalog();
		return catalog.map(buildEntry);
	}

	getEntries(options: GetEntriesOptions = {}): FlowUriEducationEntry[] {
		const { focusFlowType, requireRedirectOnly } = options;
		const allEntries = this.getAllEntries();

		const filtered = requireRedirectOnly
			? allEntries.filter((entry) => entry.requiresRedirectUri)
			: allEntries;

		if (!focusFlowType) {
			return filtered;
		}

		const matches: FlowUriEducationEntry[] = [];
		const others: FlowUriEducationEntry[] = [];

		filtered.forEach((entry) => {
			if (matchesFlowType(entry.flowType, focusFlowType)) {
				matches.push(entry);
			} else {
				others.push(entry);
			}
		});

		return [...matches, ...others];
	}

	getEntryForFlow(flowType: string): FlowUriEducationEntry | undefined {
		const all = this.getAllEntries();
		return all.find((entry) => matchesFlowType(entry.flowType, flowType));
	}

	getEducationBlurb(flowType?: string): string {
		const entry = flowType ? this.getEntryForFlow(flowType) : undefined;

		if (entry) {
			return `Add the following Redirect and Logout URIs for ${entry.title} into the PingOne application configuration. These URIs must be whitelisted before attempting the flow.`;
		}

		return 'Each flow requires specific Redirect and Logout URIs to be registered inside your PingOne application. Use the table below to identify and copy the correct values.';
	}
}

export const flowUriEducationService = new FlowUriEducationService();

export type { GetEntriesOptions as FlowUriEducationOptions };
