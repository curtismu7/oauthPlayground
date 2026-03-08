"""Fix batch 4: EnhancedStepFlow, TokenIntrospectionStep, performanceService,
credentialDebugger, parameterValidation, MFAConfigurationStepV8."""

def fix(path, replacements, label=None):
    with open(path) as f:
        src = f.read()
    original = src
    for old, new in replacements:
        if old not in src:
            print(f'  !! NOT FOUND in {label or path}: {repr(old[:70])}')
        else:
            src = src.replace(old, new)
    if src == original:
        print(f'  !! NO CHANGES: {path}')
        return
    with open(path, 'w') as f:
        f.write(src)
    remaining = src.count(': any') + src.count('as any') + src.count('<any>') + src.count('| any') + src.count('any[]')
    print(f'  {(label or path).split("/src/")[-1]}: remaining = {remaining}')


# ── 1. EnhancedStepFlow.tsx ───────────────────────────────────────────────────
print('1. EnhancedStepFlow.tsx')
fix('src/components/EnhancedStepFlow.tsx', [
    # L28: execute?: () => Promise<any>
    ('execute?: () => Promise<any>;',
     'execute?: () => Promise<unknown>;'),
    # L30: result?: any
    ('// biome-ignore lint/suspicious/noExplicitAny: Result can be various types depending on step\n        result?: any;',
     'result?: unknown;'),
    # L39: debugInfo?: Record<string, any>
    ('// biome-ignore lint/suspicious/noExplicitAny: Debug info can contain various types\n        debugInfo?: Record<string, any>;',
     'debugInfo?: Record<string, unknown>;'),
    # L48: result?: any in StepHistory
    ('// biome-ignore lint/suspicious/noExplicitAny: Result can be various types\n        result?: any;',
     'result?: unknown;'),
    # L57: onStepComplete result: any
    ('// biome-ignore lint/suspicious/noExplicitAny: Result can be various types\n        onStepComplete?: (stepId: string, result: any) => void;',
     'onStepComplete?: (stepId: string, result: unknown) => void;'),
    # L60: onFlowComplete results: Record<string, any>
    ('// biome-ignore lint/suspicious/noExplicitAny: Results can be various types\n        onFlowComplete?: (results: Record<string, any>) => void;',
     'onFlowComplete?: (results: Record<string, unknown>) => void;'),
    # L411: useState<Record<string, any>>
    ('const [stepResults, setStepResults] = useState<Record<string, any>>({});',
     'const [stepResults, setStepResults] = useState<Record<string, unknown>>({});'),
])


# ── 2. TokenIntrospectionStep.tsx ─────────────────────────────────────────────
print('2. TokenIntrospectionStep.tsx')
fix('src/components/TokenIntrospectionStep.tsx', [
    # L227-229: interface props
    ('\ttokens?: any;\n\tcredentials?: any;\n\tintrospectionResults?: any;',
     '\ttokens?: Record<string, unknown>;\n\tcredentials?: Record<string, unknown>;\n\tintrospectionResults?: Record<string, unknown>;'),
    # L239: credentials unused in destructure
    ('\ttokens,\n\tcredentials,\n\tintrospectionResults,',
     '\ttokens,\n\t_credentials,\n\tintrospectionResults,'),
    # L242-243: onResetFlow, onNavigateToTokenManagement unused
    ('\tonIntrospectToken,\n\tonResetFlow,\n\tonNavigateToTokenManagement,',
     '\tonIntrospectToken,\n\t_onResetFlow,\n\t_onNavigateToTokenManagement,'),
    # L247: secondaryColor unused
    ('const { primaryColor, secondaryColor } = useUISettings();',
     'const { primaryColor, secondaryColor: _secondaryColor } = useUISettings();'),
])


# ── 3. performanceService.ts ──────────────────────────────────────────────────
print('3. performanceService.ts')
fix('src/services/performanceService.ts', [
    # L73-74: PerformanceEntry extension for CLS
    ('if (!(entry as any).hadRecentInput) {\n                                        clsValue += (entry as any).value;',
     'if (!(entry as PerformanceEntry & { hadRecentInput: boolean; value: number }).hadRecentInput) {\n                                        clsValue += (entry as PerformanceEntry & { hadRecentInput: boolean; value: number }).value;'),
    # L106: window.import || (window as any).__dynamicImport__
    ('const originalImport = window.import || (window as any).__dynamicImport__;',
     'type DynWindow = Window & { import?: (...a: unknown[]) => Promise<unknown>; __dynamicImport__?: (...a: unknown[]) => Promise<unknown> };\n                const originalImport = (window as DynWindow).import || (window as DynWindow).__dynamicImport__;'),
    # L108: (window as any).__dynamicImport__ = async (...args: any[])
    ('(window as any).__dynamicImport__ = async (...args: any[]) => {',
     '(window as DynWindow).__dynamicImport__ = async (...args: unknown[]) => {'),
    # L150: estimateChunkSize(module: any)
    ('private estimateChunkSize(module: any): number {',
     'private estimateChunkSize(module: unknown): number {'),
])


# ── 4. credentialDebugger.ts ──────────────────────────────────────────────────
print('4. credentialDebugger.ts')
fix('src/utils/credentialDebugger.ts', [
    # L13-14: interface fields
    ('\tflowSpecificData?: any;\n\tsharedData?: any;',
     '\tflowSpecificData?: unknown;\n\tsharedData?: unknown;'),
    # L54: sharedData type
    ('const sharedData: Record<string, any> = {};',
     'const sharedData: Record<string, unknown> = {};'),
    # L258-263: window global assignments
    ('(window as any).CredentialDebugger = CredentialDebugger;',
     '(window as unknown as Record<string, unknown>).CredentialDebugger = CredentialDebugger;'),
    ('(window as any).auditCredentials = () => CredentialDebugger.auditAllFlows();',
     '(window as unknown as Record<string, unknown>).auditCredentials = () => CredentialDebugger.auditAllFlows();'),
    ('(window as any).dumpStorage = () => CredentialDebugger.dumpAllStorage();',
     '(window as unknown as Record<string, unknown>).dumpStorage = () => CredentialDebugger.dumpAllStorage();'),
    ('(window as any).clearCredentials = () => CredentialDebugger.clearAllCredentials();',
     '(window as unknown as Record<string, unknown>).clearCredentials = () => CredentialDebugger.clearAllCredentials();'),
])


# ── 5. parameterValidation.ts ─────────────────────────────────────────────────
print('5. parameterValidation.ts')
fix('src/utils/parameterValidation.ts', [
    # L8: validatedParameters: Record<string, any>
    ('\tvalidatedParameters: Record<string, any>;',
     '\tvalidatedParameters: Record<string, unknown>;'),
    # L19: validator?: (value: any) => boolean
    ('\tvalidator?: (value: any) => boolean;',
     '\tvalidator?: (value: unknown) => boolean;'),
    # L373-374: validateFlowParameters param
    ('static validateFlowParameters(\n                flowName: string,\n                parameters: Record<string, any>\n        ): ParameterValidationResult',
     'static validateFlowParameters(\n                flowName: string,\n                parameters: Record<string, unknown>\n        ): ParameterValidationResult'),
])


# ── 6. MFAConfigurationStepV8.tsx ─────────────────────────────────────────────
print('6. MFAConfigurationStepV8.tsx')
fix('src/v8/flows/shared/MFAConfigurationStepV8.tsx', [
    # Add import for MFAConfigurationServiceV8 (after last import)
    ("import type { MFAFlowBaseRenderProps } from './MFAFlowBaseV8';",
     "import { MFAConfigurationServiceV8 } from '@/v8/services/mfaConfigurationServiceV8';\nimport type { MFAFlowBaseRenderProps } from './MFAFlowBaseV8';"),
    # Replace require() in silentApiRetrieval useState
    ('\t\tconst { MFAConfigurationServiceV8 } = require(\'@/v8/services/mfaConfigurationServiceV8\');\n\t\t\t\treturn MFAConfigurationServiceV8.loadConfiguration().workerToken.silentApiRetrieval',
     '\t\t\treturn MFAConfigurationServiceV8.loadConfiguration().workerToken.silentApiRetrieval'),
    # Replace require() in showTokenAtEnd useState
    ('\t\tconst { MFAConfigurationServiceV8 } = require(\'@/v8/services/mfaConfigurationServiceV8\');\n\t\t\t\treturn MFAConfigurationServiceV8.loadConfiguration().workerToken.showTokenAtEnd',
     '\t\t\treturn MFAConfigurationServiceV8.loadConfiguration().workerToken.showTokenAtEnd'),
    # Unused props: prefix with _
    ('\tshowWorkerTokenModal,\n\tsetShowWorkerTokenModal,',
     '\t_showWorkerTokenModal,\n\tsetShowWorkerTokenModal,'),
    ('\tshowSettingsModal,\n\tsetShowSettingsModal,\n\tdeviceType,',
     '\t_showSettingsModal,\n\t_setShowSettingsModal,\n\t_deviceType,'),
])

print('\nAll done.')
