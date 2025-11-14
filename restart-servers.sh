#!/bin/sh
# Convenience shim so existing workflows can still call ./restart-servers.sh
"$(dirname "$0")/scripts/dev/restart-servers.sh" "$@"
