path = 'src/pages/flows/v9/ImplicitFlowV9.tsx'
with open(path, 'r') as f:
    content = f.read()

# Remove useCallback from react import
content = content.replace(
    "import { useCallback, useEffect, useState } from 'react';",
    "import { useEffect, useState } from 'react';"
)

# Delete styled import line
content = content.replace(
    "import styled from 'styled-components';\n",
    ''
)

# Remove ImplicitFlowSharedService from import block (keep ImplicitFlowV9Helpers)
content = content.replace(
    "import {\n\tImplicitFlowSharedService,\n\tImplicitFlowV9Helpers,\n} from '../../../services/implicitFlowSharedService';",
    "import { ImplicitFlowV9Helpers } from '../../../services/implicitFlowSharedService';"
)

# Delete entire OAuthErrorDetails type import block
content = content.replace(
    "import {\n\ttype OAuthErrorDetails,\n} from '../../../services/oauthErrorHandlingService';\n",
    ''
)

# Delete V9CredentialStorageService import
# Need to see exact line
import re
pattern = r"import \{ V9CredentialStorageService \} from '.*?';\n"
before = len(content)
content = re.sub(pattern, '', content)
print(f"V9CredentialStorageService import removed: {before - len(content)} chars")

with open(path, 'w') as f:
    f.write(content)
print("Done")
