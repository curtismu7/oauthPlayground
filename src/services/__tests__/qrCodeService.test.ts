// src/services/__tests__/qrCodeService.test.ts
// Tests for QRCodeService

import QRCodeService, { type TOTPConfig } from '../qrCodeService';

// Mock crypto and global functions
global.btoa = jest.fn((str: string) => Buffer.from(str).toString('base64'));
global.TextEncoder = jest.fn().mockImplementation(() => ({
	encode: jest.fn((str: string) => new Uint8Array(Buffer.from(str))),
}));

Object.defineProperty(global, 'crypto', {
	value: {
		getRandomValues: jest.fn((array: Uint8Array) => {
			for (let i = 0; i < array.length; i++) {
				array[i] = Math.floor(Math.random() * 256);
			}
			return array;
		}),
	},
});

describe('QRCodeService', () => {
	const validConfig: TOTPConfig = {
		secret: 'JBSWY3DPEHPK3PXP',
		issuer: 'OAuth Playground',
		accountName: 'test@example.com',
	};

	describe('generateTOTPQRCode', () => {
		it('should generate TOTP QR code successfully', async () => {
			const result = await QRCodeService.generateTOTPQRCode(validConfig);

			expect(result).toHaveProperty('qrCodeDataUrl');
			expect(result).toHaveProperty('totpUri');
			expect(result).toHaveProperty('manualEntryKey');
			expect(result).toHaveProperty('backupCodes');

			expect(result.qrCodeDataUrl).toMatch(/^data:image\/svg\+xml;base64,/);
			expect(result.totpUri).toMatch(/^otpauth:\/\/totp\//);
			expect(result.manualEntryKey).toBe('JBSW Y3DP EHPK 3PXP');
			expect(result.backupCodes).toHaveLength(8);
		});

		it('should reject invalid configuration', async () => {
			const invalidConfig = { secret: '', issuer: 'Test', accountName: 'test@example.com' };
			await expect(QRCodeService.generateTOTPQRCode(invalidConfig as TOTPConfig)).rejects.toThrow();
		});
	});

	describe('generateManualEntryCode', () => {
		it('should format secret for manual entry', () => {
			const result = QRCodeService.generateManualEntryCode('JBSWY3DPEHPK3PXP');
			expect(result).toBe('JBSW Y3DP EHPK 3PXP');
		});
	});

	describe('validateTOTPCode', () => {
		it('should validate TOTP code format', () => {
			const result = QRCodeService.validateTOTPCode('JBSWY3DPEHPK3PXP', '123456');
			expect(result).toHaveProperty('valid');
		});

		it('should reject invalid code format', () => {
			const result = QRCodeService.validateTOTPCode('JBSWY3DPEHPK3PXP', '12345');
			expect(result.valid).toBe(false);
			expect(result.error).toContain('6-8 digits');
		});
	});

	describe('generateTOTPSecret', () => {
		it('should generate secret of correct length', () => {
			const secret = QRCodeService.generateTOTPSecret(32);
			expect(secret).toHaveLength(32);
			expect(secret).toMatch(/^[A-Z2-7]+$/);
		});
	});
});
