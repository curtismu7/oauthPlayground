#!/bin/bash

###############################################################################
# ⚠️ CRITICAL FILE - DO NOT DELETE OR MOVE ⚠️
# 
# This file is the primary entry point for starting the OAuth Playground application.
# It delegates to scripts/dev/restart-servers.sh which contains comprehensive startup logic
# including lockdown verification, health checks, status reports, and log tailing.
#
# PROTECTION:
# - This file MUST exist in the root directory
# - It is referenced in documentation and user workflows
# - Moving or deleting this file will break the startup process
# - Updates should be made to this file (it can be edited)
#
# If you need to modify startup logic, edit scripts/dev/restart-servers.sh instead.
# Only edit this file if you need to change the wrapper behavior itself.
#
###############################################################################

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Path to the actual startup script (restart-servers.sh has comprehensive capabilities)
START_SCRIPT="${SCRIPT_DIR}/scripts/dev/restart-servers.sh"

# Check if the startup script exists
if [ ! -f "$START_SCRIPT" ]; then
    echo "❌ Error: Startup script not found at $START_SCRIPT"
    echo "Please ensure scripts/dev/restart-servers.sh exists"
    exit 1
fi

# Execute the startup script with all arguments passed through
exec "$START_SCRIPT" "$@"
