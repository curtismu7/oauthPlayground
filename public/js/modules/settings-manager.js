/**
 * @fileoverview Settings Manager Class
 * 
 * Manages application settings with secure storage and encryption.
 * Handles API credentials, user preferences, and configuration data
 * with automatic encryption for sensitive information.
 * 
 * @param {Object} logger - Winston logger instance for debugging
 */
import { createWinstonLogger } from './winston-logger.js';
import { CryptoUtils } from './crypto-utils.js';

class SettingsManager {
    constructor(logger = null) {
        // Initialize settings with default values
        this.settings = this.getDefaultSettings();
        this.storageKey = 'pingone-import-settings';
        this.crypto = new CryptoUtils();
        this.encryptionKey = null;
        
        // Initialize Winston logger for debugging and error reporting
        this.initializeLogger(logger);
        
        // Encryption will be initialized in the init method
        this.encryptionInitialized = false;
    }
    
    /**
     * Initialize the settings manager
     */
    async init() {
        try {
            await this.initializeEncryption();
            this.encryptionInitialized = true;
            this.logger.info('Settings manager initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize settings manager', { error: error.message });
            throw error;
        }
    }
    
    /**
     * Initialize Winston logger
     */
    initializeLogger(logger) {
        if (logger) {
            this.logger = logger.child({ component: 'settings-manager' });
        } else {
            this.logger = createWinstonLogger({
                service: 'pingone-import-settings',
                environment: process.env.NODE_ENV || 'development'
            });
        }
    }
    
    /**
     * Create a default console logger if none provided
     */
    createDefaultLogger() {
        return {
            log: (msg, level = 'info') => this.logger.log(level, `[Settings] ${msg}`),
            info: (msg) => this.logger.info(`[Settings] ${msg}`),
            warn: (msg) => this.logger.warn(`[Settings] ${msg}`),
            error: (msg) => this.logger.error(`[Settings] ${msg}`),
            debug: (msg) => this.logger.debug(`[Settings] ${msg}`)
        };
    }
    
    /**
     * Get default settings
     */
    getDefaultSettings() {
        return {
            environmentId: '',
            region: 'NorthAmerica',
            apiClientId: '',
            populationId: '',
            rateLimit: 50,
            connectionStatus: 'disconnected',
            connectionMessage: 'Not connected',
            lastConnectionTest: null,
            autoSave: true,
            lastUsedDirectory: '',
            theme: 'light',
            pageSize: 50,
            showNotifications: true
        };
    }
    
    /**
     * Load settings from storage
     */
    async loadSettings() {
        try {
            if (!this.encryptionInitialized) {
                this.logger.warn('Encryption not initialized, loading settings without decryption');
                return this.settings;
            }
            
            const storedData = localStorage.getItem(this.storageKey);
            if (!storedData) {
                this.logger.info('No stored settings found, using defaults');
                return this.settings;
            }
            
            const decryptedData = await this.crypto.decrypt(storedData, this.encryptionKey);
            const parsedSettings = JSON.parse(decryptedData);
            
            // Merge with defaults to ensure all properties exist
            this.settings = { ...this.getDefaultSettings(), ...parsedSettings };
            
            this.logger.info('Settings loaded successfully', {
                hasEnvironmentId: !!this.settings.environmentId,
                hasApiClientId: !!this.settings.apiClientId,
                region: this.settings.region
            });
            
            return this.settings;
        } catch (error) {
            this.logger.error('Failed to load settings', { error: error.message });
            // Return default settings on error
            return this.settings;
        }
    }
    
    /**
     * Save settings to storage
     */
    async saveSettings(settings = null) {
        try {
            if (settings) {
                this.settings = { ...this.settings, ...settings };
            }
            
            if (!this.encryptionInitialized) {
                this.logger.warn('Encryption not initialized, saving settings without encryption');
                localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
                return;
            }
            
            const jsonData = JSON.stringify(this.settings);
            const encryptedData = await this.crypto.encrypt(jsonData, this.encryptionKey);
            localStorage.setItem(this.storageKey, encryptedData);
            
            this.logger.info('Settings saved successfully', {
                hasEnvironmentId: !!this.settings.environmentId,
                hasApiClientId: !!this.settings.apiClientId,
                region: this.settings.region
            });
        } catch (error) {
            this.logger.error('Failed to save settings', { error: error.message });
            throw error;
        }
    }
    
    /**
     * Get a specific setting
     */
    getSetting(key) {
        return this.settings[key];
    }
    
    /**
     * Set a specific setting
     */
    async setSetting(key, value) {
        try {
            this.settings[key] = value;
            await this.saveSettings();
            
            this.logger.debug('Setting updated', { key, value: typeof value === 'string' ? value : '[object]' });
        } catch (error) {
            this.logger.error('Failed to update setting', { key, error: error.message });
            throw error;
        }
    }
    
    /**
     * Get all settings
     */
    getAllSettings() {
        return { ...this.settings };
    }
    
    /**
     * Update multiple settings at once
     */
    async updateSettings(newSettings) {
        try {
            this.settings = { ...this.settings, ...newSettings };
            await this.saveSettings();
            
            this.logger.info('Multiple settings updated', {
                updatedKeys: Object.keys(newSettings),
                hasEnvironmentId: !!this.settings.environmentId,
                hasApiClientId: !!this.settings.apiClientId
            });
        } catch (error) {
            this.logger.error('Failed to update settings', { error: error.message });
            throw error;
        }
    }
    
    /**
     * Reset settings to defaults
     */
    async resetSettings() {
        try {
            this.settings = this.getDefaultSettings();
            await this.saveSettings();
            
            this.logger.info('Settings reset to defaults');
        } catch (error) {
            this.logger.error('Failed to reset settings', { error: error.message });
            throw error;
        }
    }
    
    /**
     * Clear all settings
     */
    async clearSettings() {
        try {
            localStorage.removeItem(this.storageKey);
            this.settings = this.getDefaultSettings();
            
            this.logger.info('Settings cleared');
        } catch (error) {
            this.logger.error('Failed to clear settings', { error: error.message });
            throw error;
        }
    }
    
    /**
     * Initialize encryption with a key derived from browser and user-specific data
     */
    async initializeEncryption() {
        try {
            const deviceId = await this.getDeviceId();
            this.encryptionKey = await CryptoUtils.generateKey(deviceId);
            
            this.logger.debug('Encryption initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize encryption', { error: error.message });
            // Fallback to a less secure but functional approach
            this.encryptionKey = await CryptoUtils.generateKey('fallback-encryption-key');
            this.logger.warn('Using fallback encryption key');
        }
    }
    
    /**
     * Generate a device ID based on browser and system information
     * @returns {Promise<string>} A unique device ID
     */
    async getDeviceId() {
        try {
            // Try to get a stored device ID first
            if (this.isLocalStorageAvailable()) {
                const storedDeviceId = localStorage.getItem('pingone-device-id');
                if (storedDeviceId) {
                    return storedDeviceId;
                }
            }

            // Generate a new device ID based on stable browser characteristics
            const navigatorInfo = {
                platform: navigator.platform,
                hardwareConcurrency: navigator.hardwareConcurrency,
                language: navigator.language,
                userAgent: navigator.userAgent
            };
            
            const deviceId = await CryptoUtils.generateKey(JSON.stringify(navigatorInfo));
            
            // Store the device ID for future use
            if (this.isLocalStorageAvailable()) {
                localStorage.setItem('pingone-device-id', deviceId);
            }
            
            this.logger.debug('Device ID generated', { deviceId: deviceId.substring(0, 8) + '...' });
            return deviceId;
        } catch (error) {
            this.logger.error('Failed to generate device ID', { error: error.message });
            throw error;
        }
    }
    
    /**
     * Check if localStorage is available
     */
    isLocalStorageAvailable() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            this.logger.warn('localStorage not available', { error: error.message });
            return false;
        }
    }
    
    /**
     * Export settings (for backup)
     */
    async exportSettings() {
        try {
            const exportData = {
                settings: this.settings,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
            
            this.logger.info('Settings exported', { exportDate: exportData.exportDate });
            return exportData;
        } catch (error) {
            this.logger.error('Failed to export settings', { error: error.message });
            throw error;
        }
    }
    
    /**
     * Import settings (from backup)
     */
    async importSettings(importData) {
        try {
            if (!importData.settings) {
                throw new Error('Invalid import data: missing settings');
            }
            
            this.settings = { ...this.getDefaultSettings(), ...importData.settings };
            await this.saveSettings();
            
            this.logger.info('Settings imported successfully', {
                importDate: importData.exportDate,
                hasEnvironmentId: !!this.settings.environmentId,
                hasApiClientId: !!this.settings.apiClientId
            });
        } catch (error) {
            this.logger.error('Failed to import settings', { error: error.message });
            throw error;
        }
    }
}

// Export the SettingsManager class
export { SettingsManager };
