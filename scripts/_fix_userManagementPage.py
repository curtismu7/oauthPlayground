"""Fix UserManagementPage.tsx: theme: any -> theme: BrandTheme, remove empty Props type."""
import re

path = '/Users/cmuir/P1Import-apps/oauth-playground/src/protect-app/pages/UserManagementPage.tsx'
with open(path) as f:
    src = f.read()

original = src

# 1. Add BrandTheme to the ThemeContext import
src = src.replace(
    "import { useTheme } from '../contexts/ThemeContext';",
    "import { BrandTheme, useTheme } from '../contexts/ThemeContext';"
)

# 2. Replace all `theme: any` in styled component generics
src = src.replace('{ theme: any }', '{ theme: BrandTheme }')
src = src.replace('{ theme: any;', '{ theme: BrandTheme;')

# 3. Remove empty UserManagementPageProps type alias + its usage
src = src.replace('\ntype UserManagementPageProps = {};\n', '\n')
src = src.replace('React.FC<UserManagementPageProps>', 'React.FC')

assert src != original, 'No changes made'
with open(path, 'w') as f:
    f.write(src)
print('Done')
