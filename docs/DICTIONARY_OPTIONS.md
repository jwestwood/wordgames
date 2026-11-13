# Dictionary options

How Letter Wheel chooses its word lists, what other games do, and which
sources were considered. The lists themselves are built by
`scripts/build-wordlist.py`; inputs and licences are recorded in
`scripts/wordlist-sources/SOURCE.md`.

Numbered puzzle versions keep the frozen lists they were released with.
List changes ship in beta (`?v=beta`) and become a new numbered version
when released. See [ARCHITECTURE.md](../ARCHITECTURE.md) for versioning.

## What Letter Wheel needs

The site is static, so lists are bundled. Official answers should feel
like everyday English, with British spelling in targets and the required
pool (`colour`, `organise`, `centre`). A wider net of real words should
still be accepted somehow, so a valid guess is not bounced as "Not in
the word list." Obscure, offensive, proper-noun and abbreviation forms
stay out of play.

## How other word games split the lists

The usual pattern is two lists: a familiar set the player is expected to
find, and a wider set the game will accept.

| Game                                                                                               | Pattern                                                                                                                                                                                |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [NYT Spelling Bee](https://dnyuz.com/2026/08/05/why-you-sometimes-see-naughty-words-in-nyt-games/) | Closest analogue. An editor curates official words from Oxford and other sources, and leaves obscure words out so ranks such as Genius stay meaningful. There is no public bonus tier. |
| NYT Wordle                                                                                         | A small curated answer list and a much larger valid-guess list.                                                                                                                        |
| Squaredle                                                                                          | Licensed NWL2023, then split into required vs bonus by familiarity.                                                                                                                    |
| Wordscapes                                                                                         | Official grid words, plus other accepted finds as bonus.                                                                                                                               |
| Words with Friends                                                                                 | Started from ENABLE (public domain); now a private Zynga list.                                                                                                                         |
| Scrabble apps                                                                                      | Collins (CSW) or NASPA Word List (NWL). Tournament-complete, and not free to bundle.                                                                                                   |
| Letterpress                                                                                        | A public [CC0 list](https://github.com/atebits/Words), used as one large accepted lexicon.                                                                                             |

Spelling Bee-style official pools without a human editor on every seed
feel stingy. A slightly broader official list plus a visible bonus tier
(the Squaredle / Wordscapes pattern) is the practical substitute.

## Candidates

### SCOWL / ESDB

[Kevin Atkinson's Spell Checker Oriented Word Lists](https://wordlist.aspell.net/),
including the newer English Speller Database (ESDB / SCOWLv2) and the
[custom list builder](https://app.aspell.net/create). Letter Wheel v1-v3
were built from classic SCOWL 2020.12.07 (`english-words` + `british-words`)
stacked with a wordfreq Zipf cutoff. Size 35 is already a tight
"everyday" filter; stacking Zipf on top made official answers feel
small, and the extended tier was never offered to the player.

SCOWL is carefully maintained, has first-class British and American
files, and a permissive MIT-like licence (notice required). It remains
useful for dialect classification. Raising its cutoffs alone would be
the lowest-risk change, and the smallest vocabulary gain.

### 12dicts, especially `3of6game`

[Alan Beale's 12dicts](https://wordlist.aspell.net/12dicts-readme/),
version 6.0.2 (2016). Built by intersecting real dictionaries, with
lists aimed at common words rather than completeness.

`3of6game` (~65,000 words) is the list Beale recommends for word games.
It is international (six advanced-learner dictionaries, balanced
American and British), lowercase ordinary words plus inflections, with
no hyphens, phrases, proper names, abbreviations or contractions. Words
generally need three of six sources. Beale releases 12dicts to the
public domain and asks for acknowledgment. `3of6game` does not depend on
AGID, so it is a clean list to bundle. It has not been updated since
2016; newer words still come from the allowlist.

`2of12inf` is American-oriented and depends on AGID (WordNet notice
requirements). Smaller core lists (`3esl`, `6of12`, `2of12`, `2+2+3cmn`)
are useful references and often drop inflections.

### ENABLE, YAWL, Letterpress

ENABLE / ENABLE2K (~173,500, public domain) is a free word-game lexicon,
American-leaning, and broader than an official 20-40 answer list should
be. YAWL is ENABLE plus extras (~264,000, public domain). The
[Letterpress list](https://github.com/atebits/Words) (~274,000, CC0)
is derived from ENABLE / YAWL and already used by other indie games.
These are good as a wide accepted / bonus pool.

### Collins, NWL, OSPD

Collins Scrabble Words, the NASPA Word List and the Official Scrabble
Players Dictionary are the usual "is this a Scrabble word?" references.
They are copyrighted and must be licensed. They are not bundled here.

### wordfreq

[wordfreq](https://github.com/rspeer/wordfreq) is a frequency table, not
a dictionary. It remains the familiarity filter (Zipf scores). Code is
Apache-2.0; data is CC BY-SA 4.0. Attribution credits Robyn Speer (that
name) and underlying sources including Google Books Ngrams and SUBTLEX.
Scores are used only to filter; frequency values are not shipped.

### Wiktionary, dwyl, Moby, Hunspell, WordNet

Wiktionary (often via [kaikki.org](https://kaikki.org/)) is current and
huge, with uneven quality. An extracted list is generally treated as a
CC BY-SA 4.0 derivative, which is awkward to bundle as official answers.

dwyl/english-words and Moby are large, noisy dumps (misspellings,
concatenations, inconsistent variants) and are a poor fit for a
player-facing list.

Hunspell `en_GB` / `en_US` dictionaries are spell-checker lists
(including names and variants). Follow each dictionary's own licence if
you use one; they are not a dedicated game lexicon.

WordNet is a meaning database of lemmas, including multi-word phrases,
and is the wrong shape for a game list. Its notice matters only if AGID
or `2of12inf` inflections are used.

## The choice for beta

Beta official answers and targets are rebuilt from 12dicts `3of6game`,
still tiered with wordfreq:

- **Targets** (the full-wheel word): Zipf at least 3.3, so the pangram
  stays familiar.
- **Common** (official answers): British `-ise` / `-our` / `-re` forms,
  Zipf at least 2.2, plus the existing allowlist. American-only
  spellings (`color`, `organize`, `center`) go to bonus.
- **Bonus**: the rest of `3of6game` after the blocklists, including
  American-only spellings and words below the official frequency floor.
  These are accepted and counted when they fit the wheel. They do not
  fill official blanks, and they do not change stars, clues, the LETTERS
  strip or completion.

Proper nouns and abbreviations are already outside `3of6game`. The
LDNOOBW list and `extra-blocklist.txt` still apply. The unique-anagram
rule still uses the official list plus the bonus list, so a target is
rejected when it has a real-word twin.

`3of6game` is designed for word games, includes inflections, covers both
major dialects, and is public domain. The bonus tier is how a seed can
accept a real, rarer word without turning the official hunt into a
dictionary-completion exercise.

ENABLE and Letterpress remain available if a still-wider bonus list is
wanted later. Loosening the old SCOWL cutoffs, without changing source,
is the smaller alternative. Collins, NWL, OSPD, raw Wiktionary, dwyl and
Moby stay unused as bundled official lists.

These lists and the bonus tier were released as **v4**, the public default.
Existing v1–v3 seeds and saves stay on their frozen lists. Beta remains an editable
working copy of v4 (`?v=beta`).
