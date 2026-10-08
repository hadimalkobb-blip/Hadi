#!/usr/bin/env bash
# Builds and signs the Android app.
#   SDK=/path/to/sdk KEY=/path/to/duha.p12 PASS_FILE=/path/to/pass.txt bash android/build_apk.sh OUT.apk
# SDK must hold build-tools (aapt2, d8, zipalign, apksigner) in $SDK/build-tools and android.jar in $SDK/platform.
# The signing key: android/keystore/README.md.
set -euo pipefail
unset JAVA_TOOL_OPTIONS
VERSION_CODE=13
VERSION_NAME=5.0
A="$(cd "$(dirname "$0")" && pwd)"
SDK="${SDK:-/home/claude/sdk}"
BT="${BT:-$SDK/android-15}"
JAR="${JAR:-$SDK/android-35/android.jar}"
KEY="${KEY:-/home/claude/keys/duha.p12}"
PASS_FILE="${PASS_FILE:-/home/claude/keys/pass.txt}"
OUT="${1:-$A/build/rihlat-al-duha.apk}"
B="$A/build"

python3 "$A/make_app.py"
rm -rf "$B/res.zip" "$B/gen" "$B/classes" "$B/dex" "$B/base.apk" "$B/aligned.apk"
mkdir -p "$B/gen" "$B/classes" "$B/dex"

"$BT/aapt2" compile --dir "$A/res" -o "$B/res.zip"
"$BT/aapt2" link -o "$B/base.apk" -I "$JAR" --manifest "$A/AndroidManifest.xml" \
  --min-sdk-version 24 --target-sdk-version 34 \
  --version-code "$VERSION_CODE" --version-name "$VERSION_NAME" \
  --java "$B/gen" -A "$B/assets" "$B/res.zip"

javac -nowarn -source 8 -target 8 -encoding UTF-8 -cp "$JAR" -d "$B/classes" \
  $(find "$A/src" "$B/gen" -name '*.java') 2>&1 | grep -v 'JAVA_TOOL_OPTIONS\|^Note:\|warning: \[options\]\|^1 warning\|^3 warnings' || true
"$BT/d8" --release --min-api 24 --lib "$JAR" --output "$B/dex" $(find "$B/classes" -name '*.class')
(cd "$B/dex" && zip -q -j "$B/base.apk" classes.dex)

"$BT/zipalign" -p -f 4 "$B/base.apk" "$B/aligned.apk"
PW="$(head -n1 "$PASS_FILE")"
"$BT/apksigner" sign --ks "$KEY" --ks-type PKCS12 --ks-key-alias duha \
  --ks-pass "pass:$PW" --key-pass "pass:$PW" \
  --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true \
  --out "$OUT" "$B/aligned.apk"
"$BT/apksigner" verify --print-certs "$OUT" | grep -i 'SHA-256' | head -1
ls -la "$OUT"
