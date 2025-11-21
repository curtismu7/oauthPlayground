// src/services/networkStatusService.ts
// Network Status Service

export interface NetworkStatus {
	online: boolean;
	connectionType?: string;
	effectiveType?: string;
	downlink?: number;
	rtt?: number;
}

class NetworkStatusService {
	private static listeners: ((status: NetworkStatus) => void)[] = [];
	private static currentStatus: NetworkStatus = {
		online: navigator.onLine,
		connectionType: 'unknown',
	};

	static initialize() {
		// Listen for online/offline events
		window.addEventListener('online', NetworkStatusService.handleOnline.bind(NetworkStatusService));
		window.addEventListener(
			'offline',
			NetworkStatusService.handleOffline.bind(NetworkStatusService)
		);

		console.log('[NetworkStatusService] Initialized');
	}

	static getNetworkStatus(): NetworkStatus {
		return { ...NetworkStatusService.currentStatus };
	}

	static addStatusListener(callback: (status: NetworkStatus) => void) {
		NetworkStatusService.listeners.push(callback);
	}

	static removeStatusListener(callback: (status: NetworkStatus) => void) {
		const index = NetworkStatusService.listeners.indexOf(callback);
		if (index > -1) {
			NetworkStatusService.listeners.splice(index, 1);
		}
	}

	static addNetworkStatusListener(callback: (status: NetworkStatus) => void) {
		NetworkStatusService.addStatusListener(callback);
	}

	static removeNetworkStatusListener(callback: (status: NetworkStatus) => void) {
		NetworkStatusService.removeStatusListener(callback);
	}

	private static handleOnline() {
		NetworkStatusService.currentStatus = { ...NetworkStatusService.currentStatus, online: true };
		NetworkStatusService.notifyListeners();
	}

	private static handleOffline() {
		NetworkStatusService.currentStatus = { ...NetworkStatusService.currentStatus, online: false };
		NetworkStatusService.notifyListeners();
	}

	private static notifyListeners() {
		NetworkStatusService.listeners.forEach((listener) => {
			try {
				listener(NetworkStatusService.currentStatus);
			} catch (error) {
				console.error('[NetworkStatusService] Error in status listener:', error);
			}
		});
	}
}

export default NetworkStatusService;
