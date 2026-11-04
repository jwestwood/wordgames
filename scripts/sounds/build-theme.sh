#!/usr/bin/env bash
# Encode one sound theme into public/sounds/<theme>/<slot>.{ogg,mp3}.
#   ./build-theme.sh <theme> <map-file> <kenney-packs-dir>   (map: slot|pack-relative path|pack name)
#   ./build-theme.sh soft --synth                            (node synth-soft.mjs, then encode)
# Processing: trim silence, mono, peak-normalise to -3 dBFS, Ogg Vorbis q2 + MP3 48 kbps.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd); theme=$1; out="$here/../../public/sounds/$theme"; mkdir -p "$out"
enc() { # in slot
  local tmp=$(mktemp --suffix=.wav)
  ffmpeg -loglevel error -y -i "$1" -ac 1 -af "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse" "$tmp"
  local peak=$(ffmpeg -i "$tmp" -af volumedetect -f null - 2>&1 | sed -n 's/.*max_volume: \(-\?[0-9.]*\) dB/\1/p')
  local gain=$(awk "BEGIN{print -3 - ($peak)}")
  ffmpeg -loglevel error -y -i "$tmp" -af "volume=${gain}dB" -c:a libvorbis -q:a 2 "$out/$2.ogg"
  ffmpeg -loglevel error -y -i "$tmp" -af "volume=${gain}dB" -c:a libmp3lame -b:a 48k "$out/$2.mp3"
  rm -f "$tmp"
}
if [ "${2:-}" = "--synth" ]; then
  node "$here/synth-soft.mjs" /tmp/soft-wav >/dev/null
  for f in /tmp/soft-wav/*.wav; do enc "$f" "$(basename "$f" .wav)"; done
else
  while IFS='|' read -r slot path _; do enc "$3/$path" "$slot"; done < "$2"
fi
echo "built $theme -> $out"
