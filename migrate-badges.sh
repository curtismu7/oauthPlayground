#!/bin/bash

# Badge Migration Script for DragDropSidebar.V2.tsx
# This script replaces FiCheckCircle badges with MenuVersionBadge components

FILE="src/components/DragDropSidebar.V2.tsx"

echo "🔄 Starting badge migration for $FILE..."

# Add MenuVersionBadge import after the existing imports
sed -i.bak '57a\
import MenuVersionBadge from '\''./MenuVersionBadge'\'';
' "$FILE"

# Remove FiCheckCircle from imports (it's on line 27)
sed -i '' 's/FiCheckCircle,//' "$FILE"

echo "✅ Updated imports"

# Now replace badge patterns
# V8 Flows - Blue badges (version 9.11.76)
sed -i '' 's|<MigrationBadge title="PingOne Token Exchange (RFC 8693) - New Feature Implementation">.*<FiCheckCircle />.*</MigrationBadge>|<MenuVersionBadge version="9.11.76" type="v8" />|g' "$FILE"
sed -i '' 's|<MigrationBadge title="V8: Demonstrating Proof of Possession (RFC 9449) with mock server">.*<FiCheckCircle />.*</MigrationBadge>|<MenuVersionBadge version="9.11.76" type="v8" />|g' "$FILE"
sed -i '' 's|<MigrationBadge title="V8: Simplified UI with educational content in modals">.*<FiCheckCircle />.*</MigrationBadge>|<MenuVersionBadge version="9.11.76" type="v8" />|g' "$FILE"
sed -i '' 's|<MigrationBadge title="Test ALL OAuth/OIDC flow types: Auth Code, Implicit, Hybrid, Device Code, Client Credentials">.*<FiCheckCircle />.*</MigrationBadge>|<MenuVersionBadge version="9.11.76" type="v8" />|g' "$FILE"
sed -i '' 's|<MigrationBadge title="Test RFC 9126 Pushed Authorization Request (PAR) flow">.*<FiCheckCircle />.*</MigrationBadge>|<MenuVersionBadge version="9.11.76" type="v8" />|g' "$FILE"

# V7 Flows - Purple badges (version 7.2.0)
sed -i '' 's|<MigrationBadge title="V7.2: Adds optional redirectless (pi.flow) with Custom Login">.*<FiCheckCircle />.*</MigrationBadge>|<MenuVersionBadge version="7.2.0" type="v7" />|g' "$FILE"
sed -i '' 's|<MigrationBadge title="V7: Unified OAuth/OIDC implementation with variant selector">.*<FiCheckCircle />.*</MigrationBadge>|<MenuVersionBadge version="7.2.0" type="v7" />|g' "$FILE"
sed -i '' 's|<MigrationBadge title="V7: Unified OAuth/OIDC device authorization">.*<FiCheckCircle />.*</MigrationBadge>|<MenuVersionBadge version="7.2.0" type="v7" />|g' "$FILE"
sed -i '' 's|<MigrationBadge title="V7: Enhanced client credentials">.*<FiCheckCircle />.*</MigrationBadge>|<MenuVersionBadge version="7.2.0" type="v7" />|g' "$FILE"
sed -i '' 's|<MigrationBadge title="V7: CIBA (RFC 9436) Client Initiated Backchannel Authentication - Real PingOne API">.*<FiCheckCircle />.*</MigrationBadge>|<MenuVersionBadge version="7.2.0" type="v7" />|g' "$FILE"
sed -i '' 's|<MigrationBadge title="V7: Unified OAuth/OIDC hybrid flow implementation">.*<FiCheckCircle />.*</MigrationBadge>|<MenuVersionBadge version="7.2.0" type="v7" />|g' "$FILE"
sed -i '' 's|<MigrationBadge title="V7: Enhanced Pushed Authorization Request with Authorization Details">.*<FiCheckCircle />.*</MigrationBadge>|<MenuVersionBadge version="7.2.0" type="v7" />|g' "$FILE"
sed -i '' 's|<MigrationBadge title="V7: Enhanced PingOne Multi-Factor Authentication">.*<FiCheckCircle />.*</MigrationBadge>|<MenuVersionBadge version="7.2.0" type="v7" />|g' "$FILE"
sed -i '' 's|<MigrationBadge title="V7: PingOne Workflow Library Steps 11-20 - Authorization Code with MFA">.*<FiCheckCircle />.*</MigrationBadge>|<MenuVersionBadge version="7.2.0" type="v7" />|g' "$FILE"
sed -i '' 's|<MigrationBadge title="V7: PingOne Redirectless Flow (pi.flow)">.*<FiCheckCircle />.*</MigrationBadge>|<MenuVersionBadge version="7.2.0" type="v7" />|g' "$FILE"
sed -i '' 's|<MigrationBadge title="V7: Enhanced worker token flow">.*<FiCheckCircle />.*</MigrationBadge>|<MenuVersionBadge version="7.2.0" type="v7" />|g' "$FILE"

# Production Features - Green badges (version 9.11.76)
sed -i '' 's|<MigrationBadge title="Real-world MFA experience - Kroger Grocery Store mockup">.*<FiCheckCircle />.*</MigrationBadge>|<MenuVersionBadge version="9.11.76" type="production" />|g' "$FILE"
sed -i '' 's|<MigrationBadge title="PingOne Authentication Flow">.*<FiCheckCircle />.*</MigrationBadge>|<MenuVersionBadge version="9.11.76" type="production" />|g' "$FILE"
sed -i '' 's|<MigrationBadge title="Pushed Authorization Request Flow">.*<FiCheckCircle />.*</MigrationBadge>|<MenuVersionBadge version="9.11.76" type="production" />|g' "$FILE"
sed -i '' 's|<MigrationBadge title="Validate and test PingOne worker tokens">.*<FiCheckCircle />.*</MigrationBadge>|<MenuVersionBadge version="9.11.76" type="production" />|g' "$FILE"
sed -i '' 's|<MigrationBadge title="Token Analysis and Management">.*<FiCheckCircle />.*</MigrationBadge>|<MenuVersionBadge version="9.11.76" type="production" />|g' "$FILE"
sed -i '' 's|<MigrationBadge title="Token Introspection - Inspect and validate OAuth tokens">.*<FiCheckCircle />.*</MigrationBadge>|<MenuVersionBadge version="9.11.76" type="production" />|g' "$FILE"
sed -i '' 's|<MigrationBadge title="Token Revocation - Revoke access and refresh tokens">.*<FiCheckCircle />.*</MigrationBadge>|<MenuVersionBadge version="9.11.76" type="production" />|g' "$FILE"
sed -i '' 's|<MigrationBadge title="UserInfo Flow - Retrieve user profile information">.*<FiCheckCircle />.*</MigrationBadge>|<MenuVersionBadge version="9.11.76" type="production" />|g' "$FILE"
sed -i '' 's|<MigrationBadge title="PingOne Logout - RP-initiated logout with PingOne SSO">.*<FiCheckCircle />.*</MigrationBadge>|<MenuVersionBadge version="9.11.76" type="production" />|g' "$FILE"
sed -i '' 's|<MigrationBadge title="PingOne User Profile & Information">.*<FiCheckCircle />.*</MigrationBadge>|<MenuVersionBadge version="9.11.76" type="production" />|g' "$FILE"
sed -i '' 's|<MigrationBadge title="PingOne Total Identities metrics explorer">.*<FiCheckCircle />.*</MigrationBadge>|<MenuVersionBadge version="9.11.76" type="production" />|g' "$FILE"
sed -i '' 's|<MigrationBadge title="PingOne Password Reset Operations">.*<FiCheckCircle />.*</MigrationBadge>|<MenuVersionBadge version="9.11.76" type="production" />|g' "$FILE"
sed -i '' 's|<MigrationBadge title="Query and analyze PingOne audit events">.*<FiCheckCircle />.*</MigrationBadge>|<MenuVersionBadge version="9.11.76" type="production" />|g' "$FILE"
sed -i '' 's|<MigrationBadge title="Real-time webhook event monitoring">.*<FiCheckCircle />.*</MigrationBadge>|<MenuVersionBadge version="9.11.76" type="production" />|g' "$FILE"
sed -i '' 's|<MigrationBadge title="View organization licensing and usage information">.*<FiCheckCircle />.*</MigrationBadge>|<MenuVersionBadge version="9.11.76" type="production" />|g' "$FILE"
sed -i '' 's|<MigrationBadge title="OIDC Discovery and Configuration">.*<FiCheckCircle />.*</MigrationBadge>|<MenuVersionBadge version="9.11.76" type="production" />|g' "$FILE"
sed -i '' 's|<MigrationBadge title="Advanced Configuration Options">.*<FiCheckCircle />.*</MigrationBadge>|<MenuVersionBadge version="9.11.76" type="production" />|g' "$FILE"
sed -i '' 's|<MigrationBadge title="JWKS Troubleshooting Guide">.*<FiCheckCircle />.*</MigrationBadge>|<MenuVersionBadge version="9.11.76" type="production" />|g' "$FILE"
sed -i '' 's|<MigrationBadge title="Production-ready OAuth code in multiple languages">.*<FiCheckCircle />.*</MigrationBadge>|<MenuVersionBadge version="9.11.76" type="production" />|g' "$FILE"
sed -i '' 's|<MigrationBadge title="Production-ready DaVinci SDK integration with real PingOne APIs">.*<FiCheckCircle />.*</MigrationBadge>|<MenuVersionBadge version="9.11.76" type="production" />|g' "$FILE"

echo "✅ Badge migration complete!"
echo "📊 Checking remaining FiCheckCircle instances..."
grep -c "FiCheckCircle" "$FILE" || echo "0"
echo "✅ Done! Review the changes in $FILE"
