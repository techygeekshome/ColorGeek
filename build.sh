#!/usr/bin/env bash
# Builds the release packages into dist/.
#   ColorGeek.zip          Chrome, Edge, Brave, Opera, Vivaldi (unzip, then Load unpacked)
#   ColorGeek-chrome.zip   same files, named for Chrome users
#   ColorGeek-edge.zip     same files, named for Edge users
#   ColorGeek-firefox.zip  Firefox package (Firefox manifest, files at the root)
set -euo pipefail
cd "$(dirname "$0")"
FILES="background.js colors.js picker.js popup.html popup.css popup.js icons"
OUT=dist; TMP=$(mktemp -d)
mkdir -p "$OUT"
rm -f "$OUT"/ColorGeek*.zip

mkdir "$TMP/colorgeek"
cp -r $FILES manifest.json LICENSE "$TMP/colorgeek/"
(cd "$TMP" && zip -qr -X pkg.zip colorgeek)
for n in ColorGeek ColorGeek-chrome ColorGeek-edge; do cp "$TMP/pkg.zip" "$OUT/$n.zip"; done

mkdir "$TMP/ff"
cp -r $FILES LICENSE "$TMP/ff/"
cp manifest.firefox.json "$TMP/ff/manifest.json"
(cd "$TMP/ff" && zip -qr -X ../ff.zip .)
cp "$TMP/ff.zip" "$OUT/ColorGeek-firefox.zip"

rm -r "$TMP"
ls -l "$OUT"
