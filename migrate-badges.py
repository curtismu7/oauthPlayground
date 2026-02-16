#!/usr/bin/env python3
"""
Badge Migration Script for DragDropSidebar.V2.tsx
Replaces FiCheckCircle badges with MenuVersionBadge components
"""

import re

FILE_PATH = "src/components/DragDropSidebar.V2.tsx"

# Read the file
with open(FILE_PATH, 'r') as f:
    content = f.read()

# Badge replacements mapping
replacements = [
    # V8 Flows (Blue - version 9.11.76)
    (r'badge: \(\s*<MigrationBadge title="PingOne Token Exchange \(RFC 8693\) - New Feature Implementation">\s*<FiCheckCircle />\s*</MigrationBadge>\s*\)', 
     'badge: <MenuVersionBadge version="9.11.76" type="v8" />'),
    
    (r'badge: \(\s*<MigrationBadge title="V8: Demonstrating Proof of Possession \(RFC 9449\) with mock server">\s*<FiCheckCircle />\s*</MigrationBadge>\s*\)',
     'badge: <MenuVersionBadge version="9.11.76" type="v8" />'),
    
    (r'badge: \(\s*<MigrationBadge title="V8: Simplified UI with educational content in modals">\s*<FiCheckCircle />\s*</MigrationBadge>\s*\)',
     'badge: <MenuVersionBadge version="9.11.76" type="v8" />'),
    
    (r'badge: \(\s*<MigrationBadge title="Test ALL OAuth/OIDC flow types: Auth Code, Implicit, Hybrid, Device Code, Client Credentials">\s*<FiCheckCircle />\s*</MigrationBadge>\s*\)',
     'badge: <MenuVersionBadge version="9.11.76" type="v8" />'),
    
    (r'badge: \(\s*<MigrationBadge title="Test RFC 9126 Pushed Authorization Request \(PAR\) flow">\s*<FiCheckCircle />\s*</MigrationBadge>\s*\)',
     'badge: <MenuVersionBadge version="9.11.76" type="v8" />'),
    
    # V7 Flows (Purple - version 7.2.0)
    (r'badge: \(\s*<MigrationBadge title="V7\.2: Adds optional redirectless \(pi\.flow\) with Custom Login">\s*<FiCheckCircle />\s*</MigrationBadge>\s*\)',
     'badge: <MenuVersionBadge version="7.2.0" type="v7" />'),
    
    (r'badge: \(\s*<MigrationBadge title="V7: Unified OAuth/OIDC implementation with variant selector">\s*<FiCheckCircle />\s*</MigrationBadge>\s*\)',
     'badge: <MenuVersionBadge version="7.2.0" type="v7" />'),
    
    (r'badge: \(\s*<MigrationBadge title="V7: Unified OAuth/OIDC device authorization">\s*<FiCheckCircle />\s*</MigrationBadge>\s*\)',
     'badge: <MenuVersionBadge version="7.2.0" type="v7" />'),
    
    (r'badge: \(\s*<MigrationBadge title="V7: Enhanced client credentials">\s*<FiCheckCircle />\s*</MigrationBadge>\s*\)',
     'badge: <MenuVersionBadge version="7.2.0" type="v7" />'),
    
    (r'badge: \(\s*<MigrationBadge title="V7: CIBA \(RFC 9436\) Client Initiated Backchannel Authentication - Real PingOne API">\s*<FiCheckCircle />\s*</MigrationBadge>\s*\)',
     'badge: <MenuVersionBadge version="7.2.0" type="v7" />'),
    
    (r'badge: \(\s*<MigrationBadge title="V7: Unified OAuth/OIDC hybrid flow implementation">\s*<FiCheckCircle />\s*</MigrationBadge>\s*\)',
     'badge: <MenuVersionBadge version="7.2.0" type="v7" />'),
    
    (r'badge: \(\s*<MigrationBadge title="V7: Enhanced Pushed Authorization Request with Authorization Details">\s*<FiCheckCircle />\s*</MigrationBadge>\s*\)',
     'badge: <MenuVersionBadge version="7.2.0" type="v7" />'),
    
    (r'badge: \(\s*<MigrationBadge title="V7: Enhanced PingOne Multi-Factor Authentication">\s*<FiCheckCircle />\s*</MigrationBadge>\s*\)',
     'badge: <MenuVersionBadge version="7.2.0" type="v7" />'),
    
    (r'badge: \(\s*<MigrationBadge title="V7: PingOne Workflow Library Steps 11-20 - Authorization Code with MFA">\s*<FiCheckCircle />\s*</MigrationBadge>\s*\)',
     'badge: <MenuVersionBadge version="7.2.0" type="v7" />'),
    
    (r'badge: \(\s*<MigrationBadge title="V7: PingOne Redirectless Flow \(pi\.flow\)">\s*<FiCheckCircle />\s*</MigrationBadge>\s*\)',
     'badge: <MenuVersionBadge version="7.2.0" type="v7" />'),
    
    (r'badge: \(\s*<MigrationBadge title="V7: Enhanced worker token flow">\s*<FiCheckCircle />\s*</MigrationBadge>\s*\)',
     'badge: <MenuVersionBadge version="7.2.0" type="v7" />'),
    
    # Production Features (Green - version 9.11.76)
    (r'badge: \(\s*<MigrationBadge title="Real-world MFA experience - Kroger Grocery Store mockup">\s*<FiCheckCircle />\s*</MigrationBadge>\s*\)',
     'badge: <MenuVersionBadge version="9.11.76" type="production" />'),
    
    (r'badge: \(\s*<MigrationBadge title="PingOne Authentication Flow">\s*<FiCheckCircle />\s*</MigrationBadge>\s*\)',
     'badge: <MenuVersionBadge version="9.11.76" type="production" />'),
    
    (r'badge: \(\s*<MigrationBadge title="Pushed Authorization Request Flow">\s*<FiCheckCircle />\s*</MigrationBadge>\s*\)',
     'badge: <MenuVersionBadge version="9.11.76" type="production" />'),
    
    (r'badge: \(\s*<MigrationBadge title="Validate and test PingOne worker tokens">\s*<FiCheckCircle />\s*</MigrationBadge>\s*\)',
     'badge: <MenuVersionBadge version="9.11.76" type="production" />'),
    
    (r'badge: \(\s*<MigrationBadge title="Token Analysis and Management">\s*<FiCheckCircle />\s*</MigrationBadge>\s*\)',
     'badge: <MenuVersionBadge version="9.11.76" type="production" />'),
    
    (r'badge: \(\s*<MigrationBadge title="Token Introspection - Inspect and validate OAuth tokens">\s*<FiCheckCircle />\s*</MigrationBadge>\s*\)',
     'badge: <MenuVersionBadge version="9.11.76" type="production" />'),
    
    (r'badge: \(\s*<MigrationBadge title="Token Revocation - Revoke access and refresh tokens">\s*<FiCheckCircle />\s*</MigrationBadge>\s*\)',
     'badge: <MenuVersionBadge version="9.11.76" type="production" />'),
    
    (r'badge: \(\s*<MigrationBadge title="UserInfo Flow - Retrieve user profile information">\s*<FiCheckCircle />\s*</MigrationBadge>\s*\)',
     'badge: <MenuVersionBadge version="9.11.76" type="production" />'),
    
    (r'badge: \(\s*<MigrationBadge title="PingOne Logout - RP-initiated logout with PingOne SSO">\s*<FiCheckCircle />\s*</MigrationBadge>\s*\)',
     'badge: <MenuVersionBadge version="9.11.76" type="production" />'),
    
    (r'badge: \(\s*<MigrationBadge title="PingOne User Profile & Information">\s*<FiCheckCircle />\s*</MigrationBadge>\s*\)',
     'badge: <MenuVersionBadge version="9.11.76" type="production" />'),
    
    (r'badge: \(\s*<MigrationBadge title="PingOne Total Identities metrics explorer">\s*<FiCheckCircle />\s*</MigrationBadge>\s*\)',
     'badge: <MenuVersionBadge version="9.11.76" type="production" />'),
    
    (r'badge: \(\s*<MigrationBadge title="PingOne Password Reset Operations">\s*<FiCheckCircle />\s*</MigrationBadge>\s*\)',
     'badge: <MenuVersionBadge version="9.11.76" type="production" />'),
    
    (r'badge: \(\s*<MigrationBadge title="Query and analyze PingOne audit events">\s*<FiCheckCircle />\s*</MigrationBadge>\s*\)',
     'badge: <MenuVersionBadge version="9.11.76" type="production" />'),
    
    (r'badge: \(\s*<MigrationBadge title="Real-time webhook event monitoring">\s*<FiCheckCircle />\s*</MigrationBadge>\s*\)',
     'badge: <MenuVersionBadge version="9.11.76" type="production" />'),
    
    (r'badge: \(\s*<MigrationBadge title="View organization licensing and usage information">\s*<FiCheckCircle />\s*</MigrationBadge>\s*\)',
     'badge: <MenuVersionBadge version="9.11.76" type="production" />'),
    
    (r'badge: \(\s*<MigrationBadge title="OIDC Discovery and Configuration">\s*<FiCheckCircle />\s*</MigrationBadge>\s*\)',
     'badge: <MenuVersionBadge version="9.11.76" type="production" />'),
    
    (r'badge: \(\s*<MigrationBadge title="Advanced Configuration Options">\s*<FiCheckCircle />\s*</MigrationBadge>\s*\)',
     'badge: <MenuVersionBadge version="9.11.76" type="production" />'),
    
    (r'badge: \(\s*<MigrationBadge title="JWKS Troubleshooting Guide">\s*<FiCheckCircle />\s*</MigrationBadge>\s*\)',
     'badge: <MenuVersionBadge version="9.11.76" type="production" />'),
    
    (r'badge: \(\s*<MigrationBadge title="Production-ready OAuth code in multiple languages">\s*<FiCheckCircle />\s*</MigrationBadge>\s*\)',
     'badge: <MenuVersionBadge version="9.11.76" type="production" />'),
    
    (r'badge: \(\s*<MigrationBadge title="Production-ready DaVinci SDK integration with real PingOne APIs">\s*<FiCheckCircle />\s*</MigrationBadge>\s*\)',
     'badge: <MenuVersionBadge version="9.11.76" type="production" />'),
]

# Apply all replacements
for pattern, replacement in replacements:
    content = re.sub(pattern, replacement, content, flags=re.MULTILINE | re.DOTALL)

# Remove FiCheckCircle from imports if it exists
content = re.sub(r',?\s*FiCheckCircle,?', '', content)

# Write the updated content
with open(FILE_PATH, 'w') as f:
    f.write(content)

# Count remaining FiCheckCircle instances
remaining = content.count('FiCheckCircle')
print(f"✅ Badge migration complete!")
print(f"📊 Remaining FiCheckCircle instances: {remaining}")

if remaining > 0:
    print(f"⚠️  Warning: {remaining} FiCheckCircle instances still remain")
    print("These may need manual review")
else:
    print("🎉 All FiCheckCircle badges successfully replaced!")
