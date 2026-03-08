"""Fix all 5 files in one pass."""
import re, sys

def fix(path, replacements, show_remaining=True):
    with open(path) as f:
        src = f.read()
    original = src
    for old, new in replacements:
        assert old in src, f'NOT FOUND in {path}:\n  {repr(old[:80])}'
        src = src.replace(old, new)
    assert src != original, f'No changes in {path}'
    remaining = src.count(' as any') + src.count(': any') + src.count('[: any') + src.count('any>')
    if show_remaining:
        print(f'{path.split("/")[-1]}: remaining any-like = {remaining}')
    with open(path, 'w') as f:
        f.write(src)


# ─── 1. useUserBehaviorTracking.ts ────────────────────────────────────────────
fix('src/hooks/useUserBehaviorTracking.ts', [
    ('properties?: Record<string, any>)', 'properties?: Record<string, unknown>)'),
])


# ─── 2. credentialsImportExportService.ts ─────────────────────────────────────
fix('src/services/credentialsImportExportService.ts', [
    ('\t\t[key: string]: any; // Allow additional flow-specific fields',
     '\t\t[key: string]: unknown; // Allow additional flow-specific fields'),
    ('onImportSuccess?: (credentials: any) => void;',
     'onImportSuccess?: (credentials: Record<string, unknown>) => void;'),
    ('exportCredentials(credentials: Record<string, any>',
     'exportCredentials(credentials: Record<string, unknown>'),
    ('async importCredentials(file: File, options: ImportExportOptions): Promise<any>',
     'async importCredentials(file: File, options: ImportExportOptions): Promise<unknown>'),
    # Fix unused _credentials in .then((_credentials) =>
    ('.then((_credentials) => {',
     '.then(() => {'),
    ('createExportHandler(credentials: Record<string, any>',
     'createExportHandler(credentials: Record<string, unknown>'),
    ('private sanitizeCredentials(credentials: Record<string, any>): Record<string, any>',
     'private sanitizeCredentials(credentials: Record<string, unknown>): Record<string, unknown>'),
    # L321 x2 on same line: validateCredentials(credentials: Record<string, any>)
    ('private validateCredentials(credentials: Record<string, any>)',
     'private validateCredentials(credentials: Record<string, unknown>)'),
    # L323: lastUpdated unused in destructure
    ('const { lastUpdated, ...sanitized }',
     'const { lastUpdated: _lastUpdated, ...sanitized }'),
    # L334: Record<string, any> in validateCredentials body
    ('if (credentials.environmentId && !this.isValidEnvironmentId(credentials.environmentId))',
     'if (credentials.environmentId && !this.isValidEnvironmentId(credentials.environmentId as string))'),
    # catch (_error) -> catch
    ('} catch (_error) {',
     '} catch {'),
])


# ─── 3. fieldEditingDiagnostic.ts ─────────────────────────────────────────────
fix('src/utils/fieldEditingDiagnostic.ts', [
    # analyzeField: element property access
    ('if (element.hasAttribute(\'disabled\') || (element as any).disabled)',
     'if (element.hasAttribute(\'disabled\') || (element as HTMLInputElement).disabled)'),
    ('if (element.hasAttribute(\'readonly\') || (element as any).readOnly)',
     'if (element.hasAttribute(\'readonly\') || (element as HTMLInputElement).readOnly)'),
    # hasEventListeners: _events access
    ('const events = (element as any)._events || {};',
     'const events = (element as HTMLElement & { _events?: Record<string, unknown[]> })._events || {};'),
    # fixCommonIssues: fixing disabled/readOnly/style
    ('(input as any).disabled = false;',
     '(input as HTMLInputElement).disabled = false;'),
    ('(input as any).readOnly = false;',
     '(input as HTMLInputElement).readOnly = false;'),
    ('(input as any).style.pointerEvents = \'auto\';',
     '(input as HTMLInputElement).style.pointerEvents = \'auto\';'),
    # startMonitoring/stopMonitoring: window extensions
    ('(window as any).fieldEditingObserver = observer;',
     '(window as Window & { fieldEditingObserver?: MutationObserver }).fieldEditingObserver = observer;'),
    ('const observer = (window as any).fieldEditingObserver;',
     'const observer = (window as Window & { fieldEditingObserver?: MutationObserver }).fieldEditingObserver;'),
    ('delete (window as any).fieldEditingObserver;',
     'delete (window as Window & { fieldEditingObserver?: MutationObserver }).fieldEditingObserver;'),
    # Global debug assignments
    ('(window as any).FieldEditingDiagnostic = FieldEditingDiagnostic.getInstance();',
     '(window as unknown as Record<string, unknown>).FieldEditingDiagnostic = FieldEditingDiagnostic.getInstance();'),
    ('(window as any).diagnoseFields = () => FieldEditingDiagnostic.getInstance().diagnoseAllFields();',
     '(window as unknown as Record<string, unknown>).diagnoseFields = () => FieldEditingDiagnostic.getInstance().diagnoseAllFields();'),
    ('(window as any).fixFields = () => FieldEditingDiagnostic.getInstance().fixCommonIssues();',
     '(window as unknown as Record<string, unknown>).fixFields = () => FieldEditingDiagnostic.getInstance().fixCommonIssues();'),
    ('(window as any).monitorFields = () => FieldEditingDiagnostic.getInstance().startMonitoring();',
     '(window as unknown as Record<string, unknown>).monitorFields = () => FieldEditingDiagnostic.getInstance().startMonitoring();'),
    ('(window as any).stopMonitorFields = () => FieldEditingDiagnostic.getInstance().stopMonitoring();',
     '(window as unknown as Record<string, unknown>).stopMonitorFields = () => FieldEditingDiagnostic.getInstance().stopMonitoring();'),
])


# ─── 4. flowAnalysis.ts ───────────────────────────────────────────────────────
fix('src/utils/flowAnalysis.ts', [
    # _flowData unused loop variable
    ('\t\t\tconst _flowData = flowAnalysisData[flowType as keyof typeof flowAnalysisData];\n\t\t\tconst recommendation',
     '\t\t\tconst recommendation'),
    # flowData: any params
    ('private generateReasons(_flowType: string, metrics: FlowMetrics, flowData: any)',
     'private generateReasons(_flowType: string, metrics: FlowMetrics, flowData: Record<string, unknown>)'),
    ('private generateWarnings(flowType: string, flowData: any)',
     'private generateWarnings(flowType: string, flowData: Record<string, unknown>)'),
    ('private findBestFlow(flows: any[], metric: string)',
     'private findBestFlow(flows: Record<string, unknown>[], metric: string)'),
    ('private generateComparisonSummary(flows: any[], bestFlows: any)',
     'private generateComparisonSummary(flows: Record<string, unknown>[], bestFlows: Record<string, unknown>)'),
    ('private matchesRequirements(flowType: string, requirements: any)',
     'private matchesRequirements(flowType: string, requirements: Record<string, unknown>)'),
    ('public getFlowDetails(flowType: string): any',
     'public getFlowDetails(flowType: string): unknown'),
    ('export const getFlowRecommendations = (requirements: any)',
     'export const getFlowRecommendations = (requirements: Record<string, unknown>)'),
    ('export const getFlowDetails = (flowType: string): any',
     'export const getFlowDetails = (flowType: string): unknown'),
])


# ─── 5. regressionSafeguards.ts ───────────────────────────────────────────────
fix('src/utils/regressionSafeguards.ts', [
    # errorLog type: context: any
    ('private errorLog: Array<{ timestamp: number; error: string; context: any }> = [];',
     'private errorLog: Array<{ timestamp: number; error: string; context: unknown }> = [];'),
    # logError context param
    ('private logError(message: string, context: any): void',
     'private logError(message: string, context: unknown): void'),
    # logPerformance data param
    ('private logPerformance(metric: string, data: any): void',
     'private logPerformance(metric: string, data: unknown): void'),
    # validateOAuth2Compliance tokens: any
    ('credentials: StepCredentials,\n\t\ttokens: any\n\t): FlowTestResult {\n\t\tconst startTime = Date.now();\n\t\tconst step = \'oauth2-compliance\';',
     'credentials: StepCredentials,\n\t\ttokens: unknown\n\t): FlowTestResult {\n\t\tconst startTime = Date.now();\n\t\tconst step = \'oauth2-compliance\';'),
    # validateOIDCCompliance tokens: any
    ('credentials: StepCredentials,\n\t\ttokens: any\n\t): FlowTestResult {\n\t\tconst startTime = Date.now();\n\t\tconst step = \'oidc-compliance\';',
     'credentials: StepCredentials,\n\t\ttokens: unknown\n\t): FlowTestResult {\n\t\tconst startTime = Date.now();\n\t\tconst step = \'oidc-compliance\';'),
    # validateFlowSpecific _tokens: any
    ('validateFlowSpecific(\n\t\tflowName: string,\n\t\tcredentials: StepCredentials,\n\t\t_tokens: any\n\t)',
     'validateFlowSpecific(\n\t\tflowName: string,\n\t\tcredentials: StepCredentials,\n\t\t_tokens: unknown\n\t)'),
    # runValidationSuite tokens: any
    ('credentials: StepCredentials,\n\t\ttokens: any\n\t): Promise<RegressionTestSuite>',
     'credentials: StepCredentials,\n\t\ttokens: unknown\n\t): Promise<RegressionTestSuite>'),
    # decodeJWT return type: any
    ('private decodeJWT(token: string): { header: any; payload: any; signature: string }',
     'private decodeJWT(token: string): { header: Record<string, unknown>; payload: Record<string, unknown>; signature: string }'),
    # catch (_e) -> catch
    ('} catch (_e) {',
     '} catch {'),
    # getErrorLog return type
    ('getErrorLog(): Array<{ timestamp: number; error: string; context: any }>',
     'getErrorLog(): Array<{ timestamp: number; error: string; context: unknown }>'),
    # decodeJWT usage (tokens.id_token validation uses decoded.payload which now returns Record<string, unknown>)
    # The accesses decoded.payload.iss, .sub, .aud should work fine with Record<string, unknown>
])

print('All done!')
