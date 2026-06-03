#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"
echo "=== Building APK ==="

# Install dependencies
npm install

# Install EAS CLI
npm install -g eas-cli 2>/dev/null || true

# Build APK
echo "Building APK... (this takes a few minutes)"
npx eas build -p android --profile preview --non-interactive 2>&1 | tail -5

echo ""
echo "APK build submitted to Expo!"
echo "Check build status: https://expo.dev/accounts/pcwizz07-bot/projects/jobboard-mobile/builds"
echo ""
echo "Once built, download URL will be available from Expo dashboard."
echo "You can also set up auto-download in the build script."