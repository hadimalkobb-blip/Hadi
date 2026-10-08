# رحلة الضحى — project notes

Everything needed to rebuild the app lives in this repository (the workspace that built 4.x was lost on 2026-10-08;
`docs/index.html` was split back into these sources byte-for-byte).

## Layout
- `build/build.py` — joins `build/src/*.js` (ORDER inside), `style.css`, `vendor/vendor.js` (qrcode 2.0.4 MIT, jsQR 1.4.0 Apache, three.js r147 MIT)
  and the data in `build/data/*.json` (QD verses+tajweed+timings+word cuts, MEDIA credits, PACKS library index, GOLDD mushaf page/sky/land).
  `site` → `site/index.html` (tests, Claude page) · `web OUT` → GitHub Pages (`docs/`) · `app OUT` → Android.
- `android/` — Java sources (MainActivity, PlayerService, ReminderReceiver, DuhaWidget, ShareProvider), res, manifest,
  `make_app.py` (assembles `android/build/assets/www`), `build_apk.sh` (aapt2 → javac → d8 → zipalign → apksigner).
  Android SDK pieces come from dl.google.com: build-tools r35 (zip unpacks to `android-15/`) and platform-35.
- `android/keystore/` — the signing key, encrypted (see its README). Hadi holds the passphrase.
- `media/scenes_app/` — the 1080p verse scenes used inside the APK (the web ones in `docs/scenes` are bigger).
- `docs/` (repo root) — the live web build and all media: audio (17 reciters), scenes, packs (library on GitHub), narr, pano, img, amb, data.
- `tools/serve.py` (range server), `tools/site.sh` (build site/ + serve :8765), `test/*.mjs` (Playwright, global npm tools).

## Release
1. `bash tools/site.sh && node test/smoke.mjs` (+ the feature tests in test/).
2. `python3 build/build.py web ../docs/index.html`.
3. `bash android/build_apk.sh OUT.apk` (bump VERSION_CODE / VERSION_NAME at its top).
4. Split the APK into ≤90 MB parts on the `apk` branch (`parts/rihlat-al-duha.apk.part-NN`, `sha256.txt`, `version.txt`, `notes.md`);
   the workflow there joins them and publishes the GitHub release. Stable link:
   https://github.com/hadimalkobb-blip/Hadi/releases/latest/download/rihlat-al-duha.apk

## Red lines
No music; nature sounds never under recitation. Real scenes without human faces, never images of prophets.
Cards and stickers never carry verse text. Recordings stay on the device. No guilt notifications, no addictive design.
Quran words are collected, built, joined or lit — never walked on, broken or hit.
