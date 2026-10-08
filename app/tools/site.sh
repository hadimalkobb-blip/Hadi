#!/usr/bin/env bash
# Builds site/ (the page + links to the media in docs/) and serves it on :8765 (and app assets on :8771 if built).
set -e
P="$(cd "$(dirname "$0")/.." && pwd)"
python3 "$P/build/build.py" site "$P/site/index.html" >/dev/null
for d in amb audio data img narr pano scenes packs extra; do
  [ -e "$P/../docs/$d" ] && [ ! -e "$P/site/$d" ] && ln -s "../../docs/$d" "$P/site/$d"
done
pgrep -f "serve.py $P/site 8765" >/dev/null || (nohup python3 "$P/tools/serve.py" "$P/site" 8765 >/dev/null 2>&1 &)
sleep 0.5; echo "site: http://127.0.0.1:8765/"
