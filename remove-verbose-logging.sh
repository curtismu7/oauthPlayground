#!/bin/bash

# Script to remove verbose console logging from V8 services and components
# This removes repetitive render logs and service operation logs

echo "Removing verbose console logging..."

# Remove console.log from CredentialsFormV8U.tsx (keep only errors)
sed -i '' '/console\.log.*CREDENTIALS-FORM-V8.*Rendering credentials form/d' src/v8u/components/CredentialsFormV8U.tsx
sed -i '' '/console\.log.*CREDENTIALS-FORM-V8.*Token status updated/d' src/v8u/components/CredentialsFormV8U.tsx
sed -i '' '/console\.log.*CREDENTIALS-FORM-V8.*Raw token status check/d' src/v8u/components/CredentialsFormV8U.tsx
sed -i '' '/console\.log.*CREDENTIALS-FORM-V8.*Token update event received/d' src/v8u/components/CredentialsFormV8U.tsx
sed -i '' '/console\.log.*CREDENTIALS-FORM-V8.*Redirect URI check/d' src/v8u/components/CredentialsFormV8U.tsx
sed -i '' '/console\.log.*CREDENTIALS-FORM-V8.*Auto-updating redirect URI/d' src/v8u/components/CredentialsFormV8U.tsx
sed -i '' '/console\.log.*CREDENTIALS-FORM-V8.*Auto-updating post-logout redirect URI/d' src/v8u/components/CredentialsFormV8U.tsx

# Remove console.log from sharedCredentialsServiceV8.ts (keep only errors)
sed -i '' '/console\.log.*SHARED-CREDENTIALS-V8.*Loading shared credentials/d' src/v8/services/sharedCredentialsServiceV8.ts
sed -i '' '/console\.log.*SHARED-CREDENTIALS-V8.*Shared credentials loaded/d' src/v8/services/sharedCredentialsServiceV8.ts
sed -i '' '/console\.log.*SHARED-CREDENTIALS-V8.*Saving shared credentials/d' src/v8/services/sharedCredentialsServiceV8.ts
sed -i '' '/console\.log.*SHARED-CREDENTIALS-V8.*Shared credentials saved/d' src/v8/services/sharedCredentialsServiceV8.ts

# Remove console.log from redirectUriServiceV8.ts (keep only errors)
sed -i '' '/console\.log.*REDIRECT-URI-V8.*Generated redirect URI/d' src/v8/services/redirectUriServiceV8.ts
sed -i '' '/console\.log.*REDIRECT-URI-V8.*Generated post-logout redirect URI/d' src/v8/services/redirectUriServiceV8.ts
sed -i '' '/console\.log.*REDIRECT-URI-V8.*No redirect URI for flow/d' src/v8/services/redirectUriServiceV8.ts
sed -i '' '/console\.log.*REDIRECT-URI-V8.*No post-logout redirect URI/d' src/v8/services/redirectUriServiceV8.ts
sed -i '' '/console\.log.*REDIRECT-URI-V8.*Initialized redirect URIs/d' src/v8/services/redirectUriServiceV8.ts

# Remove console.log from other V8 services
for file in src/v8/services/*.ts src/v8u/services/*.ts; do
  if [ -f "$file" ]; then
    # Remove service operation logs (keep errors and warnings)
    sed -i '' '/console\.log.*\[.*SERVICE.*\].*Getting/d' "$file"
    sed -i '' '/console\.log.*\[.*SERVICE.*\].*Loaded/d' "$file"
    sed -i '' '/console\.log.*\[.*SERVICE.*\].*Saved/d' "$file"
    sed -i '' '/console\.log.*\[.*SERVICE.*\].*Retrieved/d' "$file"
    sed -i '' '/console\.log.*\[.*SERVICE.*\].*Fetched/d' "$file"
    sed -i '' '/console\.log.*\[.*SERVICE.*\].*Fetching/d' "$file"
  fi
done

echo "Verbose logging removed successfully!"
