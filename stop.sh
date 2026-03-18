#!/bin/bash

###############################################################################
# Redirect script to actual stop.sh in scripts/development/
# This allows running ./stop.sh from the project root
###############################################################################

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Execute the actual stop.sh script
exec "${SCRIPT_DIR}/scripts/development/stop.sh" "$@"
