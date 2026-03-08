"""Fix NewAuthContext.tsx (7E)."""
with open('src/contexts/NewAuthContext.tsx') as f:
    src = f.read()

replacements = [
    # L328: require-atomic-updates on isLoadingConfiguration
    (
        '\t} finally {\n\t\tisLoadingConfiguration = false;\n\t}\n}\n\nexport const AuthProvider',
        '\t} finally {\n\t\t// eslint-disable-next-line require-atomic-updates\n\t\tisLoadingConfiguration = false;\n\t}\n}\n\nexport const AuthProvider'
    ),
    # L488: require-atomic-updates on isHandlingChange
    (
        '\t\t\t} finally {\n\t\t\t\tisHandlingChange = false;\n\t\t\t}',
        '\t\t\t} finally {\n\t\t\t\t// eslint-disable-next-line require-atomic-updates\n\t\t\t\tisHandlingChange = false;\n\t\t\t}'
    ),
    # L1966: (config?.pingone as any) || (config as any)
    (
        '\t\t// biome-ignore lint/suspicious/noExplicitAny: legacy config shape, types not exported\n'
        '\t\tconst pingoneConfig = (config?.pingone as any) || (config as any) || {};',
        '\t\tconst pingoneConfig = (config?.pingone as Record<string, unknown>) || (config as Record<string, unknown>) || {};'
    ),
    # L2066: if (!(window as any).__useAuthErrorLogged) {
    (
        '\t\t\t// biome-ignore lint/suspicious/noExplicitAny: custom window property for HMR dedup\n'
        '\t\t\tif (!(window as any).__useAuthErrorLogged) {',
        '\t\t\tif (!(window as unknown as Record<string, unknown>).__useAuthErrorLogged) {'
    ),
    # L2072: (window as any).__useAuthErrorLogged = true;
    (
        '\t\t\t\t// biome-ignore lint/suspicious/noExplicitAny: custom window property for HMR dedup\n'
        '\t\t\t\t(window as any).__useAuthErrorLogged = true;',
        '\t\t\t\t(window as unknown as Record<string, unknown>).__useAuthErrorLogged = true;'
    ),
    # L2076: (window as any).__useAuthErrorLogged = false;
    (
        '\t\t\t\t\t// biome-ignore lint/suspicious/noExplicitAny: custom window property for HMR dedup\n'
        '\t\t\t\t\t(window as any).__useAuthErrorLogged = false;',
        '\t\t\t\t\t(window as unknown as Record<string, unknown>).__useAuthErrorLogged = false;'
    ),
]

for old, new in replacements:
    if old in src:
        src = src.replace(old, new)
        print(f'  Fixed: {repr(old[:60])}')
    else:
        print(f'  NOT FOUND: {repr(old[:60])}')

with open('src/contexts/NewAuthContext.tsx', 'w') as f:
    f.write(src)
print('Done.')
