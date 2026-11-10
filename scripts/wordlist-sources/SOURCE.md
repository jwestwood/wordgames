# Word-list sources

Working copies in `src/core/words/data/` are built by `scripts/build-wordlist.py`.
This folder holds the inputs so that build is reproducible.

## 12dicts 6.0.2 — `3of6game`

- File: `12dicts-6.0.2-3of6game.txt` (LF line endings; originally `International/3of6game.txt`).
- Release: 12dicts 6.0.2, June 2016, compiled by Alan Beale.
- Archive: https://downloads.sourceforge.net/wordlist/12dicts-6.0.2.zip
- Archive SHA-256: `64ac1d35acb66b550c7ebc56e080b62e0bad8f5984d72059dc2e05ac48780e52`
- Documentation: https://wordlist.aspell.net/12dicts-readme/
- Licence: Beale releases 12dicts to the public domain, and asks for acknowledgment.
  `3of6game` does not depend on AGID.

Trailing annotation characters (`$`, `+`, `!`, `^`, `&`, and so on) are stripped
by the build script; see the 12dicts readme for what they mean.

## SCOWL 2020.12.07 — dialect lists

- Files: `scowl-2020.12.07-american-only.txt` and `scowl-2020.12.07-british-only.txt`.
- Derived from classic SCOWL 2020.12.07 `english-words.*`, `american-words.*` and
  `british-words.*` at sizes 10, 20, 35, 40, 50, 55, 60 and 70.
- A word is American-only or British-only when it appears in that family's word
  lists and not in the shared English lists or the other dialect.
- SCOWL (Spell Checker Oriented Word Lists), © Kevin Atkinson and contributors,
  http://wordlist.aspell.net/ — permissive MIT-like licence: permission to use,
  copy, modify, distribute and sell these word lists, the associated scripts, the
  output created from the scripts, and its documentation for any purpose is
  hereby granted without fee, provided that the above copyright notice appears in
  all copies.
- Archive used to derive the lists: https://downloads.sourceforge.net/wordlist/scowl-2020.12.07.tar.gz

The build script uses the American-only list to keep official answers and
targets in British spelling (`colour`, `organise`, `centre`). American-only
forms go to the bonus list. The British-only list is kept for reference and
checks; those words already qualify as official if they pass the other filters.

## Other inputs in this folder

- `ldnoobw-en.txt` — List of Dirty, Naughty, Obscene, and Otherwise Bad Words,
  https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words,
  CC BY 4.0.
- `extra-blocklist.txt` — additional excluded words.
- `extra-allowlist.txt` — everyday words forced into the official (common) tier
  when frequency data under-rates them.

Frequency scores come from wordfreq by Robyn Speer, https://github.com/rspeer/wordfreq
— code Apache-2.0; frequency data CC BY-SA 4.0. The script uses scores only to
filter; no frequency values are shipped. wordfreq combines sources including
Google Books Ngrams and SUBTLEX.
