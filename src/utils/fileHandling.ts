// src/utils/fileHandling.ts
// File handling utilities for import/export functionality

export interface FileValidationResult {
	isValid: boolean;
	error?: string;
	warnings?: string[];
	fileInfo?: {
		name: string;
		size: number;
		type: string;
		lastModified: Date;
	};
}

export interface DropZoneConfig {
	accept: string[];
	maxSize: number;
	multiple: boolean;
}

/**
 * Validates a file against specified criteria
 */
export function validateFile(
	file: File,
	config: Partial<DropZoneConfig> = {}
): FileValidationResult {
	const {
		accept = ['.json'],
		maxSize = 1024 * 1024, // 1MB default
		multiple = false,
	} = config;

	const warnings: string[] = [];

	// Check file extension
	const fileName = file.name.toLowerCase();
	const hasValidExtension = accept.some((ext) => fileName.endsWith(ext.toLowerCase()));

	if (!hasValidExtension) {
		return {
			isValid: false,
			error: `Invalid file type. Accepted types: ${accept.join(', ')}`,
		};
	}

	// Check file size
	if (file.size > maxSize) {
		return {
			isValid: false,
			error: `File too large. Maximum size: ${formatFileSize(maxSize)}`,
		};
	}

	if (file.size === 0) {
		return {
			isValid: false,
			error: 'File is empty',
		};
	}

	// Check for potentially large files (warning)
	if (file.size > maxSize * 0.8) {
		warnings.push('File is quite large and may take time to process');
	}

	// Check file age (warning for very old files)
	const fileAge = Date.now() - file.lastModified;
	const oneYearMs = 365 * 24 * 60 * 60 * 1000;
	if (fileAge > oneYearMs) {
		warnings.push('File is over a year old and may use an outdated format');
	}

	return {
		isValid: true,
		warnings: warnings.length > 0 ? warnings : undefined,
		fileInfo: {
			name: file.name,
			size: file.size,
			type: file.type,
			lastModified: new Date(file.lastModified),
		},
	};
}

/**
 * Reads a file as text with progress tracking
 */
export function readFileAsText(
	file: File,
	onProgress?: (progress: number) => void
): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = (event) => {
			if (event.target?.result) {
				resolve(event.target.result as string);
			} else {
				reject(new Error('Failed to read file'));
			}
		};

		reader.onerror = () => {
			reject(new Error(`File reading failed: ${reader.error?.message || 'Unknown error'}`));
		};

		reader.onprogress = (event) => {
			if (event.lengthComputable && onProgress) {
				const progress = (event.loaded / event.total) * 100;
				onProgress(progress);
			}
		};

		reader.readAsText(file);
	});
}

/**
 * Downloads data as a file
 */
export function downloadFile(
	data: string | Blob,
	filename: string,
	mimeType: string = 'application/json'
): void {
	let blob: Blob;

	if (typeof data === 'string') {
		blob = new Blob([data], { type: mimeType });
	} else {
		blob = data;
	}

	const url = URL.createObjectURL(blob);

	try {
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;

		// Append to body, click, and remove
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	} finally {
		// Clean up the URL object
		URL.revokeObjectURL(url);
	}
}

/**
 * Creates a file input element for file selection
 */
export function createFileInput(
	config: Partial<DropZoneConfig> = {},
	onChange?: (files: FileList) => void
): HTMLInputElement {
	const { accept = ['.json'], multiple = false } = config;

	const input = document.createElement('input');
	input.type = 'file';
	input.accept = accept.join(',');
	input.multiple = multiple;
	input.style.display = 'none';

	if (onChange) {
		input.addEventListener('change', (event) => {
			const target = event.target as HTMLInputElement;
			if (target.files) {
				onChange(target.files);
			}
		});
	}

	return input;
}

/**
 * Handles drag and drop file operations
 */
export class FileDropHandler {
	private element: HTMLElement;
	private config: DropZoneConfig;
	private onFiles?: (files: File[]) => void;
	private onError?: (error: string) => void;

	constructor(
		element: HTMLElement,
		config: Partial<DropZoneConfig> = {},
		callbacks: {
			onFiles?: (files: File[]) => void;
			onError?: (error: string) => void;
		} = {}
	) {
		this.element = element;
		this.config = {
			accept: ['.json'],
			maxSize: 1024 * 1024,
			multiple: false,
			...config,
		};
		this.onFiles = callbacks.onFiles;
		this.onError = callbacks.onError;

		this.setupEventListeners();
	}

	private setupEventListeners(): void {
		// Prevent default drag behaviors
		['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
			this.element.addEventListener(eventName, this.preventDefaults, false);
			document.body.addEventListener(eventName, this.preventDefaults, false);
		});

		// Highlight drop area when item is dragged over it
		['dragenter', 'dragover'].forEach((eventName) => {
			this.element.addEventListener(eventName, this.highlight.bind(this), false);
		});

		['dragleave', 'drop'].forEach((eventName) => {
			this.element.addEventListener(eventName, this.unhighlight.bind(this), false);
		});

		// Handle dropped files
		this.element.addEventListener('drop', this.handleDrop.bind(this), false);
	}

	private preventDefaults(e: Event): void {
		e.preventDefault();
		e.stopPropagation();
	}

	private highlight(): void {
		this.element.classList.add('drag-over');
	}

	private unhighlight(): void {
		this.element.classList.remove('drag-over');
	}

	private handleDrop(e: DragEvent): void {
		const dt = e.dataTransfer;
		const files = dt?.files;

		if (files) {
			this.handleFiles(Array.from(files));
		}
	}

	private handleFiles(files: File[]): void {
		// Check if multiple files are allowed
		if (!this.config.multiple && files.length > 1) {
			this.onError?.('Only one file is allowed');
			return;
		}

		// Validate each file
		const validFiles: File[] = [];
		for (const file of files) {
			const validation = validateFile(file, this.config);
			if (validation.isValid) {
				validFiles.push(file);
			} else {
				this.onError?.(validation.error || 'File validation failed');
				return; // Stop on first error
			}
		}

		if (validFiles.length > 0) {
			this.onFiles?.(validFiles);
		}
	}

	public destroy(): void {
		// Remove event listeners
		['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
			this.element.removeEventListener(eventName, this.preventDefaults, false);
			document.body.removeEventListener(eventName, this.preventDefaults, false);
		});

		['dragenter', 'dragover'].forEach((eventName) => {
			this.element.removeEventListener(eventName, this.highlight.bind(this), false);
		});

		['dragleave', 'drop'].forEach((eventName) => {
			this.element.removeEventListener(eventName, this.unhighlight.bind(this), false);
		});

		this.element.removeEventListener('drop', this.handleDrop.bind(this), false);
	}
}

/**
 * Utility functions
 */

export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 Bytes';

	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

export function getFileExtension(filename: string): string {
	return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
}

export function sanitizeFilename(filename: string): string {
	return filename
		.replace(/[^a-z0-9.-]/gi, '_')
		.replace(/_+/g, '_')
		.replace(/^_|_$/g, '');
}

export function generateTimestampedFilename(baseName: string, extension: string): string {
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, -5); // Remove milliseconds and Z

	return `${baseName}_${timestamp}.${extension}`;
}

/**
 * File type detection utilities
 */
export function isJsonFile(file: File): boolean {
	return file.type === 'application/json' || file.name.toLowerCase().endsWith('.json');
}

export function detectFileType(file: File): 'json' | 'text' | 'binary' | 'unknown' {
	if (isJsonFile(file)) return 'json';

	if (file.type.startsWith('text/')) return 'text';

	// Check for common text file extensions
	const textExtensions = ['.txt', '.md', '.csv', '.xml', '.yaml', '.yml'];
	const fileName = file.name.toLowerCase();
	if (textExtensions.some((ext) => fileName.endsWith(ext))) {
		return 'text';
	}

	// Check for binary files
	if (
		file.type.startsWith('image/') ||
		file.type.startsWith('video/') ||
		file.type.startsWith('audio/') ||
		file.type === 'application/pdf'
	) {
		return 'binary';
	}

	return 'unknown';
}

/**
 * Batch file processing utilities
 */
export async function processFilesInBatches<T>(
	files: File[],
	processor: (file: File) => Promise<T>,
	batchSize: number = 5,
	onProgress?: (completed: number, total: number) => void
): Promise<T[]> {
	const results: T[] = [];

	for (let i = 0; i < files.length; i += batchSize) {
		const batch = files.slice(i, i + batchSize);
		const batchPromises = batch.map(processor);

		try {
			const batchResults = await Promise.all(batchPromises);
			results.push(...batchResults);

			if (onProgress) {
				onProgress(Math.min(i + batchSize, files.length), files.length);
			}
		} catch (error) {
			console.error(`Batch processing failed at batch starting at index ${i}:`, error);
			throw error;
		}
	}

	return results;
}
