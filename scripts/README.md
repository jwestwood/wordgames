# scripts

## build-wordlist.py

Generates the curated game word lists in `src/core/words/data/` (`common.txt`,
`targets.txt`, `bonus.txt`, `extended.txt`; newline-separated, lowercase a-z,
3-12 letters, sorted). `extended.txt` currently matches `bonus.txt`, so
`loadWords('extended')` still returns the official list plus the wider tier.
The output is committed; rerun only to change the lists.

These files are the **working copy** used by beta puzzles (`?v=beta`). Numbered
puzzle versions use frozen, content-addressed copies in
`src/versioned/words/<hash>.txt`; editing the working copy never changes a
released puzzle. Release with `npm run release:version -- <game>` (see
ARCHITECTURE.md). The current beta lists are also stored under those hashes
when the script is run with `--store-hashed`.

```sh
python3 -m venv /tmp/wf && /tmp/wf/bin/pip install wordfreq
/tmp/wf/bin/python scripts/build-wordlist.py --store-hashed
```

Sources live in `scripts/wordlist-sources/` (see `SOURCE.md` there). Method:

1. Dictionary: 12dicts 6.0.2 `3of6game` (public domain; annotations stripped).
   Only `^[a-z]+$` entries of 3-12 letters with a vowel or y are kept.
2. Dialect: American-only spellings, from SCOWL 2020.12.07 `american-words`
   minus the shared English and British lists, go to **bonus**. Official
   answers and targets use British forms (`colour`, `centre`, `organise`).
3. Frequency: `wordfreq` Zipf score (English).
   - **common**: in `3of6game` (or the allowlist), not American-only, Zipf ≥ 2.2
   - **targets**: subset of common, Zipf ≥ 3.3, allowlist excluded — the
     stricter list Letter Wheel draws its full-wheel word from
   - **bonus** / **extended**: remaining `3of6game` words after the blocklists,
     including American-only spellings and words below the official Zipf floor
4. Offensive words removed using `wordlist-sources/ldnoobw-en.txt` plus
   `wordlist-sources/extra-blocklist.txt`. Everyday words the frequency data
   under-rates (`extra-allowlist.txt`, e.g. _leaper_) are forced into common.

See [docs/DICTIONARY_OPTIONS.md](../docs/DICTIONARY_OPTIONS.md) for other
dictionary options and why this mix was chosen.

## Sources & licences

- **12dicts** 6.0.2, `3of6game`, compiled by Alan Beale,
  https://wordlist.aspell.net/12dicts-readme/ — released to the public domain,
  with a request for acknowledgment.
- **SCOWL** (Spell Checker Oriented Word Lists), 2020.12.07, © Kevin Atkinson
  and contributors, http://wordlist.aspell.net/ — used here for American-only
  vs British-only dialect lists. Permissive MIT-like licence: _"Permission to
  use, copy, modify, distribute and sell these word lists, the associated
  scripts, the output created from the scripts, and its documentation for any
  purpose is hereby granted without fee, provided that the above copyright
  notice appears in all copies…"_ (see SCOWL's `Copyright` file).
- **wordfreq** by Robyn Speer, https://github.com/rspeer/wordfreq — code
  Apache-2.0; frequency data CC BY-SA 4.0. Only used to _filter_ words (no
  frequency values are shipped).
- **List of Dirty, Naughty, Obscene, and Otherwise Bad Words** (LDNOOBW),
  https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words
  — CC BY 4.0.
