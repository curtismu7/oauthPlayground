import os, shutil

base = '/Users/cmuir/P1Import-apps/oauth-playground'
flows = f'{base}/src/pages/flows'
archive_flows = f'{base}/archive/dead-flows'
os.makedirs(archive_flows, exist_ok=True)

dead_files = [
    'AuthorizationCodeFlowV7.tsx',
    'AuthorizationCodePostFlow.tsx',
    'DeviceFlow.tsx',
    'ExampleV7Flow.tsx',
    'ImplicitFlowOIDC.tsx',
    'ImplicitGrantFlow.refactored.tsx',
    'ImplicitPostFlow.tsx',
    'ImplicitRequestURIFlow.tsx',
    'JWTBearerTokenFlowV7.tsx',
    'KrogerGroceryStoreAccountModal.tsx',
    'KrogerGroceryStoreMFA_New.tsx',
    'MFALoginHintFlowV7.tsx',
    'OAuth2AuthorizationCodeFlow.tsx',
    'OAuthROPCFlowV7.tsx',
    'OIDCHybridFlowV7.tsx',
    'OIDCResourceOwnerPasswordFlow.tsx',
    'PARFlowV7.tsx',
    'PKCEFlow.tsx',
    'PingOneCompleteMFAFlowV7.tsx',
    'PingOneMFAWorkflowLibraryV7.tsx',
    'PingOnePARFlowV7.tsx',
    'RARFlowV7.tsx',
    'ResumeFlow.tsx',
    'SAMLBearerAssertionFlowV7.tsx',
    'SignoffFlow.tsx',
    'TestMock.tsx',
    'TokenExchangeFlowV7.tsx',
    'TokenIntrospectionFlow.tsx',
    'TokenManagementFlow.tsx',
    'TransactionApprovalFlow.tsx',
    'WorkerTokenFlowV7.tsx',
]

# Also archive these dead subdirectories
dead_dirs = [
    (f'{flows}/components', f'{archive_flows}/components'),
    (f'{flows}/styles', f'{archive_flows}/styles'),
    (f'{flows}/kroger', f'{archive_flows}/kroger'),
    (f'{flows}/_backup', f'{archive_flows}/_backup'),
    (f'{flows}/_archive_v7', f'{archive_flows}/_archive_v7'),
]

moved_files = []
for f in dead_files:
    src = f'{flows}/{f}'
    dst = f'{archive_flows}/{f}'
    if os.path.exists(src):
        shutil.move(src, dst)
        moved_files.append(f)
    else:
        print(f'MISSING file: {f}')

moved_dirs = []
for src, dst in dead_dirs:
    if os.path.exists(src):
        shutil.move(src, dst)
        moved_dirs.append(os.path.basename(src))
    else:
        print(f'MISSING dir: {src}')

print(f'Moved {len(moved_files)} files and {len(moved_dirs)} dirs to archive/dead-flows/')
print('Files:', moved_files[:5], '...')
print('Dirs:', moved_dirs)
