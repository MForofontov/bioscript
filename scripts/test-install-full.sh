#!/bin/bash

# Post-installation validation script
# Installs all packages locally and runs the full Jest test suite against them

set -e  # Exit on error

echo "🔧 bioscript Post-Installation Validation"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Set timezone to UTC for consistent test results
echo -e "${YELLOW}⏰ Setting timezone to UTC...${NC}"
export TZ=UTC
echo -e "${GREEN}✓ Timezone set to UTC${NC}"
echo ""

# Step 1: Build all packages
echo -e "${YELLOW}📦 Step 1: Building all packages...${NC}"
npm run build
echo -e "${GREEN}✓ Build complete${NC}"
echo ""

# Step 2: Pack and install packages locally
echo -e "${YELLOW}📦 Step 2: Packing and installing packages locally...${NC}"

# Create temp directory for tarballs
TEMP_DIR=$(mktemp -d)
echo "Using temp directory: $TEMP_DIR"

# Array to store package names
declare -a packages=(
  "seq-stream"
)

# Pack each package
echo "Packing packages..."
for pkg in "${packages[@]}"; do
  echo "  - Packing @bioscript/$pkg"
  (cd "packages/$pkg" && npm pack --pack-destination="$TEMP_DIR" > /dev/null 2>&1)
done

echo -e "${GREEN}✓ All packages packed${NC}"
echo ""

# Install packed packages
echo "Installing packed packages..."
for pkg in "${packages[@]}"; do
  # Find the tarball (it will have version in name)
  TARBALL=$(find "$TEMP_DIR" -name "bioscript-$pkg-*.tgz" | head -n 1)
  if [ -n "$TARBALL" ]; then
    echo "  - Installing @bioscript/$pkg from $TARBALL"
    npm install "$TARBALL" --no-save > /dev/null 2>&1
  else
    echo -e "${RED}✗ Could not find tarball for $pkg${NC}"
    echo "Looking for: bioscript-$pkg-*.tgz in $TEMP_DIR"
    ls -la "$TEMP_DIR"
    exit 1
  fi
done

echo -e "${GREEN}✓ All packages installed${NC}"
echo ""

# Cleanup tarballs
rm -rf "$TEMP_DIR"

# Step 3: Run all tests (Jest + E2E) against installed packages
echo -e "${YELLOW}🧪 Step 3: Running full test suite (Jest + E2E) against installed packages...${NC}"
echo "This will run both unit tests and browser tests to validate all functionality"
echo ""

# Run Jest tests
echo -e "${YELLOW}Running Jest tests...${NC}"
npm test

# Capture Jest exit code
JEST_EXIT_CODE=$?

if [ $JEST_EXIT_CODE -ne 0 ]; then
  echo -e "${RED}❌ Jest tests failed${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Jest tests passed${NC}"
echo ""

# Run E2E tests
echo -e "${YELLOW}Running Playwright E2E tests...${NC}"
npm run test:browser

# Capture E2E exit code
E2E_EXIT_CODE=$?

if [ $E2E_EXIT_CODE -ne 0 ]; then
  echo -e "${RED}❌ E2E tests failed${NC}"
  exit 1
fi
echo -e "${GREEN}✓ E2E tests passed${NC}"

# Overall success
TEST_EXIT_CODE=0

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ All post-installation tests passed!${NC}"
  echo ""
  echo "Coverage report: ./packages/seq-stream/coverage/index.html"
else
  echo -e "${RED}❌ Some post-installation tests failed${NC}"
  echo ""
  echo "Check test output above for details"
  exit 1
fi

echo ""
echo "=========================================="
echo -e "${GREEN}🎉 Post-installation validation complete!${NC}"
