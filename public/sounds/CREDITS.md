# Sound credits

Sounds are grouped into **sound themes** (`src/core/audio/themes.ts`): every theme maps the same slots
(`tap`, `success`, `star`, …) to files. Classic lives in `public/sounds/`, the others in
`public/sounds/<theme>/`. All are CC0. Rebuild a theme with `scripts/sounds/build-theme.sh`.

## Classic

All sounds are by **Kenney** (https://kenney.nl), licensed **Creative Commons Zero (CC0 1.0)** —
http://creativecommons.org/publicdomain/zero/1.0/ (verified in each pack's License.txt, downloaded 2026-11-04).
Attribution is not required but appreciated.

Processing: trimmed leading/trailing silence, mono, peak-normalised to −3 dBFS (ffmpeg), encoded as
Ogg Vorbis (q2) + MP3 48 kbps fallback. Relative loudness is balanced via per-sound volume in
`src/core/audio/sounds.ts`.

| Sound           | Pack                                                          | Original file          |
| --------------- | ------------------------------------------------------------- | ---------------------- |
| `tap`           | [Interface Sounds](https://kenney.nl/assets/interface-sounds) | `select_002.ogg`       |
| `button`        | [UI Audio](https://kenney.nl/assets/ui-audio)                 | `click1.ogg`           |
| `error`         | [Interface Sounds](https://kenney.nl/assets/interface-sounds) | `error_006.ogg`        |
| `success`       | [Interface Sounds](https://kenney.nl/assets/interface-sounds) | `confirmation_001.ogg` |
| `success-big`   | [Music Jingles](https://kenney.nl/assets/music-jingles)       | `jingles_STEEL09.ogg`  |
| `success-epic`  | [Music Jingles](https://kenney.nl/assets/music-jingles)       | `jingles_HIT15.ogg`    |
| `star`          | [Music Jingles](https://kenney.nl/assets/music-jingles)       | `jingles_PIZZI00.ogg`  |
| `perfect`       | [Music Jingles](https://kenney.nl/assets/music-jingles)       | `jingles_PIZZI07.ogg`  |
| `shuffle`       | [Casino Audio](https://kenney.nl/assets/casino-audio)         | `card-fan-1.ogg`       |
| `delete`        | [Interface Sounds](https://kenney.nl/assets/interface-sounds) | `back_002.ogg`         |
| `clear`         | [Interface Sounds](https://kenney.nl/assets/interface-sounds) | `minimize_003.ogg`     |
| `word-land`     | [Casino Audio](https://kenney.nl/assets/casino-audio)         | `card-place-1.ogg`     |
| `already-found` | [Interface Sounds](https://kenney.nl/assets/interface-sounds) | `question_001.ogg`     |
| `copy`          | [Interface Sounds](https://kenney.nl/assets/interface-sounds) | `drop_002.ogg`         |
| `dice`          | [Casino Audio](https://kenney.nl/assets/casino-audio)         | `die-throw-1.ogg`      |
| `open`          | [Interface Sounds](https://kenney.nl/assets/interface-sounds) | `open_001.ogg`         |
| `close`         | [Interface Sounds](https://kenney.nl/assets/interface-sounds) | `close_001.ogg`        |

## Soft (`public/sounds/soft/`)

Original sounds synthesised for this project by `scripts/sounds/synth-soft.mjs` (sine tones with a soft
attack, exponential decay and a faint octave partial; C-major intervals). Dedicated to the public domain
(**CC0 1.0**). Same processing chain as below.

## Tabletop (`public/sounds/tabletop/`)

By **Kenney**, **CC0 1.0** (packs' License.txt). Same processing as Classic.

| Slot            | Pack                                                    | Original file                |
| --------------- | ------------------------------------------------------- | ---------------------------- |
| `tap`           | [Impact Sounds](https://kenney.nl/assets/impact-sounds) | `impactWood_light_000.ogg`   |
| `button`        | [Impact Sounds](https://kenney.nl/assets/impact-sounds) | `impactPlank_medium_000.ogg` |
| `error`         | [Impact Sounds](https://kenney.nl/assets/impact-sounds) | `impactSoft_heavy_000.ogg`   |
| `success`       | [Casino Audio](https://kenney.nl/assets/casino-audio)   | `chip-lay-1.ogg`             |
| `success-big`   | [Casino Audio](https://kenney.nl/assets/casino-audio)   | `chips-stack-1.ogg`          |
| `success-epic`  | [Casino Audio](https://kenney.nl/assets/casino-audio)   | `chips-collide-1.ogg`        |
| `star`          | [Impact Sounds](https://kenney.nl/assets/impact-sounds) | `impactBell_heavy_000.ogg`   |
| `perfect`       | [Impact Sounds](https://kenney.nl/assets/impact-sounds) | `impactBell_heavy_002.ogg`   |
| `shuffle`       | [Casino Audio](https://kenney.nl/assets/casino-audio)   | `card-shuffle.ogg`           |
| `delete`        | [Impact Sounds](https://kenney.nl/assets/impact-sounds) | `impactWood_light_002.ogg`   |
| `clear`         | [Casino Audio](https://kenney.nl/assets/casino-audio)   | `card-slide-1.ogg`           |
| `word-land`     | [Casino Audio](https://kenney.nl/assets/casino-audio)   | `card-place-2.ogg`           |
| `already-found` | [Impact Sounds](https://kenney.nl/assets/impact-sounds) | `impactSoft_medium_000.ogg`  |
| `copy`          | [Casino Audio](https://kenney.nl/assets/casino-audio)   | `chip-lay-2.ogg`             |
| `dice`          | [Casino Audio](https://kenney.nl/assets/casino-audio)   | `dice-throw-1.ogg`           |
| `open`          | [Casino Audio](https://kenney.nl/assets/casino-audio)   | `cards-pack-open-1.ogg`      |
| `close`         | [Casino Audio](https://kenney.nl/assets/casino-audio)   | `card-shove-1.ogg`           |

## Arcade (`public/sounds/arcade/`)

By **Kenney**, **CC0 1.0** (packs' License.txt). Same processing as Classic.

| Slot            | Pack                                                    | Original file       |
| --------------- | ------------------------------------------------------- | ------------------- |
| `tap`           | [Digital Audio](https://kenney.nl/assets/digital-audio) | `tone1.ogg`         |
| `button`        | [Digital Audio](https://kenney.nl/assets/digital-audio) | `pepSound1.ogg`     |
| `error`         | [Digital Audio](https://kenney.nl/assets/digital-audio) | `lowDown.ogg`       |
| `success`       | [Digital Audio](https://kenney.nl/assets/digital-audio) | `twoTone1.ogg`      |
| `success-big`   | [Digital Audio](https://kenney.nl/assets/digital-audio) | `threeTone1.ogg`    |
| `success-epic`  | [Digital Audio](https://kenney.nl/assets/digital-audio) | `powerUp2.ogg`      |
| `star`          | [Music Jingles](https://kenney.nl/assets/music-jingles) | `jingles_NES00.ogg` |
| `perfect`       | [Music Jingles](https://kenney.nl/assets/music-jingles) | `jingles_NES03.ogg` |
| `shuffle`       | [Digital Audio](https://kenney.nl/assets/digital-audio) | `phaserUp1.ogg`     |
| `delete`        | [Digital Audio](https://kenney.nl/assets/digital-audio) | `pepSound3.ogg`     |
| `clear`         | [Digital Audio](https://kenney.nl/assets/digital-audio) | `phaserDown1.ogg`   |
| `word-land`     | [Digital Audio](https://kenney.nl/assets/digital-audio) | `highUp.ogg`        |
| `already-found` | [Digital Audio](https://kenney.nl/assets/digital-audio) | `lowThreeTone.ogg`  |
| `copy`          | [Digital Audio](https://kenney.nl/assets/digital-audio) | `pepSound2.ogg`     |
| `dice`          | [Digital Audio](https://kenney.nl/assets/digital-audio) | `phaseJump1.ogg`    |
| `open`          | [Digital Audio](https://kenney.nl/assets/digital-audio) | `pepSound4.ogg`     |
| `close`         | [Digital Audio](https://kenney.nl/assets/digital-audio) | `pepSound5.ogg`     |
