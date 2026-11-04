# scripts

## build-wordlist.py

Generates the curated game word lists in `src/core/words/data/` (`common.txt`, `extended.txt`;
newline-separated, lowercase a–z, 3–12 letters, sorted). The output is committed; rerun only to change the lists.

These files are the **working copy** used by beta puzzles (`?v=beta`). Numbered puzzle versions use
frozen, content-addressed copies in `src/versioned/words/<hash>.txt`; editing the working copy never
changes a released puzzle. Release with `npm run release:version -- <game>` (see ARCHITECTURE.md).

```sh
python3 -m venv /tmp/wf && /tmp/wf/bin/pip install wordfreq
curl -LO https://downloads.sourceforge.net/wordlist/scowl-2020.12.07.tar.gz && tar xzf scowl-2020.12.07.tar.gz
/tmp/wf/bin/python scripts/build-wordlist.py ./scowl-2020.12.07
```

Method:

1. Dictionary: SCOWL `english-words.*` + `british-words.*` at sizes 10–50 (American-only spellings are
   never included, so lists use British spelling: _colour, centre, organise_). Only `^[a-z]+$` entries are
   kept, which drops capitalised proper nouns, apostrophes and accented words; abbreviation lists are not used,
   and vowel-less tokens are dropped.
2. Frequency: `wordfreq` Zipf score (English).
   - **common**: SCOWL size ≤ 35 and Zipf ≥ 2.6 (was 3.3 for Letter Wheel v1; loosened so everyday
     words such as _pant, veal, antler_ count), plus `wordlist-sources/extra-allowlist.txt` (a short,
     hand-picked list of everyday words the frequency data under-rates, e.g. _leaper_)
   - **extended**: SCOWL size ≤ 50 and Zipf ≥ 2.5 (excludes words already in common)
3. Offensive words removed using `wordlist-sources/ldnoobw-en.txt` plus `wordlist-sources/extra-blocklist.txt`.

## Sources & licences

- **SCOWL** (Spell Checker Oriented Word Lists), 2020.12.07, © Kevin Atkinson and contributors,
  http://wordlist.aspell.net/ — permissive MIT-like licence: _"Permission to use, copy, modify,
  distribute and sell these word lists, the associated scripts, the output created from the scripts,
  and its documentation for any purpose is hereby granted without fee, provided that the above
  copyright notice appears in all copies…"_ (see SCOWL's `Copyright` file; derived from sources incl.
  12dicts, UK Advanced Cryptics Dictionary, etc., all under compatible permissive terms).
- **wordfreq** by Robyn Speer, https://github.com/rspeer/wordfreq — code Apache-2.0; frequency data
  CC BY-SA 4.0. Only used to _filter_ words (no frequency values are shipped).
- **List of Dirty, Naughty, Obscene, and Otherwise Bad Words** (LDNOOBW),
  https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words — CC BY 4.0.
