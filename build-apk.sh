#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"
echo "=== Building JobBoard APK (via EAS) ==="

# Check if logged into Expo
if ! npx eas whoami 2>/dev/null; then
  echo ""
  echo "============================================="
  echo "You need to log into Expo to build the APK."
  echo ""
  echo "1. Create a free account at https://expo.dev"
  echo "2. Run: npx eas login"
  echo "============================================="
  echo ""
  echo "Alternatively, build locally with:"
  echo "  cd /opt/job-platform-mobile"
  echo "  npx expo run:android"
  exit 1
fi

echo "Triggering EAS build..."
npx eas build -p android --profile preview --non-interactive --wait 2>&1 | tee /tmp/eas-build.log

# Check for APK URL in output
APK_URL=$(grep -oE 'https://[^ "]+\\.apk' /tmp/eas-build.log | head -1)

if [ -n "$APK_URL" ]; then
  echo ""
  echo "Downloading APK..."
  mkdir -p /opt/job-platform/apk
  curl -L "$APK_URL" -o "/opt/job-platform/apk/jobboard-$(date +%Y%m%d-%H%M).apk"
  echo "✅ APK saved to /opt/job-platform/apk/"
  ls -lh /opt/job-platform/apk/
else
  echo ""
  echo "Build submitted. Check status at:"
  echo "  https://expo.dev/accounts/$(npx eas whoami 2>/dev/null || echo 'your-account')/projects/jobboard-mobile/builds"
  echo ""
  echo "Once complete, download the APK and place it in:"
  echo "  /opt/job-platform/apk/"
fi