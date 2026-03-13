/**
 * PingOne risk evaluation.
 * No real API call: PingOne Protect/Risk API is not integrated in this MCP server.
 * Tool returns NOT_IMPLEMENTED so callers get a real response, not placeholder data.
 */

export interface RiskEventInput {
	type?: string;
	userId?: string;
	[key: string]: unknown;
}

export interface RiskEvaluationRequest {
	environmentId: string;
	riskEvent: RiskEventInput;
	workerToken?: string;
}

export interface RiskEvaluationResult {
	success: boolean;
	result?: {
		level: string;
		recommendedAction: string;
		score: number;
		confidence: number;
	};
	details?: Record<string, unknown>;
	metadata?: Record<string, unknown>;
	raw?: unknown;
	error?: { code?: string; message: string };
}

const NOT_IMPLEMENTED_MESSAGE =
	'Risk evaluation is not implemented in this MCP server. No PingOne Protect API is called. Use the application UI or a backend that integrates PingOne Risk/Protect for real evaluations.';

/**
 * Risk evaluation: no real API call. Returns NOT_IMPLEMENTED so no placeholder/fake data is returned.
 */
export async function evaluateRisk(_request: RiskEvaluationRequest): Promise<RiskEvaluationResult> {
	return {
		success: false,
		error: {
			code: 'NOT_IMPLEMENTED',
			message: NOT_IMPLEMENTED_MESSAGE,
		},
	};
}
