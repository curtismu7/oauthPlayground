import { useEffect, useCallback, useRef, useState } from 'react';
import {
	securityAnalyticsManager,
	trackSecurityEvent,
	trackAuthenticationFailure,
	trackAuthorizationFailure,
	trackTokenValidationFailure,
	trackSuspiciousActivity,
	trackComplianceViolation,
	getSecurityMetrics,
	getComplianceReports,
	getSecurityAlerts,
	getThreatIntelligence,
	SecurityEventType,
	SecuritySeverity,
	ComplianceStandard,
	SecurityEvent,
	SecurityAlert,
	ComplianceReport,
	ThreatIntelligence,
	RiskAssessment,
	SecurityMetrics,
} from '../utils/securityAnalytics';
import { logger } from '../utils/logger';

// Security analytics hook configuration
export interface UseSecurityAnalyticsConfig {
	enabled?: boolean;
	enableRealTimeMonitoring?: boolean;
	enableThreatDetection?: boolean;
	enableComplianceMonitoring?: boolean;
	enableRiskAssessment?: boolean;
	alertThresholds?: Record<SecuritySeverity, number>;
	autoResponse?: boolean;
	debug?: boolean;
}

// Security analytics state
export interface SecurityAnalyticsState {
	isEnabled: boolean;
	isMonitoring: boolean;
	securityMetrics: SecurityMetrics;
	complianceReports: ComplianceReport[];
	securityAlerts: SecurityAlert[];
	threatIntelligence: ThreatIntelligence[];
	riskAssessments: RiskAssessment[];
	recentEvents: SecurityEvent[];
}

// useSecurityAnalytics hook
export const useSecurityAnalytics = (config: UseSecurityAnalyticsConfig = {}) => {
	const {
		enabled = true,
		enableRealTimeMonitoring = true,
		enableThreatDetection = true,
		enableComplianceMonitoring = true,
		enableRiskAssessment = true,
		alertThresholds,
		autoResponse = false,
		debug = false,
	} = config;

	const [state, setState] = useState<SecurityAnalyticsState>({
		isEnabled: enabled,
		isMonitoring: false,
		securityMetrics: getSecurityMetrics(),
		complianceReports: getComplianceReports(),
		securityAlerts: getSecurityAlerts(),
		threatIntelligence: getThreatIntelligence(),
		riskAssessments: [],
		recentEvents: [],
	});

	const configRef = useRef(config);
	const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

	// Update configuration when it changes
	useEffect(() => {
		configRef.current = config;

		securityAnalyticsManager.updateConfig({
			enableRealTimeMonitoring,
			enableThreatDetection,
			enableComplianceMonitoring,
			enableRiskAssessment,
			alertThresholds,
			autoResponse,
		});

		if (debug) {
			logger.info('[useSecurityAnalytics] Configuration updated');
		}
	}, [
		enableRealTimeMonitoring,
		enableThreatDetection,
		enableComplianceMonitoring,
		enableRiskAssessment,
		alertThresholds,
		autoResponse,
		debug,
	]);

	// Initialize security analytics
	useEffect(() => {
		if (enabled) {
			securityAnalyticsManager.setMonitoringEnabled(true);

			setState((prev) => ({
				...prev,
				isEnabled: true,
				isMonitoring: true,
			}));

			// Start periodic updates
			updateIntervalRef.current = setInterval(() => {
				setState((prev) => ({
					...prev,
					securityMetrics: getSecurityMetrics(),
					complianceReports: getComplianceReports(),
					securityAlerts: getSecurityAlerts(),
					threatIntelligence: getThreatIntelligence(),
				}));
			}, 5000); // Update every 5 seconds

			if (debug) {
				logger.info('[useSecurityAnalytics] Security analytics initialized');
			}
		} else {
			securityAnalyticsManager.setMonitoringEnabled(false);
			setState((prev) => ({
				...prev,
				isEnabled: false,
				isMonitoring: false,
			}));

			if (updateIntervalRef.current) {
				clearInterval(updateIntervalRef.current);
				updateIntervalRef.current = null;
			}
		}

		return () => {
			if (updateIntervalRef.current) {
				clearInterval(updateIntervalRef.current);
			}
		};
	}, [enabled, debug]);

	// Track security event
	const handleTrackSecurityEvent = useCallback(
		(
			type: SecurityEventType,
			severity: SecuritySeverity,
			description: string,
			details: Record<string, any> = {},
			options: any = {}
		) => {
			if (enabled) {
				const eventId = trackSecurityEvent(type, severity, description, details, options);

				if (debug) {
					logger.info('[useSecurityAnalytics] Security event tracked:', {
						type,
						severity,
						eventId,
					});
				}

				return eventId;
			}
			return '';
		},
		[enabled, debug]
	);

	// Track authentication failure
	const handleTrackAuthenticationFailure = useCallback(
		(userId: string, reason: string, details: Record<string, any> = {}) => {
			if (enabled) {
				const eventId = trackAuthenticationFailure(userId, reason, details);

				if (debug) {
					logger.info('[useSecurityAnalytics] Authentication failure tracked:', {
						userId,
						reason,
						eventId,
					});
				}

				return eventId;
			}
			return '';
		},
		[enabled, debug]
	);

	// Track authorization failure
	const handleTrackAuthorizationFailure = useCallback(
		(userId: string, resource: string, action: string, details: Record<string, any> = {}) => {
			if (enabled) {
				const eventId = trackAuthorizationFailure(userId, resource, action, details);

				if (debug) {
					logger.info('[useSecurityAnalytics] Authorization failure tracked:', {
						userId,
						resource,
						action,
						eventId,
					});
				}

				return eventId;
			}
			return '';
		},
		[enabled, debug]
	);

	// Track token validation failure
	const handleTrackTokenValidationFailure = useCallback(
		(tokenType: string, reason: string, details: Record<string, any> = {}) => {
			if (enabled) {
				const eventId = trackTokenValidationFailure(tokenType, reason, details);

				if (debug) {
					logger.info('[useSecurityAnalytics] Token validation failure tracked:', {
						tokenType,
						reason,
						eventId,
					});
				}

				return eventId;
			}
			return '';
		},
		[enabled, debug]
	);

	// Track suspicious activity
	const handleTrackSuspiciousActivity = useCallback(
		(activity: string, severity: SecuritySeverity, details: Record<string, any> = {}) => {
			if (enabled) {
				const eventId = trackSuspiciousActivity(activity, severity, details);

				if (debug) {
					logger.info('[useSecurityAnalytics] Suspicious activity tracked:', {
						activity,
						severity,
						eventId,
					});
				}

				return eventId;
			}
			return '';
		},
		[enabled, debug]
	);

	// Track compliance violation
	const handleTrackComplianceViolation = useCallback(
		(
			standard: ComplianceStandard,
			requirement: string,
			violation: string,
			details: Record<string, any> = {}
		) => {
			if (enabled) {
				const eventId = trackComplianceViolation(standard, requirement, violation, details);

				if (debug) {
					logger.info('[useSecurityAnalytics] Compliance violation tracked:', {
						standard,
						requirement,
						violation,
						eventId,
					});
				}

				return eventId;
			}
			return '';
		},
		[enabled, debug]
	);

	// Get security metrics
	const getCurrentSecurityMetrics = useCallback(() => {
		return getSecurityMetrics();
	}, []);

	// Get compliance reports
	const getCurrentComplianceReports = useCallback(() => {
		return getComplianceReports();
	}, []);

	// Get security alerts
	const getCurrentSecurityAlerts = useCallback(() => {
		return getSecurityAlerts();
	}, []);

	// Get threat intelligence
	const getCurrentThreatIntelligence = useCallback(() => {
		return getThreatIntelligence();
	}, []);

	// Get events by severity
	const getEventsBySeverity = useCallback(
		(severity: SecuritySeverity) => {
			return state.recentEvents.filter((event) => event.severity === severity);
		},
		[state.recentEvents]
	);

	// Get events by type
	const getEventsByType = useCallback(
		(type: SecurityEventType) => {
			return state.recentEvents.filter((event) => event.type === type);
		},
		[state.recentEvents]
	);

	// Get critical alerts
	const getCriticalAlerts = useCallback(() => {
		return state.securityAlerts.filter((alert) => alert.severity === 'critical');
	}, [state.securityAlerts]);

	// Get high severity alerts
	const getHighSeverityAlerts = useCallback(() => {
		return state.securityAlerts.filter(
			(alert) => alert.severity === 'high' || alert.severity === 'critical'
		);
	}, [state.securityAlerts]);

	// Get open alerts
	const getOpenAlerts = useCallback(() => {
		return state.securityAlerts.filter(
			(alert) => alert.status === 'new' || alert.status === 'acknowledged'
		);
	}, [state.securityAlerts]);

	// Get compliance score
	const getComplianceScore = useCallback(
		(standard: ComplianceStandard) => {
			const report = state.complianceReports.find((r) => r.standard === standard);
			return report?.score || 100;
		},
		[state.complianceReports]
	);

	// Get compliance status
	const getComplianceStatus = useCallback(
		(standard: ComplianceStandard) => {
			const report = state.complianceReports.find((r) => r.standard === standard);
			return report?.status || 'compliant';
		},
		[state.complianceReports]
	);

	// Get compliance violations
	const getComplianceViolations = useCallback(
		(standard: ComplianceStandard) => {
			const report = state.complianceReports.find((r) => r.standard === standard);
			return report?.violations || [];
		},
		[state.complianceReports]
	);

	// Get active threats
	const getActiveThreats = useCallback(() => {
		return state.threatIntelligence.filter((threat) => threat.active);
	}, [state.threatIntelligence]);

	// Get threats by severity
	const getThreatsBySeverity = useCallback(
		(severity: SecuritySeverity) => {
			return state.threatIntelligence.filter((threat) => threat.severity === severity);
		},
		[state.threatIntelligence]
	);

	// Get risk assessments
	const getCurrentRiskAssessments = useCallback(() => {
		return state.riskAssessments;
	}, [state.riskAssessments]);

	// Get high risk assessments
	const getHighRiskAssessments = useCallback(() => {
		return state.riskAssessments.filter(
			(assessment) => assessment.status === 'high' || assessment.status === 'critical'
		);
	}, [state.riskAssessments]);

	// Get average risk score
	const getAverageRiskScore = useCallback(() => {
		if (state.riskAssessments.length === 0) return 0;

		const totalScore = state.riskAssessments.reduce(
			(sum, assessment) => sum + assessment.overallRiskScore,
			0
		);
		return totalScore / state.riskAssessments.length;
	}, [state.riskAssessments]);

	// Get security trends
	const getSecurityTrends = useCallback(() => {
		// This would analyze trends over time
		return {
			eventsTrend: 'increasing', // or 'decreasing', 'stable'
			riskTrend: 'stable',
			complianceTrend: 'improving',
			threatTrend: 'stable',
		};
	}, []);

	// Get security recommendations
	const getSecurityRecommendations = useCallback(() => {
		const recommendations: string[] = [];

		// Based on current metrics and alerts
		if (state.securityAlerts.length > 5) {
			recommendations.push('High number of security alerts - review and investigate');
		}

		if (state.complianceReports.some((r) => r.score < 80)) {
			recommendations.push('Compliance scores below threshold - address violations');
		}

		if (getAverageRiskScore() > 70) {
			recommendations.push('High average risk score - implement additional security measures');
		}

		if (state.threatIntelligence.some((t) => t.severity === 'critical')) {
			recommendations.push('Critical threats detected - implement immediate mitigation');
		}

		return recommendations;
	}, [
		state.securityAlerts,
		state.complianceReports,
		state.threatIntelligence,
		getAverageRiskScore,
	]);

	// Update configuration
	const updateConfig = useCallback(
		(newConfig: Partial<UseSecurityAnalyticsConfig>) => {
			securityAnalyticsManager.updateConfig({
				enableRealTimeMonitoring: newConfig.enableRealTimeMonitoring ?? enableRealTimeMonitoring,
				enableThreatDetection: newConfig.enableThreatDetection ?? enableThreatDetection,
				enableComplianceMonitoring:
					newConfig.enableComplianceMonitoring ?? enableComplianceMonitoring,
				enableRiskAssessment: newConfig.enableRiskAssessment ?? enableRiskAssessment,
				alertThresholds: newConfig.alertThresholds ?? alertThresholds,
				autoResponse: newConfig.autoResponse ?? autoResponse,
			});

			if (debug) {
				logger.info('[useSecurityAnalytics] Configuration updated');
			}
		},
		[
			enableRealTimeMonitoring,
			enableThreatDetection,
			enableComplianceMonitoring,
			enableRiskAssessment,
			alertThresholds,
			autoResponse,
			debug,
		]
	);

	// Enable/disable monitoring
	const setMonitoringEnabled = useCallback(
		(enabled: boolean) => {
			securityAnalyticsManager.setMonitoringEnabled(enabled);
			setState((prev) => ({
				...prev,
				isMonitoring: enabled,
			}));

			if (debug) {
				logger.info('[useSecurityAnalytics] Monitoring enabled:', enabled);
			}
		},
		[debug]
	);

	return {
		// State
		...state,

		// Actions
		trackSecurityEvent: handleTrackSecurityEvent,
		trackAuthenticationFailure: handleTrackAuthenticationFailure,
		trackAuthorizationFailure: handleTrackAuthorizationFailure,
		trackTokenValidationFailure: handleTrackTokenValidationFailure,
		trackSuspiciousActivity: handleTrackSuspiciousActivity,
		trackComplianceViolation: handleTrackComplianceViolation,

		// Getters
		getCurrentSecurityMetrics,
		getCurrentComplianceReports,
		getCurrentSecurityAlerts,
		getCurrentThreatIntelligence,
		getEventsBySeverity,
		getEventsByType,
		getCriticalAlerts,
		getHighSeverityAlerts,
		getOpenAlerts,
		getComplianceScore,
		getComplianceStatus,
		getComplianceViolations,
		getActiveThreats,
		getThreatsBySeverity,
		getCurrentRiskAssessments,
		getHighRiskAssessments,
		getAverageRiskScore,
		getSecurityTrends,
		getSecurityRecommendations,

		// Configuration
		updateConfig,
		setMonitoringEnabled,
	};
};

// Hook for tracking authentication events
export const useAuthenticationSecurity = (enabled: boolean = true) => {
	const { trackAuthenticationFailure, trackSuspiciousActivity } = useSecurityAnalytics({ enabled });

	const trackLoginFailure = useCallback(
		(userId: string, reason: string, details?: Record<string, any>) => {
			return trackAuthenticationFailure(userId, reason, details);
		},
		[trackAuthenticationFailure]
	);

	const trackLoginSuccess = useCallback(
		(userId: string, details?: Record<string, any>) => {
			return trackSuspiciousActivity(`Successful login for user ${userId}`, 'low', details);
		},
		[trackSuspiciousActivity]
	);

	const trackMultipleLoginAttempts = useCallback(
		(userId: string, attemptCount: number, details?: Record<string, any>) => {
			return trackSuspiciousActivity(
				`Multiple login attempts for user ${userId}`,
				attemptCount > 5 ? 'high' : 'medium',
				{ attemptCount, ...details }
			);
		},
		[trackSuspiciousActivity]
	);

	const trackBruteForceAttempt = useCallback(
		(userId: string, details?: Record<string, any>) => {
			return trackSuspiciousActivity(
				`Brute force attack attempt on user ${userId}`,
				'critical',
				details
			);
		},
		[trackSuspiciousActivity]
	);

	return {
		trackLoginFailure,
		trackLoginSuccess,
		trackMultipleLoginAttempts,
		trackBruteForceAttempt,
	};
};

// Hook for tracking authorization events
export const useAuthorizationSecurity = (enabled: boolean = true) => {
	const { trackAuthorizationFailure, trackSuspiciousActivity } = useSecurityAnalytics({ enabled });

	const trackAccessDenied = useCallback(
		(userId: string, resource: string, action: string, details?: Record<string, any>) => {
			return trackAuthorizationFailure(userId, resource, action, details);
		},
		[trackAuthorizationFailure]
	);

	const trackPrivilegeEscalation = useCallback(
		(userId: string, details?: Record<string, any>) => {
			return trackSuspiciousActivity(
				`Privilege escalation attempt by user ${userId}`,
				'critical',
				details
			);
		},
		[trackSuspiciousActivity]
	);

	const trackUnauthorizedAccess = useCallback(
		(userId: string, resource: string, details?: Record<string, any>) => {
			return trackSuspiciousActivity(
				`Unauthorized access attempt by user ${userId} to ${resource}`,
				'high',
				details
			);
		},
		[trackSuspiciousActivity]
	);

	return {
		trackAccessDenied,
		trackPrivilegeEscalation,
		trackUnauthorizedAccess,
	};
};

// Hook for tracking token security
export const useTokenSecurity = (enabled: boolean = true) => {
	const { trackTokenValidationFailure, trackSuspiciousActivity } = useSecurityAnalytics({
		enabled,
	});

	const trackTokenExpired = useCallback(
		(tokenType: string, details?: Record<string, any>) => {
			return trackTokenValidationFailure(tokenType, 'Token expired', details);
		},
		[trackTokenValidationFailure]
	);

	const trackTokenInvalid = useCallback(
		(tokenType: string, reason: string, details?: Record<string, any>) => {
			return trackTokenValidationFailure(tokenType, reason, details);
		},
		[trackTokenValidationFailure]
	);

	const trackTokenTheft = useCallback(
		(tokenType: string, details?: Record<string, any>) => {
			return trackSuspiciousActivity(
				`Potential token theft detected for ${tokenType}`,
				'critical',
				details
			);
		},
		[trackSuspiciousActivity]
	);

	const trackTokenReuse = useCallback(
		(tokenType: string, details?: Record<string, any>) => {
			return trackSuspiciousActivity(`Token reuse detected for ${tokenType}`, 'high', details);
		},
		[trackSuspiciousActivity]
	);

	return {
		trackTokenExpired,
		trackTokenInvalid,
		trackTokenTheft,
		trackTokenReuse,
	};
};

// Hook for compliance monitoring
export const useComplianceMonitoring = (enabled: boolean = true) => {
	const {
		trackComplianceViolation,
		getComplianceScore,
		getComplianceStatus,
		getComplianceViolations,
	} = useSecurityAnalytics({ enabled });

	const trackGDPRViolation = useCallback(
		(violation: string, details?: Record<string, any>) => {
			return trackComplianceViolation('GDPR', 'Data Protection', violation, details);
		},
		[trackComplianceViolation]
	);

	const trackCCPAViolation = useCallback(
		(violation: string, details?: Record<string, any>) => {
			return trackComplianceViolation('CCPA', 'Privacy Rights', violation, details);
		},
		[trackComplianceViolation]
	);

	const trackSOC2Violation = useCallback(
		(violation: string, details?: Record<string, any>) => {
			return trackComplianceViolation('SOC2', 'Security Controls', violation, details);
		},
		[trackComplianceViolation]
	);

	const trackOAuthViolation = useCallback(
		(violation: string, details?: Record<string, any>) => {
			return trackComplianceViolation('OAuth2.1', 'OAuth Standards', violation, details);
		},
		[trackComplianceViolation]
	);

	return {
		trackGDPRViolation,
		trackCCPAViolation,
		trackSOC2Violation,
		trackOAuthViolation,
		getComplianceScore,
		getComplianceStatus,
		getComplianceViolations,
	};
};

export default useSecurityAnalytics;
