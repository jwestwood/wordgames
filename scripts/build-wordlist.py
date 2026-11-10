#!/usr/bin/env python3
"""Build curated word lists for src/core/words/data/. See scripts/README.md.

Usage:
  python3 scripts/build-wordlist.py
  python3 scripts/build-wordlist.py --out src/core/words/data --store-hashed

Requires: pip install wordfreq  (tested with wordfreq 3.x)
"""
from __future__ import annotations

import argparse
import hashlib
import os
import re
import sys
from wordfreq import zipf_frequency

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SOURCES = os.path.join(HERE, "wordlist-sources")
VALID = re.compile(r"^[a-z]+$")
# 12dicts annotation suffixes on 3of6game ($ + ! ^ & and rare others).
ANNOTATION = re.compile(r"[:$+!^&=#%;>~]+$")

# Official answers: 12dicts 3of6game, British forms, Zipf at or above this floor.
# Targets stay at 3.3 so the pangram is familiar. 2.2 is a mild floor on a list
# that is already a learner-dictionary intersection (see docs/DICTIONARY_OPTIONS.md).
COMMON_ZIPF = 2.2
TARGET_ZIPF = 3.3
MIN_LEN, MAX_LEN = 3, 12


def read_lines(path, encoding="utf-8"):
    with open(path, encoding=encoding) as f:
        return [l.strip() for l in f]


def parse_list(path, encoding="utf-8"):
    words = []
    for raw in read_lines(path, encoding):
        if not raw or raw.startswith("#"):
            continue
        words.append(raw.split()[0].lower())
    return words


def parse_3of6game(path):
    words = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            raw = line.strip().lower()
            if not raw:
                continue
            w = ANNOTATION.sub("", raw)
            if VALID.match(w):
                words.append(w)
    return words


def usable(w):
    return MIN_LEN <= len(w) <= MAX_LEN and bool(re.search(r"[aeiouy]", w))


def write_list(path, words):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(words) + "\n")


def content_hash(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        h.update(f.read())
    return h.hexdigest()[:16]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.path.join(ROOT, "src/core/words/data"))
    ap.add_argument(
        "--game",
        default=os.path.join(SOURCES, "12dicts-6.0.2-3of6game.txt"),
        help="path to 12dicts 6.0.2 International/3of6game.txt",
    )
    ap.add_argument(
        "--american-only",
        default=os.path.join(SOURCES, "scowl-2020.12.07-american-only.txt"),
    )
    ap.add_argument(
        "--store-hashed",
        action="store_true",
        help="copy each output list to src/versioned/words/<sha256-16>.txt",
    )
    args = ap.parse_args()

    bad = {w.lower() for w in read_lines(os.path.join(SOURCES, "ldnoobw-en.txt")) if w}
    bad |= {
        w
        for w in read_lines(os.path.join(SOURCES, "extra-blocklist.txt"))
        if w and not w.startswith("#")
    }
    allow = {
        w
        for w in read_lines(os.path.join(SOURCES, "extra-allowlist.txt"))
        if w and not w.startswith("#")
    }
    amer_only = {w for w in parse_list(args.american_only) if VALID.match(w)}

    game = []
    seen = set()
    for w in parse_3of6game(args.game):
        if w in seen or w in bad or not usable(w):
            continue
        seen.add(w)
        game.append(w)

    # Everyday words the frequency data under-rates (e.g. leaper).
    for w in sorted(allow):
        if VALID.match(w) and usable(w) and w not in bad and w not in seen:
            seen.add(w)
            game.append(w)

    def zipf(w):
        return 99.0 if w in allow else zipf_frequency(w, "en")

    common, bonus = [], []
    for w in sorted(seen):
        if w in amer_only:
            bonus.append(w)
            continue
        if zipf(w) >= COMMON_ZIPF:
            common.append(w)
        else:
            bonus.append(w)

    targets = [
        w
        for w in common
        if w not in allow and zipf_frequency(w, "en") >= TARGET_ZIPF
    ]

    # extended: bonus words only, so loadWords('extended') can still mean common + wider.
    extended = list(bonus)

    tiers = {
        "common": common,
        "targets": targets,
        "bonus": bonus,
        "extended": extended,
    }
    os.makedirs(args.out, exist_ok=True)
    hashed = os.path.join(ROOT, "src/versioned/words")
    for name, words in tiers.items():
        path = os.path.join(args.out, f"{name}.txt")
        write_list(path, words)
        digest = content_hash(path)
        print(f"{name} {len(words)} {digest}")
        if args.store_hashed:
            dest = os.path.join(hashed, f"{digest}.txt")
            if not os.path.exists(dest):
                with open(path, "rb") as src, open(dest, "wb") as out:
                    out.write(src.read())
                print(f"  stored {dest}")
            else:
                print(f"  exists {dest}")
    for L in range(MIN_LEN, MAX_LEN + 1):
        print(L, *(sum(1 for w in tiers[t] if len(w) == L) for t in tiers))


if __name__ == "__main__":
    try:
        main()
    except ModuleNotFoundError as e:
        print(e, file=sys.stderr)
        sys.exit(1)
