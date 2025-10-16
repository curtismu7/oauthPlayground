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
    connectionType: 'unknown'
  };

  static initialize() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    console.log('[NetworkStatusService] Initialized');
  }

  static getNetworkStatus(): NetworkStatus {
    return { ...this.currentStatus };
  }

  static addStatusListener(callback: (status: NetworkStatus) => void) {
    this.listeners.push(callback);
  }

  static removeStatusListener(callback: (status: NetworkStatus) => void) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  static addNetworkStatusListener(callback: (status: NetworkStatus) => void) {
    this.addStatusListener(callback);
  }

  static removeNetworkStatusListener(callback: (status: NetworkStatus) => void) {
    this.removeStatusListener(callback);
  }

  private static handleOnline() {
    this.currentStatus = { ...this.currentStatus, online: true };
    this.notifyListeners();
  }

  private static handleOffline() {
    this.currentStatus = { ...this.currentStatus, online: false };
    this.notifyListeners();
  }

  private static notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentStatus);
      } catch (error) {
        console.error('[NetworkStatusService] Error in status listener:', error);
      }
    });
  }
}

export default NetworkStatusService;