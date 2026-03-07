#!/usr/bin/env python3
"""
Fix V7FlowVariants.tsx:
1. Remove unused SectionDivider from destructuring
2. Remove showVariantSelector/onVariantChange from both component destructurings
3. Remove unused [_selectedVariant, _setSelectedVariant] useState calls (both)
4. Remove _step: number parameter from both canNavigateNext callbacks
"""
import re

path = '/Users/cmuir/P1Import-apps/oauth-playground/src/templates/V7FlowVariants.tsx'

with open(path, 'r', encoding='utf-8') as f:
    src = f.read()

# 1. Remove SectionDivider from destructuring (it's on its own line in the block)
SRC_OLD = '\tSectionDivider,\n\tCollapsibleSection,'
SRC_NEW = '\tCollapsibleSection,'
assert SRC_OLD in src, 'SectionDivider destructuring not found'
src = src.replace(SRC_OLD, SRC_NEW, 1)

# 2a. Remove showVariantSelector and onVariantChange from V7OAuthFlowVariant props destructuring
# Pattern: baseFlowName,\n\tshowVariantSelector = true,\n\tonVariantChange,\n}) =>
OLD_OAUTH_PROPS = ('\tbaseFlowName,\n\tshowVariantSelector = true,\n\tonVariantChange,\n'
                   '}) => {\n\tconst [_selectedVariant, _setSelectedVariant] = useState<\'oauth\' | \'oidc\'>(\'oauth\');')
NEW_OAUTH_PROPS = '\tbaseFlowName,\n}) => {'
assert OLD_OAUTH_PROPS in src, f'V7OAuthFlowVariant props not found'
src = src.replace(OLD_OAUTH_PROPS, NEW_OAUTH_PROPS, 1)

# 2b. Remove showVariantSelector and onVariantChange from V7OIDCFlowVariant props destructuring
OLD_OIDC_PROPS = ('\tbaseFlowName,\n\tshowVariantSelector = true,\n\tonVariantChange,\n'
                  '}) => {\n\tconst [_selectedVariant, _setSelectedVariant] = useState<\'oauth\' | \'oidc\'>(\'oidc\');')
NEW_OIDC_PROPS = '\tbaseFlowName,\n}) => {'
assert OLD_OIDC_PROPS in src, f'V7OIDCFlowVariant props not found'
src = src.replace(OLD_OIDC_PROPS, NEW_OIDC_PROPS, 1)

# 3. Remove _step: number from both canNavigateNext callbacks
src = src.replace('const canNavigateNext = useCallback((_step: number) => {', 
                  'const canNavigateNext = useCallback(() => {')

with open(path, 'w', encoding='utf-8') as f:
    f.write(src)

print('Done V7FlowVariants.tsx')
