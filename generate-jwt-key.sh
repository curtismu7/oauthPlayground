#!/bin/bash

# JWT Bearer Token Flow - Certificate Generation Utility
# This script generates an RSA private key in PEM format for use with the JWT Bearer Token Flow

echo "🔑 JWT Bearer Token Flow - Certificate Generation Utility"
echo "======================================================"

# Check if openssl is installed
if ! command -v openssl &> /dev/null; then
    echo "❌ Error: OpenSSL is not installed. Please install OpenSSL to generate certificates."
    exit 1
fi

# Generate RSA private key
echo "📝 Generating RSA private key (2048-bit)..."
openssl genpkey -algorithm RSA -out jwt_private_key.pem -outform PEM

if [ $? -eq 0 ]; then
    echo "✅ Private key generated successfully: jwt_private_key.pem"
    echo ""
    echo "📋 Key Details:"
    echo "   - Algorithm: RSA (2048-bit)"
    echo "   - Format: PEM (PKCS#8)"
    echo "   - Usage: JWT Bearer Token Flow signing"
    echo ""
    echo "🔄 Next Steps:"
    echo "   1. Copy the contents of jwt_private_key.pem"
    echo "   2. Paste it into the 'Private Key (PEM format)' field in the JWT Bearer Token Flow"
    echo "   3. Configure your OAuth server to accept this key for JWT Bearer authentication"
    echo ""
    echo "⚠️  Security Notes:"
    echo "   - This is a development/testing key - do not use in production"
    echo "   - Keep this key secure and never commit it to version control"
    echo "   - Consider using a proper certificate authority for production keys"
else
    echo "❌ Error: Failed to generate private key"
    exit 1
fi
