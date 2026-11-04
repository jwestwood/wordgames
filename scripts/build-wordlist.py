#!/usr/bin/env python3
"""Build curated word lists for src/core/words/data/. See scripts/README.md.

Usage: python3 scripts/build-wordlist.py /path/to/scowl-2020.12.07
Requires: pip install wordfreq  (tested with wordfreq 3.x)
"""
import os, re, sys
from wordfreq import zipf_frequency

SCOWL = sys.argv[1] if len(sys.argv) > 1 else '/tmp/scowl-2020.12.07'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src/core/words/data')
MIN_LEN, MAX_LEN = 3, 12
# tier: (max SCOWL size, min Zipf frequency)
TIERS = {'common': (35, 3.3), 'extended': (50, 2.5)}
# Spelling-neutral + British-specific lists only (American-only spellings excluded).
FAMILIES = ['english-words', 'british-words']
SIZES = [10, 20, 35, 40, 50]
VALID = re.compile(r'^[a-z]+$')

def read(path):
    with open(path, encoding='latin-1') as f:
        return [l.strip() for l in f]

size_of = {}
for fam in FAMILIES:
    for s in SIZES:
        p = os.path.join(SCOWL, 'final', f'{fam}.{s}')
        if not os.path.exists(p):
            continue
        for w in read(p):
            if VALID.match(w):  # drops capitalised proper nouns, apostrophes, accents
                size_of[w] = min(size_of.get(w, 99), s)

here = os.path.dirname(os.path.abspath(__file__))
bad = {w.lower() for w in read(os.path.join(here, 'wordlist-sources/ldnoobw-en.txt')) if w}
bad |= {w for w in read(os.path.join(here, 'wordlist-sources/extra-blocklist.txt')) if w and not w.startswith('#')}

tiers = {t: [] for t in TIERS}
for w, s in sorted(size_of.items()):
    if not (MIN_LEN <= len(w) <= MAX_LEN) or w in bad:
        continue
    if not re.search(r'[aeiouy]', w):  # vowel-less strings are abbreviations (e.g. "nth", "tbsp")
        continue
    z = zipf_frequency(w, 'en')
    for t, (maxsize, minz) in TIERS.items():
        if s <= maxsize and z >= minz:
            tiers[t].append(w)
            break

os.makedirs(OUT, exist_ok=True)
for t, words in tiers.items():
    with open(os.path.join(OUT, f'{t}.txt'), 'w') as f:
        f.write('\n'.join(words) + '\n')
    print(t, len(words))
for L in range(MIN_LEN, MAX_LEN + 1):
    print(L, *(sum(1 for w in tiers[t] if len(w) == L) for t in tiers))
