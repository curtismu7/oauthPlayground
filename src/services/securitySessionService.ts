// src/services/securitySessionService.ts
// Security Session Service

export interface SecuritySession {
	sessionId: string;
	userId?: string;
	startTime: Date;
	lastActivity: Date;
	isActive: boolean;
	securityLevel: 'low' | 'medium' | 'high';
	mfaCompleted: boolean;
	deviceTrusted: boolean;
}

class SecuritySessionService {
	private static currentSession: SecuritySession | null = null;

	static createSession(userId?: string): SecuritySession {
		const session: SecuritySession = {
			sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			userId,
			startTime: new Date(),
			lastActivity: new Date(),
			isActive: true,
			securityLevel: 'low',
			mfaCompleted: false,
			deviceTrusted: false,
		};

		SecuritySessionService.currentSession = session;
		console.log('[SecuritySessionService] Session created:', session.sessionId);
		return session;
	}

	static getCurrentSession(): SecuritySession | null {
		return SecuritySessionService.currentSession;
	}

	static updateSession(updates: Partial<SecuritySession>): SecuritySession | null {
		if (!SecuritySessionService.currentSession) {
			return null;
		}

		SecuritySessionService.currentSession = {
			...SecuritySessionService.currentSession,
			...updates,
			lastActivity: new Date(),
		};

		console.log(
			'[SecuritySessionService] Session updated:',
			SecuritySessionService.currentSession.sessionId
		);
		return SecuritySessionService.currentSession;
	}

	static endSession(): void {
		if (SecuritySessionService.currentSession) {
			console.log(
				'[SecuritySessionService] Session ended:',
				SecuritySessionService.currentSession.sessionId
			);
			SecuritySessionService.currentSession = null;
		}
	}

	static isSessionActive(): boolean {
		return SecuritySessionService.currentSession?.isActive ?? false;
	}
}

export default SecuritySessionService;
