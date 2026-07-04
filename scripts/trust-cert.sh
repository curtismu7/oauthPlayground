#!/bin/bash

# Add self-signed certificate to system trust store for local development
CERT_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )/api.ping.demo.pem"

if [ -f "$CERT_PATH" ]; then
  echo "Adding certificate to system trust store..."
  sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain "$CERT_PATH"
  echo "✓ Certificate added successfully"
else
  echo "✗ Certificate not found at $CERT_PATH"
  exit 1
fi
