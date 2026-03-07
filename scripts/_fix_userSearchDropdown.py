"""Fix UserSearchDropdown.tsx: theme: any -> theme: BrandTheme."""
path = '/Users/cmuir/P1Import-apps/oauth-playground/src/protect-app/components/UserSearchDropdown.tsx'
with open(path) as f:
    src = f.read()
original = src

src = src.replace(
    "import { useTheme } from '../contexts/ThemeContext';",
    "import { BrandTheme, useTheme } from '../contexts/ThemeContext';"
)
src = src.replace('{ theme: any }', '{ theme: BrandTheme }')
src = src.replace('{ theme: any;', '{ theme: BrandTheme;')

assert src != original
with open(path, 'w') as f:
    f.write(src)
print('Done')
