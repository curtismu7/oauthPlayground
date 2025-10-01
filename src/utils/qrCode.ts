// QR code generation utilities for device code verification

import { logger } from './logger';

export interface QRCodeOptions {
	size?: number;
	margin?: number;
	color?: {
		dark?: string;
		light?: string;
	};
}

/**
 * Generate QR code data URL for a given URL
 * This is a simplified implementation that creates a basic QR code representation
 * In a real implementation, you would use a QR code library like 'qrcode' or 'react-qr-code'
 */
export async function generateQRCode(url: string, options: QRCodeOptions = {}): Promise<string> {
	const { size = 200, margin = 4 } = options;

	logger.info('QR-CODE', 'Generating QR code', { url: `${url.substring(0, 50)}...`, size });

	try {
		// For now, we'll create a placeholder QR code using a simple canvas
		// In production, you should use a proper QR code library
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');

		if (!ctx) {
			throw new Error('Could not get canvas context');
		}

		canvas.width = size;
		canvas.height = size;

		// Draw a simple placeholder QR code pattern
		// This is just for demonstration - replace with actual QR code generation
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, size, size);

		ctx.fillStyle = '#000000';
		const blockSize = (size - margin * 2) / 25; // 25x25 grid

		// Draw a simple pattern that looks like a QR code
		for (let row = 0; row < 25; row++) {
			for (let col = 0; col < 25; col++) {
				if ((row + col) % 3 === 0 || (row * col) % 7 === 0) {
					ctx.fillRect(
						margin + col * blockSize,
						margin + row * blockSize,
						blockSize - 1,
						blockSize - 1
					);
				}
			}
		}

		// Add corner markers (like real QR codes)
		const markerSize = blockSize * 7;
		ctx.fillStyle = '#000000';
		// Top-left marker
		ctx.fillRect(margin, margin, markerSize, markerSize);
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(
			margin + blockSize,
			margin + blockSize,
			markerSize - 2 * blockSize,
			markerSize - 2 * blockSize
		);
		ctx.fillStyle = '#000000';
		ctx.fillRect(
			margin + 2 * blockSize,
			margin + 2 * blockSize,
			markerSize - 4 * blockSize,
			markerSize - 4 * blockSize
		);

		// Top-right marker
		ctx.fillStyle = '#000000';
		ctx.fillRect(size - margin - markerSize, margin, markerSize, markerSize);
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(
			size - margin - markerSize + blockSize,
			margin + blockSize,
			markerSize - 2 * blockSize,
			markerSize - 2 * blockSize
		);
		ctx.fillStyle = '#000000';
		ctx.fillRect(
			size - margin - markerSize + 2 * blockSize,
			margin + 2 * blockSize,
			markerSize - 4 * blockSize,
			markerSize - 4 * blockSize
		);

		// Bottom-left marker
		ctx.fillStyle = '#000000';
		ctx.fillRect(margin, size - margin - markerSize, markerSize, markerSize);
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(
			margin + blockSize,
			size - margin - markerSize + blockSize,
			markerSize - 2 * blockSize,
			markerSize - 2 * blockSize
		);
		ctx.fillStyle = '#000000';
		ctx.fillRect(
			margin + 2 * blockSize,
			size - margin - markerSize + 2 * blockSize,
			markerSize - 4 * blockSize,
			markerSize - 4 * blockSize
		);

		const dataUrl = canvas.toDataURL('image/png');

		logger.success('QR-CODE', 'QR code generated successfully', { size });
		return dataUrl;
	} catch (error) {
		logger.error('QR-CODE', 'Failed to generate QR code', error);
		throw error;
	}
}

/**
 * Validate if a URL is suitable for QR code generation
 */
export function validateQRCodeUrl(url: string): boolean {
	try {
		const urlObj = new URL(url);
		// Only allow HTTPS URLs in production
		if (process.env.NODE_ENV === 'production' && urlObj.protocol !== 'https:') {
			return false;
		}
		return true;
	} catch {
		return false;
	}
}

/**
 * Get QR code alt text for accessibility
 */
export function getQRCodeAltText(url: string): string {
	try {
		const urlObj = new URL(url);
		return `QR code for verification URL: ${urlObj.origin}${urlObj.pathname}`;
	} catch {
		return 'QR code for device verification';
	}
}

/**
 * Format URL for display in QR code context
 */
export function formatUrlForQRCode(url: string): string {
	try {
		const urlObj = new URL(url);
		// Show just the domain and path for better readability
		return `${urlObj.hostname}${urlObj.pathname}`;
	} catch {
		return url;
	}
}
