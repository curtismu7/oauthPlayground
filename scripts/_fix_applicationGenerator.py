#!/usr/bin/env python3
"""Fix ApplicationGenerator.tsx — remove dead styled components and dead handlers."""

path = '/Users/cmuir/P1Import-apps/oauth-playground/src/pages/ApplicationGenerator.tsx'
with open(path) as f:
    src = f.read()

original = src

# 1. Delete _Header styled component (L70-L92 + trailing newline)
src = src.replace(
    '\nconst _Header = styled.div`\n'
    '  text-align: center;\n'
    '  margin-bottom: 3rem;\n'
    '\n'
    '  h1 {\n'
    '    font-size: 2.5rem;\n'
    '    font-weight: 700;\n'
    '    color: ${({ theme }) => theme.colors.primary};\n'
    '    margin-bottom: 1rem;\n'
    '    display: flex;\n'
    '    align-items: center;\n'
    '    justify-content: center;\n'
    '    gap: 1rem;\n'
    '  }\n'
    '\n'
    '  p {\n'
    '    font-size: 1.25rem;\n'
    '    color: ${({ theme }) => theme.colors.gray600};\n'
    '    max-width: 800px;\n'
    '    margin: 0 auto;\n'
    '    line-height: 1.6;\n'
    '  }\n'
    '`;\n',
    '\n',
)
assert '_Header = styled' not in src, '_Header not removed'

# 2. Delete _ButtonGroup through end of _ResultDetails (L342-L390 + trailing newline)
src = src.replace(
    '\nconst _ButtonGroup = styled.div`\n'
    '  display: flex;\n'
    '  gap: 1rem;\n'
    '  justify-content: flex-end;\n'
    '  margin-top: 2rem;\n'
    '`;\n'
    '\n'
    'const _LoadingSpinner = styled.div`\n'
    '  width: 1rem;\n'
    '  height: 1rem;\n'
    '  border: 2px solid transparent;\n'
    '  border-top: 2px solid currentColor;\n'
    '  border-radius: 50%;\n'
    '  animation: spin 1s linear infinite;\n'
    '\n'
    '  @keyframes spin {\n'
    '    0% { transform: rotate(0deg); }\n'
    '    100% { transform: rotate(360deg); }\n'
    '  }\n'
    '`;\n'
    '\n'
    "const _ResultCard = styled.div<{ type: 'success' | 'error' }>`\n"
    "  background: ${({ type }) => (type === 'success' ? '#f0fdf4' : '#fef2f2')};\n"
    "  border: 1px solid ${({ type }) => (type === 'success' ? '#22c55e' : '#ef4444')};\n"
    '  border-radius: 0.75rem;\n'
    '  padding: 1.5rem;\n'
    '  margin-top: 2rem;\n'
    '`;\n'
    '\n'
    "const _ResultTitle = styled.h3<{ $type: 'success' | 'error' }>`\n"
    '  display: flex;\n'
    '  align-items: center;\n'
    '  gap: 0.5rem;\n'
    '  font-size: 1.25rem;\n'
    '  font-weight: 600;\n'
    "  color: ${({ $type }) => ($type === 'success' ? '#166534' : '#dc2626')};\n"
    '  margin-bottom: 1rem;\n'
    '`;\n'
    '\n'
    'const _ResultDetails = styled.div`\n'
    '  background: white;\n'
    '  border: 1px solid #e5e7eb;\n'
    '  border-radius: 0.5rem;\n'
    '  padding: 1rem;\n'
    '  font-family: monospace;\n'
    '  font-size: 0.875rem;\n'
    '  white-space: pre-wrap;\n'
    '  word-break: break-word;\n'
    '`;\n',
    '\n',
)
assert '_ButtonGroup = styled' not in src, '_ButtonGroup not removed'
assert '_ResultDetails = styled' not in src, '_ResultDetails not removed'

# 3. Blank _isSavedIndicator read: [_isSavedIndicator, setIsSavedIndicator] -> [, setIsSavedIndicator]
src = src.replace(
    '\tconst [_isSavedIndicator, setIsSavedIndicator] = useState(false);\n',
    '\tconst [, setIsSavedIndicator] = useState(false);\n',
)
assert '_isSavedIndicator,' not in src, '_isSavedIndicator read not blanked'

# 4. Delete _handleSaveConfiguration useCallback (L732-762 + trailing newline)
src = src.replace(
    '\n\tconst _handleSaveConfiguration = useCallback(() => {\n'
    '\t\ttry {\n'
    '\t\t\tconst payload: SavedAppConfiguration = {\n'
    '\t\t\t\t...formData,\n'
    '\t\t\t\tselectedAppType,\n'
    '\t\t\t};\n'
    '\n'
    "\t\t\tlocalStorage.setItem(APP_GENERATOR_STORAGE_KEY, JSON.stringify(payload));\n"
    '\n'
    '\t\t\tsetIsSavedIndicator(true);\n'
    '\t\t\tmodernMessaging.showFooterMessage({\n'
    "\t\t\t\ttype: 'status',\n"
    "\t\t\t\tmessage: 'Application configuration saved',\n"
    '\t\t\t\tduration: 4000,\n'
    '\t\t\t});\n'
    '\t\t\tsetTimeout(() => setIsSavedIndicator(false), 3000);\n'
    '\t\t} catch (error) {\n'
    '\t\t\tlogger.error(\n'
    "\t\t\t\t'ApplicationGenerator',\n"
    "\t\t\t\t'[ApplicationGenerator] Failed to save configuration:',\n"
    '\t\t\t\tundefined,\n'
    '\t\t\t\terror as Error\n'
    '\t\t\t);\n'
    '\t\t\tmodernMessaging.showBanner({\n'
    "\t\t\t\ttype: 'error',\n"
    "\t\t\t\ttitle: 'Error',\n"
    "\t\t\t\tmessage: 'Failed to save configuration',\n"
    '\t\t\t\tdismissible: true,\n'
    '\t\t\t});\n'
    '\t\t}\n'
    '\t}, [formData, selectedAppType]);\n',
    '\n',
)
assert '_handleSaveConfiguration' not in src, '_handleSaveConfiguration not removed'

# 5. Delete _handleClearSavedConfiguration useCallback (L764-792 + trailing newline)
src = src.replace(
    '\n\tconst _handleClearSavedConfiguration = useCallback(() => {\n'
    '\t\ttry {\n'
    "\t\t\tlocalStorage.removeItem(APP_GENERATOR_STORAGE_KEY);\n"
    "\t\t\tlocalStorage.removeItem('app-generator-current-step');\n"
    '\t\t\tsetFormData(createDefaultFormData());\n'
    '\t\t\tsetSelectedAppType(null);\n'
    '\t\t\tsetCreationResult(null);\n'
    '\t\t\tsetIsSavedIndicator(false);\n'
    '\t\t\tsetCurrentStep(1);\n'
    '\t\t\tmodernMessaging.showFooterMessage({\n'
    "\t\t\t\ttype: 'status',\n"
    "\t\t\t\tmessage: 'Saved configuration cleared',\n"
    '\t\t\t\tduration: 4000,\n'
    '\t\t\t});\n'
    '\t\t} catch (error) {\n'
    '\t\t\tlogger.error(\n'
    "\t\t\t\t'ApplicationGenerator',\n"
    "\t\t\t\t'[ApplicationGenerator] Failed to clear saved configuration:',\n"
    '\t\t\t\tundefined,\n'
    '\t\t\t\terror as Error\n'
    '\t\t\t);\n'
    '\t\t\tmodernMessaging.showBanner({\n'
    "\t\t\t\ttype: 'error',\n"
    "\t\t\t\ttitle: 'Error',\n"
    "\t\t\t\tmessage: 'Failed to clear configuration',\n"
    '\t\t\t\tdismissible: true,\n'
    '\t\t\t});\n'
    '\t\t}\n'
    '\t}, []);\n',
    '\n',
)
assert '_handleClearSavedConfiguration' not in src, '_handleClearSavedConfiguration not removed'

# 6. Delete _handleSaveAsPreset async function (L1014-L1098 + trailing newline)
# Find it by its distinct opening and closing
import re
# The function starts at "const _handleSaveAsPreset = async () => {" and ends at "};\n\n\tconst handleImportConfiguration"
old_preset = src[src.index('\n\tconst _handleSaveAsPreset = async () => {'):
                 src.index('\n\tconst handleImportConfiguration')]
assert '_handleSaveAsPreset' in old_preset
src = src.replace(old_preset, '\n')
assert '_handleSaveAsPreset' not in src, '_handleSaveAsPreset not removed'

# 7. Delete _handleCreateApp async function (L1181-L1418 + trailing newline)
old_create = src[src.index('\n\tconst _handleCreateApp = async () => {'):
                 src.index('\n\tconst handleCreateApplication = async')]
assert '_handleCreateApp' in old_create
src = src.replace(old_create, '\n')
assert '_handleCreateApp' not in src, '_handleCreateApp not removed'

# 8. Delete _tokenAuthMethod single-line const
src = src.replace(
    '\tconst _tokenAuthMethod = modalData?.tokenEndpointAuthMethod || formData.tokenEndpointAuthMethod;\n',
    '',
)
assert '_tokenAuthMethod' not in src, '_tokenAuthMethod not removed'

assert src != original, 'No changes made!'
with open(path, 'w') as f:
    f.write(src)
print('Done')
