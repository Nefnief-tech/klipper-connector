#!/bin/bash
# Standalone Klipper Connector Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/Nefnief-tech/klipper-connector/main/install.sh | bash
# Or: wget -qO- https://raw.githubusercontent.com/Nefnief-tech/klipper-connector/main/install.sh | bash

set -e

REPO_URL="https://github.com/Nefnief-tech/klipper-connector.git"
INSTALL_SCRIPT_URL="https://raw.githubusercontent.com/Nefnief-tech/klipper-connector/main/install.sh"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Klipper Connector Quick Installer${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Create temp dir
TMP_DIR=$(mktemp -d)
cd "$TMP_DIR"

# Download install script
echo "Downloading installer..."
curl -fsSL "$INSTALL_SCRIPT_URL" -o install.sh
chmod +x install.sh

# Run installer
bash install.sh

# Cleanup
cd -
rm -rf "$TMP_DIR"

echo ""
echo -e "${GREEN}Installation complete!${NC}"
