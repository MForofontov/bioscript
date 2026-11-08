#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
npm ci --ignore-scripts
npm run verify
