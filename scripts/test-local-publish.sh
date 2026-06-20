#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEST_DIR="${1:-/tmp/rangka-test-app}"
TARBALLS_DIR="$REPO_ROOT/.local-registry"

echo "==> Building all packages..."
cd "$REPO_ROOT"
pnpm build

echo "==> Packing tarballs to $TARBALLS_DIR..."
rm -rf "$TARBALLS_DIR"
mkdir -p "$TARBALLS_DIR"

PACKAGES=(shared core client cli rangka create-rangka studio-core)

for pkg in "${PACKAGES[@]}"; do
  cd "$REPO_ROOT/packages/$pkg"
  pnpm pack --pack-destination "$TARBALLS_DIR" 2>/dev/null
done

echo "==> Scaffolding test project at $TEST_DIR..."
rm -rf "$TEST_DIR"
node -e "
import('$REPO_ROOT/packages/create-rangka/dist/scaffold.js')
  .then(m => m.scaffold({ name: '$(basename "$TEST_DIR")', dir: '$TEST_DIR' }))
"

echo "==> Rewriting package.json to use local tarballs..."
cd "$TEST_DIR"

SHARED_TAR=$(ls "$TARBALLS_DIR"/rangka-shared-*.tgz 2>/dev/null || ls "$TARBALLS_DIR"/*shared*.tgz)
CORE_TAR=$(ls "$TARBALLS_DIR"/rangka-core-*.tgz 2>/dev/null || ls "$TARBALLS_DIR"/*core-0*.tgz)
CLIENT_TAR=$(ls "$TARBALLS_DIR"/rangka-client-*.tgz 2>/dev/null || ls "$TARBALLS_DIR"/*client*.tgz)
CLI_TAR=$(ls "$TARBALLS_DIR"/rangka-cli-*.tgz 2>/dev/null || ls "$TARBALLS_DIR"/*cli*.tgz)
RANGKA_TAR=$(ls "$TARBALLS_DIR"/rangka-0*.tgz)
STUDIO_TAR=$(ls "$TARBALLS_DIR"/rangka-studio-core-*.tgz 2>/dev/null || ls "$TARBALLS_DIR"/*studio-core*.tgz)

node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.dependencies = {
  'rangka': 'file:$RANGKA_TAR',
  '@rangka/cli': 'file:$CLI_TAR',
};
pkg.devDependencies = {
  '@rangka/studio-core': 'file:$STUDIO_TAR',
  'typescript': '^5.8.0',
};
pkg.pnpm = {
  overrides: {
    '@rangka/shared': 'file:$SHARED_TAR',
    '@rangka/core': 'file:$CORE_TAR',
    '@rangka/client': 'file:$CLIENT_TAR',
  },
};
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

echo "==> Installing dependencies..."
pnpm install

echo ""
echo "=== Done! ==="
echo ""
echo "Test project ready at: $TEST_DIR"
echo ""
echo "Next steps:"
echo "  cd $TEST_DIR"
echo "  pnpm dev          # start the framework"
echo "  pnpm studio       # start studio (needs PostgreSQL)"
echo ""
