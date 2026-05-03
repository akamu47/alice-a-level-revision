#!/usr/bin/env bash
# Stamps APP_VERSION across HTML/JS so old assets are evicted on every deploy.
set -euo pipefail
cd "$(dirname "$0")"

VERSION="${1:-$(date -u +%Y%m%d%H%M%S)}"
echo "Stamping APP_VERSION=$VERSION"

# Replace ?v=APP_VERSION with the real version in HTML files
find . -name "*.html" -not -path "./node_modules/*" -print0 | while IFS= read -r -d '' f; do
  sed -i "s/?v=APP_VERSION/?v=${VERSION}/g" "$f"
done

# Inject the version into shared.js (replaces the bootstrap line)
sed -i "s|window.APP_VERSION = .*|window.APP_VERSION = '${VERSION}';|" assets/js/shared.js

# Stamp the service worker cache name
sed -i "s|const CACHE_VERSION = .*|const CACHE_VERSION = '${VERSION}';|" sw.js

echo "Done. Version: $VERSION"
