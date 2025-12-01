// src/services/apiCallTrackerService.ts
// Service to track all API calls made to PingOne for educational display

export interface ApiCall {
	id: string;
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	url: string;
	actualPingOneUrl?: string; // The actual PingOne API URL that will be called (for proxy endpoints)
	headers?: Record<string, string>;
	body?: string | object | null;
	queryParams?: Record<string, string>;
	response?: {
		status: number;
		statusText: string;
		headers?: Record<string, string>;
		data?: unknown;
		error?: string;
	};
	timestamp: Date;
	duration?: number; // milliseconds
	step?: string; // Optional step identifier
	flowType?: string; // Optional flow type identifier
}

class ApiCallTrackerService {
	private apiCalls: ApiCall[] = [];
	private subscribers: Set<(calls: ApiCall[]) => void> = new Set();
	private maxCalls = 100; // Limit to prevent memory issues

	/**
	 * Track an API call
	 */
	trackApiCall(call: Omit<ApiCall, 'id' | 'timestamp'>): string {
		const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const apiCall: ApiCall = {
			...call,
			id,
			timestamp: new Date(),
		};

		this.apiCalls.unshift(apiCall); // Add to beginning (newest first)

		// Limit the number of stored calls
		if (this.apiCalls.length > this.maxCalls) {
			this.apiCalls = this.apiCalls.slice(0, this.maxCalls);
		}

		// Notify subscribers
		this.notifySubscribers();

		return id;
	}

	/**
	 * Update an API call with response data
	 */
	updateApiCallResponse(id: string, response: ApiCall['response'], duration?: number): void {
		const call = this.apiCalls.find((c) => c.id === id);
		if (call) {
			call.response = response || undefined;
			if (duration !== undefined) {
				call.duration = duration;
			}
			this.notifySubscribers();
		}
	}

	/**
	 * Get all API calls
	 */
	getApiCalls(): ApiCall[] {
		return [...this.apiCalls];
	}

	/**
	 * Clear all API calls
	 */
	clearApiCalls(): void {
		this.apiCalls = [];
		this.notifySubscribers();
	}

	/**
	 * Subscribe to API call updates
	 */
	subscribe(callback: (calls: ApiCall[]) => void): () => void {
		this.subscribers.add(callback);
		return () => {
			this.subscribers.delete(callback);
		};
	}

	/**
	 * Notify all subscribers
	 */
	private notifySubscribers(): void {
		const calls = this.getApiCalls();
		this.subscribers.forEach((callback) => {
			callback(calls);
		});
	}
}

// Export singleton instance
export const apiCallTrackerService = new ApiCallTrackerService();
export default apiCallTrackerService;
