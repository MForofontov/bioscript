#!/bin/bash

# Script to build and publish all packages to npm
# Usage: ./scripts/publish-packages.sh [--yes]

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

AUTO_YES=false
if [[ "${1:-}" == "--yes" || "${1:-}" == "-y" ]]; then
  AUTO_YES=true
fi

echo "========================================="
echo "  Bioscript Package Publisher"
echo "========================================="
echo ""

if ! npm whoami &> /dev/null; then
  echo -e "${RED}Error: You must be logged in to npm${NC}"
  echo "Run: npm login"
  exit 1
fi

NPM_USER=$(npm whoami)
echo -e "${GREEN}✓ Logged in as: $NPM_USER${NC}"
echo ""

if [ "$AUTO_YES" != true ]; then
  echo -e "${YELLOW}This will publish packages to npm under the @bioscript scope.${NC}"
  read -p "Are you sure you want to continue? (yes/no): " -r
  echo
  if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Publishing cancelled."
    exit 0
  fi
fi

# Dependency order
PACKAGES=(
  "seq-utils"
  "seq-stream"
  "seq-align"
  "seq-format"
  "seq-translate"
  "seq-search"
  "seq-quality"
)

SUCCESS_COUNT=0
FAILURE_COUNT=0
SKIPPED_COUNT=0
FAILED_PACKAGES=()
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "Building and publishing packages..."
echo ""

for package in "${PACKAGES[@]}"; do
  PACKAGE_PATH="$ROOT_DIR/packages/$package"

  echo "----------------------------------------"
  echo "Processing: @bioscript/$package"
  echo "----------------------------------------"

  if [ ! -d "$PACKAGE_PATH" ]; then
    echo -e "${RED}✗ Directory not found: $PACKAGE_PATH${NC}"
    ((FAILURE_COUNT++)) || true
    FAILED_PACKAGES+=("@bioscript/$package")
    continue
  fi

  cd "$PACKAGE_PATH"

  PACKAGE_NAME="@bioscript/$package"
  CURRENT_VERSION=$(node -p "require('./package.json').version")

  echo "  Checking npm registry for version $CURRENT_VERSION..."
  if npm view "$PACKAGE_NAME@$CURRENT_VERSION" version &> /dev/null; then
    echo -e "  ${YELLOW}⚠️  Version $CURRENT_VERSION already published, skipping...${NC}"
    ((SKIPPED_COUNT++)) || true
    echo ""
    continue
  fi

  echo "  Building..."
  npm run build

  echo "  Publishing $PACKAGE_NAME@$CURRENT_VERSION..."
  if npm publish --access public; then
    echo -e "  ${GREEN}✓ Published successfully${NC}"
    ((SUCCESS_COUNT++)) || true
  else
    echo -e "  ${RED}✗ Publish failed${NC}"
    ((FAILURE_COUNT++)) || true
    FAILED_PACKAGES+=("@bioscript/$package")
  fi

  echo ""
done

cd "$ROOT_DIR"

echo "========================================="
echo "  Publishing Complete"
echo "========================================="
echo -e "${GREEN}✓ Successfully published: $SUCCESS_COUNT packages${NC}"
echo -e "${YELLOW}⏭  Skipped (already published): $SKIPPED_COUNT packages${NC}"

if [ $FAILURE_COUNT -gt 0 ]; then
  echo -e "${RED}✗ Failed to publish: $FAILURE_COUNT packages${NC}"
  echo ""
  echo "Failed packages:"
  for pkg in "${FAILED_PACKAGES[@]}"; do
    echo "  - $pkg"
  done
  exit 1
fi

echo ""
echo -e "${GREEN}Done.${NC}"
echo "Install with: npm install @bioscript/seq-search @bioscript/seq-quality"
