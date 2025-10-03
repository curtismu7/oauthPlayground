import { logger } from './logger';
import { analyticsManager } from './analytics';

// Security analytics types
export type SecurityEventType =
	| 'authentication_failure'
	| 'authorization_failure'
	| 'token_validation_failure'
	| 'suspicious_activity'
	| 'rate_limit_exceeded'
	| 'invalid_request'
	| 'security_violation'
	| 'threat_detected'
	| 'compliance_violation'
	| 'data_breach_attempt'
	| 'malicious_payload'
	| 'unauthorized_access'
	| 'session_hijacking'
	| 'csrf_attack'
	| 'xss_attempt'
	| 'injection_attack'
	| 'brute_force_attack'
	| 'dictionary_attack'
	| 'credential_stuffing'
	| 'account_takeover'
	| 'privilege_escalation'
	| 'data_exfiltration'
	| 'insider_threat'
	| 'compliance_audit'
	| 'security_scan'
	| 'vulnerability_detected'
	| 'security_policy_violation'
	| 'custom_security_event';

export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

export type ComplianceStandard =
	| 'GDPR'
	| 'CCPA'
	| 'SOC2'
	| 'ISO27001'
	| 'PCI-DSS'
	| 'HIPAA'
	| 'OAuth2.1'
	| 'OpenID_Connect';

export interface SecurityEvent {
	id: string;
	type: SecurityEventType;
	severity: SecuritySeverity;
	timestamp: number;
	userId?: string;
	sessionId?: string;
	ipAddress?: string;
	userAgent?: string;
	source: string;
	description: string;
	details: Record<string, any>;
	riskScore: number;
	complianceImpact?: ComplianceStandard[];
	remediation?: string;
	status: 'open' | 'investigating' | 'resolved' | 'false_positive';
	assignedTo?: string;
	tags?: string[];
}

export interface ThreatIntelligence {
	id: string;
	threatType: string;
	severity: SecuritySeverity;
	description: string;
	indicators: string[];
	mitigation: string[];
	references: string[];
	lastUpdated: number;
	active: boolean;
}

export interface SecurityMetrics {
	totalEvents: number;
	eventsBySeverity: Record<SecuritySeverity, number>;
	eventsByType: Record<SecurityEventType, number>;
	averageRiskScore: number;
	complianceScore: Record<ComplianceStandard, number>;
	threatDetectionRate: number;
	falsePositiveRate: number;
	meanTimeToDetection: number;
	meanTimeToResolution: number;
	topThreats: Array<{ type: SecurityEventType; count: number }>;
	topSources: Array<{ source: string; count: number }>;
	riskTrend: Array<{ date: string; riskScore: number }>;
}

export interface ComplianceReport {
	standard: ComplianceStandard;
	score: number;
	status: 'compliant' | 'non_compliant' | 'partial';
	violations: ComplianceViolation[];
	recommendations: string[];
	lastAudit: number;
	nextAudit: number;
}

export interface ComplianceViolation {
	id: string;
	standard: ComplianceStandard;
	requirement: string;
	description: string;
	severity: SecuritySeverity;
	detectedAt: number;
	resolvedAt?: number;
	status: 'open' | 'resolved' | 'exempt';
	evidence: string[];
	remediation: string;
}

export interface SecurityAlert {
	id: string;
	title: string;
	description: string;
	severity: SecuritySeverity;
	timestamp: number;
	source: string;
	affectedUsers?: string[];
	affectedSystems?: string[];
	status: 'new' | 'acknowledged' | 'investigating' | 'resolved';
	assignedTo?: string;
	escalationLevel: number;
	autoResolved: boolean;
	relatedEvents: string[];
}

export interface RiskAssessment {
	id: string;
	userId?: string;
	sessionId?: string;
	timestamp: number;
	overallRiskScore: number;
	riskFactors: RiskFactor[];
	recommendations: string[];
	status: 'low' | 'medium' | 'high' | 'critical';
}

export interface RiskFactor {
	factor: string;
	weight: number;
	score: number;
	description: string;
	mitigation?: string;
}

// Security analytics manager
export class SecurityAnalyticsManager {
	private events: SecurityEvent[] = [];
	private alerts: SecurityAlert[] = [];
	private threatIntelligence: ThreatIntelligence[] = [];
	private complianceReports: Map<ComplianceStandard, ComplianceReport> = new Map();
	private riskAssessments: RiskAssessment[] = [];
	private isMonitoring: boolean = false;
	private monitoringConfig: {
		enableRealTimeMonitoring: boolean;
		enableThreatDetection: boolean;
		enableComplianceMonitoring: boolean;
		enableRiskAssessment: boolean;
		alertThresholds: Record<SecuritySeverity, number>;
		autoResponse: boolean;
	};

	constructor(config: Partial<SecurityAnalyticsManager['monitoringConfig']> = {}) {
		this.monitoringConfig = {
			enableRealTimeMonitoring: true,
			enableThreatDetection: true,
			enableComplianceMonitoring: true,
			enableRiskAssessment: true,
			alertThresholds: {
				low: 10,
				medium: 5,
				high: 3,
				critical: 1,
			},
			autoResponse: false,
			...config,
		};

		this.initialize();
	}

	// Initialize security analytics
	private initialize(): void {
		try {
			this.loadThreatIntelligence();
			this.setupRealTimeMonitoring();
			this.setupComplianceMonitoring();
			this.setupRiskAssessment();

			this.isMonitoring = true;
			logger.info('[SecurityAnalyticsManager] Security analytics initialized');
		} catch (error) {
			logger.error('[SecurityAnalyticsManager] Failed to initialize security analytics:', error);
		}
	}

	// Track security event
	public trackSecurityEvent(
		type: SecurityEventType,
		severity: SecuritySeverity,
		description: string,
		details: Record<string, any> = {},
		options: {
			userId?: string;
			sessionId?: string;
			ipAddress?: string;
			userAgent?: string;
			source?: string;
			complianceImpact?: ComplianceStandard[];
			remediation?: string;
			tags?: string[];
		} = {}
	): string {
		const eventId = this.generateEventId();
		const riskScore = this.calculateRiskScore(type, severity, details);

		const event: SecurityEvent = {
			id: eventId,
			type,
			severity,
			timestamp: Date.now(),
			userId: options.userId,
			sessionId: options.sessionId,
			ipAddress: options.ipAddress,
			userAgent: options.userAgent,
			source: options.source || 'oauth-playground',
			description,
			details,
			riskScore,
			complianceImpact: options.complianceImpact,
			remediation: options.remediation,
			status: 'open',
			tags: options.tags,
		};

		this.events.push(event);

		// Track with analytics
		analyticsManager.trackSecurityEvent(type, severity, {
			eventId,
			riskScore,
			userId: options.userId,
			sessionId: options.sessionId,
			source: event.source,
			...details,
		});

		// Check for alerts
		this.checkForAlerts(event);

		// Update compliance monitoring
		if (options.complianceImpact) {
			this.updateComplianceMonitoring(event);
		}

		// Update risk assessment
		this.updateRiskAssessment(event);

		logger.info('[SecurityAnalyticsManager] Security event tracked:', { type, severity, eventId });
		return eventId;
	}

	// Track authentication failure
	public trackAuthenticationFailure(
		userId: string,
		reason: string,
		details: Record<string, any> = {}
	): string {
		return this.trackSecurityEvent(
			'authentication_failure',
			'medium',
			`Authentication failed for user ${userId}: ${reason}`,
			{ userId, reason, ...details },
			{ userId, source: 'authentication' }
		);
	}

	// Track authorization failure
	public trackAuthorizationFailure(
		userId: string,
		resource: string,
		action: string,
		details: Record<string, any> = {}
	): string {
		return this.trackSecurityEvent(
			'authorization_failure',
			'high',
			`Authorization failed for user ${userId} accessing ${resource}`,
			{ userId, resource, action, ...details },
			{ userId, source: 'authorization' }
		);
	}

	// Track token validation failure
	public trackTokenValidationFailure(
		tokenType: string,
		reason: string,
		details: Record<string, any> = {}
	): string {
		return this.trackSecurityEvent(
			'token_validation_failure',
			'high',
			`Token validation failed for ${tokenType}: ${reason}`,
			{ tokenType, reason, ...details },
			{ source: 'token_validation' }
		);
	}

	// Track suspicious activity
	public trackSuspiciousActivity(
		activity: string,
		severity: SecuritySeverity,
		details: Record<string, any> = {}
	): string {
		return this.trackSecurityEvent(
			'suspicious_activity',
			severity,
			`Suspicious activity detected: ${activity}`,
			{ activity, ...details },
			{ source: 'threat_detection' }
		);
	}

	// Track rate limit exceeded
	public trackRateLimitExceeded(
		endpoint: string,
		limit: number,
		details: Record<string, any> = {}
	): string {
		return this.trackSecurityEvent(
			'rate_limit_exceeded',
			'medium',
			`Rate limit exceeded for endpoint ${endpoint}`,
			{ endpoint, limit, ...details },
			{ source: 'rate_limiting' }
		);
	}

	// Track security violation
	public trackSecurityViolation(
		violation: string,
		severity: SecuritySeverity,
		details: Record<string, any> = {}
	): string {
		return this.trackSecurityEvent(
			'security_violation',
			severity,
			`Security violation: ${violation}`,
			{ violation, ...details },
			{ source: 'security_policy' }
		);
	}

	// Track compliance violation
	public trackComplianceViolation(
		standard: ComplianceStandard,
		requirement: string,
		violation: string,
		details: Record<string, any> = {}
	): string {
		const eventId = this.trackSecurityEvent(
			'compliance_violation',
			'high',
			`Compliance violation for ${standard}: ${violation}`,
			{ standard, requirement, violation, ...details },
			{
				source: 'compliance_monitoring',
				complianceImpact: [standard],
			}
		);

		// Create compliance violation record
		const complianceViolation: ComplianceViolation = {
			id: this.generateEventId(),
			standard,
			requirement,
			description: violation,
			severity: 'high',
			detectedAt: Date.now(),
			status: 'open',
			evidence: [eventId],
			remediation: details.remediation || 'Review and address compliance requirement',
		};

		this.updateComplianceReport(standard, complianceViolation);
		return eventId;
	}

	// Check for alerts
	private checkForAlerts(event: SecurityEvent): void {
		const threshold = this.monitoringConfig.alertThresholds[event.severity];
		const recentEvents = this.getRecentEventsByType(event.type, 3600000); // 1 hour

		if (recentEvents.length >= threshold) {
			this.createAlert(event, recentEvents.length);
		}
	}

	// Create security alert
	private createAlert(event: SecurityEvent, eventCount: number): void {
		const alertId = this.generateEventId();
		const alert: SecurityAlert = {
			id: alertId,
			title: `Security Alert: ${event.type.replace(/_/g, ' ').toUpperCase()}`,
			description: `${eventCount} ${event.type} events detected in the last hour`,
			severity: event.severity,
			timestamp: Date.now(),
			source: event.source,
			affectedUsers: event.userId ? [event.userId] : undefined,
			status: 'new',
			escalationLevel: this.getEscalationLevel(event.severity),
			autoResolved: false,
			relatedEvents: [event.id],
		};

		this.alerts.push(alert);

		// Track alert creation
		analyticsManager.trackSecurityEvent('security_alert', event.severity, {
			alertId,
			eventType: event.type,
			eventCount,
			severity: event.severity,
		});

		logger.warn('[SecurityAnalyticsManager] Security alert created:', {
			alertId,
			eventType: event.type,
			eventCount,
		});
	}

	// Get escalation level
	private getEscalationLevel(severity: SecuritySeverity): number {
		switch (severity) {
			case 'low':
				return 1;
			case 'medium':
				return 2;
			case 'high':
				return 3;
			case 'critical':
				return 4;
			default:
				return 1;
		}
	}

	// Calculate risk score
	private calculateRiskScore(
		type: SecurityEventType,
		severity: SecuritySeverity,
		details: Record<string, any>
	): number {
		const baseScores = {
			low: 25,
			medium: 50,
			high: 75,
			critical: 100,
		};

		let score = baseScores[severity];

		// Adjust based on event type
		const typeMultipliers = {
			authentication_failure: 1.0,
			authorization_failure: 1.2,
			token_validation_failure: 1.3,
			suspicious_activity: 1.1,
			rate_limit_exceeded: 0.8,
			security_violation: 1.4,
			threat_detected: 1.5,
			compliance_violation: 1.3,
			data_breach_attempt: 1.6,
			malicious_payload: 1.7,
			unauthorized_access: 1.4,
			session_hijacking: 1.5,
			csrf_attack: 1.3,
			xss_attempt: 1.4,
			injection_attack: 1.5,
			brute_force_attack: 1.2,
			dictionary_attack: 1.1,
			credential_stuffing: 1.3,
			account_takeover: 1.6,
			privilege_escalation: 1.5,
			data_exfiltration: 1.7,
			insider_threat: 1.4,
			compliance_audit: 0.5,
			security_scan: 0.3,
			vulnerability_detected: 1.2,
			security_policy_violation: 1.1,
			custom_security_event: 1.0,
		};

		score *= typeMultipliers[type] || 1.0;

		// Adjust based on details
		if (details.userId) score += 10; // User-specific events are riskier
		if (details.ipAddress) score += 5; // IP tracking adds risk
		if (details.multipleAttempts) score += 15; // Multiple attempts are riskier
		if (details.adminAccess) score += 20; // Admin access is riskier

		return Math.min(Math.round(score), 100);
	}

	// Get recent events by type
	private getRecentEventsByType(type: SecurityEventType, timeWindow: number): SecurityEvent[] {
		const cutoff = Date.now() - timeWindow;
		return this.events.filter((event) => event.type === type && event.timestamp > cutoff);
	}

	// Update compliance monitoring
	private updateComplianceMonitoring(event: SecurityEvent): void {
		if (!event.complianceImpact) return;

		event.complianceImpact.forEach((standard) => {
			const report = this.complianceReports.get(standard);
			if (report) {
				// Update compliance score based on event
				const penalty = this.getCompliancePenalty(event.severity);
				report.score = Math.max(0, report.score - penalty);

				if (report.score < 80) {
					report.status = 'non_compliant';
				} else if (report.score < 95) {
					report.status = 'partial';
				}
			}
		});
	}

	// Get compliance penalty
	private getCompliancePenalty(severity: SecuritySeverity): number {
		switch (severity) {
			case 'low':
				return 1;
			case 'medium':
				return 3;
			case 'high':
				return 7;
			case 'critical':
				return 15;
			default:
				return 1;
		}
	}

	// Update compliance report
	private updateComplianceReport(
		standard: ComplianceStandard,
		violation: ComplianceViolation
	): void {
		let report = this.complianceReports.get(standard);
		if (!report) {
			report = {
				standard,
				score: 100,
				status: 'compliant',
				violations: [],
				recommendations: [],
				lastAudit: Date.now(),
				nextAudit: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
			};
		}

		report.violations.push(violation);
		report.lastAudit = Date.now();

		// Recalculate score
		const penalty = this.getCompliancePenalty(violation.severity);
		report.score = Math.max(0, report.score - penalty);

		if (report.score < 80) {
			report.status = 'non_compliant';
		} else if (report.score < 95) {
			report.status = 'partial';
		}

		this.complianceReports.set(standard, report);
	}

	// Update risk assessment
	private updateRiskAssessment(event: SecurityEvent): void {
		const assessment: RiskAssessment = {
			id: this.generateEventId(),
			userId: event.userId,
			sessionId: event.sessionId,
			timestamp: Date.now(),
			overallRiskScore: event.riskScore,
			riskFactors: [
				{
					factor: event.type,
					weight: 1.0,
					score: event.riskScore,
					description: event.description,
					mitigation: event.remediation,
				},
			],
			recommendations: event.remediation ? [event.remediation] : [],
			status: this.getRiskStatus(event.riskScore),
		};

		this.riskAssessments.push(assessment);
	}

	// Get risk status
	private getRiskStatus(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
		if (riskScore >= 80) return 'critical';
		if (riskScore >= 60) return 'high';
		if (riskScore >= 40) return 'medium';
		return 'low';
	}

	// Load threat intelligence
	private loadThreatIntelligence(): void {
		// In a real implementation, this would load from external threat intelligence feeds
		this.threatIntelligence = [
			{
				id: 'threat_001',
				threatType: 'OAuth Token Theft',
				severity: 'high',
				description: 'Attackers attempting to steal OAuth tokens through various methods',
				indicators: ['unusual_token_usage', 'rapid_token_requests', 'suspicious_redirects'],
				mitigation: [
					'Implement token binding',
					'Use short-lived tokens',
					'Monitor token usage patterns',
				],
				references: ['https://oauth.net/2/security/'],
				lastUpdated: Date.now(),
				active: true,
			},
			{
				id: 'threat_002',
				threatType: 'Authorization Code Interception',
				severity: 'critical',
				description: 'Attackers intercepting authorization codes during OAuth flow',
				indicators: ['code_reuse_attempts', 'rapid_code_exchanges', 'suspicious_user_agents'],
				mitigation: ['Use PKCE', 'Implement state parameter', 'Validate redirect URIs'],
				references: ['https://tools.ietf.org/html/rfc7636'],
				lastUpdated: Date.now(),
				active: true,
			},
		];
	}

	// Setup real-time monitoring
	private setupRealTimeMonitoring(): void {
		if (!this.monitoringConfig.enableRealTimeMonitoring) return;

		// Monitor for suspicious patterns
		setInterval(() => {
			this.detectSuspiciousPatterns();
		}, 60000); // Check every minute

		// Monitor for compliance violations
		setInterval(() => {
			this.checkComplianceViolations();
		}, 300000); // Check every 5 minutes
	}

	// Setup compliance monitoring
	private setupComplianceMonitoring(): void {
		if (!this.monitoringConfig.enableComplianceMonitoring) return;

		// Initialize compliance reports for common standards
		const standards: ComplianceStandard[] = ['GDPR', 'CCPA', 'SOC2', 'OAuth2.1'];
		standards.forEach((standard) => {
			if (!this.complianceReports.has(standard)) {
				this.complianceReports.set(standard, {
					standard,
					score: 100,
					status: 'compliant',
					violations: [],
					recommendations: [],
					lastAudit: Date.now(),
					nextAudit: Date.now() + 365 * 24 * 60 * 60 * 1000,
				});
			}
		});
	}

	// Setup risk assessment
	private setupRiskAssessment(): void {
		if (!this.monitoringConfig.enableRiskAssessment) return;

		// Periodic risk assessment
		setInterval(() => {
			this.performRiskAssessment();
		}, 3600000); // Every hour
	}

	// Detect suspicious patterns
	private detectSuspiciousPatterns(): void {
		const recentEvents = this.events.filter((e) => Date.now() - e.timestamp < 3600000); // Last hour

		// Detect brute force attacks
		const authFailures = recentEvents.filter((e) => e.type === 'authentication_failure');
		if (authFailures.length > 10) {
			this.trackSuspiciousActivity('Potential brute force attack detected', 'high', {
				eventCount: authFailures.length,
				timeWindow: '1 hour',
			});
		}

		// Detect rapid token requests
		const tokenRequests = recentEvents.filter((e) => e.type === 'token_validation_failure');
		if (tokenRequests.length > 20) {
			this.trackSuspiciousActivity('Rapid token validation failures detected', 'medium', {
				eventCount: tokenRequests.length,
				timeWindow: '1 hour',
			});
		}
	}

	// Check compliance violations
	private checkComplianceViolations(): void {
		// Check for GDPR violations
		const gdprEvents = this.events.filter(
			(e) => e.complianceImpact?.includes('GDPR') && Date.now() - e.timestamp < 86400000 // Last 24 hours
		);

		if (gdprEvents.length > 0) {
			this.trackComplianceViolation(
				'GDPR',
				'Data Protection',
				`${gdprEvents.length} GDPR-related security events in the last 24 hours`,
				{ eventCount: gdprEvents.length, timeWindow: '24 hours' }
			);
		}
	}

	// Perform risk assessment
	private performRiskAssessment(): void {
		const recentEvents = this.events.filter((e) => Date.now() - e.timestamp < 3600000); // Last hour
		const averageRiskScore =
			recentEvents.reduce((sum, e) => sum + e.riskScore, 0) / Math.max(recentEvents.length, 1);

		if (averageRiskScore > 70) {
			this.trackSecurityEvent(
				'risk_assessment',
				'high',
				`High risk environment detected: average risk score ${averageRiskScore.toFixed(1)}`,
				{ averageRiskScore, eventCount: recentEvents.length },
				{ source: 'risk_assessment' }
			);
		}
	}

	// Get security metrics
	public getSecurityMetrics(): SecurityMetrics {
		const totalEvents = this.events.length;
		const eventsBySeverity = this.events.reduce(
			(acc, event) => {
				acc[event.severity] = (acc[event.severity] || 0) + 1;
				return acc;
			},
			{} as Record<SecuritySeverity, number>
		);

		const eventsByType = this.events.reduce(
			(acc, event) => {
				acc[event.type] = (acc[event.type] || 0) + 1;
				return acc;
			},
			{} as Record<SecurityEventType, number>
		);

		const averageRiskScore =
			this.events.reduce((sum, event) => sum + event.riskScore, 0) / Math.max(totalEvents, 1);

		const complianceScore = Array.from(this.complianceReports.entries()).reduce(
			(acc, [standard, report]) => {
				acc[standard] = report.score;
				return acc;
			},
			{} as Record<ComplianceStandard, number>
		);

		const threatDetectionRate =
			this.events.filter((e) => e.type.includes('threat') || e.type.includes('suspicious')).length /
			Math.max(totalEvents, 1);
		const falsePositiveRate =
			this.events.filter((e) => e.status === 'false_positive').length / Math.max(totalEvents, 1);

		const topThreats = Object.entries(eventsByType)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 10)
			.map(([type, count]) => ({ type: type as SecurityEventType, count }));

		const topSources = this.events.reduce(
			(acc, event) => {
				acc[event.source] = (acc[event.source] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		const topSourcesArray = Object.entries(topSources)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 10)
			.map(([source, count]) => ({ source, count }));

		return {
			totalEvents,
			eventsBySeverity,
			eventsByType,
			averageRiskScore,
			complianceScore,
			threatDetectionRate,
			falsePositiveRate,
			meanTimeToDetection: 0, // Would be calculated from actual data
			meanTimeToResolution: 0, // Would be calculated from actual data
			topThreats,
			topSources: topSourcesArray,
			riskTrend: [], // Would be calculated from historical data
		};
	}

	// Get compliance reports
	public getComplianceReports(): ComplianceReport[] {
		return Array.from(this.complianceReports.values());
	}

	// Get security alerts
	public getSecurityAlerts(): SecurityAlert[] {
		return [...this.alerts];
	}

	// Get threat intelligence
	public getThreatIntelligence(): ThreatIntelligence[] {
		return this.threatIntelligence.filter((t) => t.active);
	}

	// Get risk assessments
	public getRiskAssessments(): RiskAssessment[] {
		return [...this.riskAssessments];
	}

	// Generate event ID
	private generateEventId(): string {
		return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	// Update monitoring configuration
	public updateConfig(newConfig: Partial<SecurityAnalyticsManager['monitoringConfig']>): void {
		this.monitoringConfig = { ...this.monitoringConfig, ...newConfig };
		logger.info('[SecurityAnalyticsManager] Configuration updated');
	}

	// Enable/disable monitoring
	public setMonitoringEnabled(enabled: boolean): void {
		this.isMonitoring = enabled;
		logger.info('[SecurityAnalyticsManager] Monitoring enabled:', enabled);
	}

	// Destroy manager
	public destroy(): void {
		this.isMonitoring = false;
		logger.info('[SecurityAnalyticsManager] Security analytics manager destroyed');
	}
}

// Create global security analytics manager instance
export const securityAnalyticsManager = new SecurityAnalyticsManager();

// Utility functions
export const trackSecurityEvent = (
	type: SecurityEventType,
	severity: SecuritySeverity,
	description: string,
	details?: Record<string, any>,
	options?: any
) => {
	return securityAnalyticsManager.trackSecurityEvent(type, severity, description, details, options);
};

export const trackAuthenticationFailure = (
	userId: string,
	reason: string,
	details?: Record<string, any>
) => {
	return securityAnalyticsManager.trackAuthenticationFailure(userId, reason, details);
};

export const trackAuthorizationFailure = (
	userId: string,
	resource: string,
	action: string,
	details?: Record<string, any>
) => {
	return securityAnalyticsManager.trackAuthorizationFailure(userId, resource, action, details);
};

export const trackTokenValidationFailure = (
	tokenType: string,
	reason: string,
	details?: Record<string, any>
) => {
	return securityAnalyticsManager.trackTokenValidationFailure(tokenType, reason, details);
};

export const trackSuspiciousActivity = (
	activity: string,
	severity: SecuritySeverity,
	details?: Record<string, any>
) => {
	return securityAnalyticsManager.trackSuspiciousActivity(activity, severity, details);
};

export const trackComplianceViolation = (
	standard: ComplianceStandard,
	requirement: string,
	violation: string,
	details?: Record<string, any>
) => {
	return securityAnalyticsManager.trackComplianceViolation(
		standard,
		requirement,
		violation,
		details
	);
};

export const getSecurityMetrics = () => {
	return securityAnalyticsManager.getSecurityMetrics();
};

export const getComplianceReports = () => {
	return securityAnalyticsManager.getComplianceReports();
};

export const getSecurityAlerts = () => {
	return securityAnalyticsManager.getSecurityAlerts();
};

export const getThreatIntelligence = () => {
	return securityAnalyticsManager.getThreatIntelligence();
};

export default securityAnalyticsManager;
