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

## 5.0 «الثورة» (versionCode 13) — what was added and where
- Modules (after `games.js`, before `main.js`, see ORDER): `tajweed.js` (academy, 6 games, why-cards), `gold6.js` (daily word, celebrations,
  station seal, deeds, Duha prayer, backup), `brain.js` (FSRS-4.5 per verse in `S.mem`, answer log, adaptive games, the coach),
  `prophets.js` (nights and dawns of the prophets, duas, bedtime and Friday stories, Hijra map), `games2.js` (escape room, caravan,
  heads-up, letters, crossword), `v50.js` (what's new). Styles in `build/src/style50.css`.
- Data: `build/data/tjd.json` ← `content/tajweed.py` (45 spots, 8 families, rules with harakat), `prd.json` ← `content/prophets.py`,
  `prn.json` + `docs/extra/narr2/*.mp3` ← `content/narrate.py` (Piper ar_JO-kareem, each part checked by faster-whisper, all ≥ 0.93),
  `hijra_map.json` (Natural Earth 10m land). Verse audio for the stories: `docs/extra/ayat/SSSAAA.mp3` (EveryAyah, Alafasy 64k).
- Every quoted verse goes through `content/quran.py` (`exact()`/`fix_quotes`) so the text equals Tanzil Uthmani 1.1 letter for letter.
- Routes: `go('tja'|'coach'|…)` and `V50_ROUTES` (wordle, deeds, duhapr, weak, prophets, yunus, yusuf, hijra, duas, bedtime, friday,
  escape, caravan, letters2, crossword, headsup, whatsnew). New games join `allGames()` through `TJ_GAMES` and `GAMES_50`.
- Android: WebView file chooser (backup «أرجِع من ملف»), ShareProvider returns real MIME types. Key: a new key since 5.0
  (the 4.x key was lost with the old workspace), so 4.x users uninstall once; from 5.0 on, updates install over.
- Tests: `test/tj_test.mjs`, `v44_test.mjs`, `pr_test.mjs`, `g2_test.mjs`, `v50_test.mjs` (+ `smoke.mjs` with `ROUTES=`).
  `BASE=http://127.0.0.1:PORT/` runs them against `docs/` or `android/build/assets/www` too.

## Red lines
No music; nature sounds never under recitation. Real scenes without human faces, never images of prophets.
Cards and stickers never carry verse text. Recordings stay on the device. No guilt notifications, no addictive design.
Quran words are collected, built, joined or lit — never walked on, broken or hit.
