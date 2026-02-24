/**
 * @file workerTokenServiceV9.ts
 * @module v9/services
 * @description V9 Worker Token Service with unified storage
 * @version 9.25.1
 * @since 2026-02-23
 */

import { unifiedStorageManager } from '@/services/unifiedStorageManager';

const WORKER_TOKEN_KEY = 'worker-token-v9';

export interface WorkerToken {
	token: string;
	environmentId: string;
	createdAt: string;
	expiresAt?: string;
}

export class WorkerTokenServiceV9 {
	static async saveToken(token: WorkerToken): Promise<void> {
		await unifiedStorageManager.save(WORKER_TOKEN_KEY, token);
	}

	static async getToken(): Promise<WorkerToken | null> {
		return await unifiedStorageManager.load<WorkerToken>(WORKER_TOKEN_KEY);
	}

	static async clearToken(): Promise<void> {
		await unifiedStorageManager.clear(WORKER_TOKEN_KEY);
	}

	static async hasValidToken(): Promise<boolean> {
		const token = await this.getToken();
		return !!token?.token;
	}
}
