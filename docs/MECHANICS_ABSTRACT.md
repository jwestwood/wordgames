# Letter Wheel — abstract mechanics

A short, design-oriented description of the **v4** (public default) puzzle, for comparing Letter Wheel with other word games. Player-facing detail lives in [GAME_MECHANICS.md](../GAME_MECHANICS.md). This note does not cover implementation, older numbered versions, or the editable beta copy, except where a contrast is needed.

## Core loop

The player is given a closed bag of letters arranged as a wheel. They form words from that bag, submit a guess, and learn immediately whether it is official, a bonus find, a repeat, or invalid. Official finds fill known blanks in a list of fixed length. Play continues, without a clock, until the player is satisfied — typically at a star threshold, or when every official word is found.

## Inputs and constraints

- **Letter set.** An 8–10 letter everyday word (the target) is broken into tiles: one letter sits in the centre; the rest, including any extra copies of the centre letter, sit on the rim. The bag is a multiset — doubled letters only exist if the target has them.
- **Required centre.** Every accepted word, official or bonus, must use the centre letter.
- **Minimum length.** Words must be at least four letters.
- **Reuse.** Each tile may be used at most once in a single guess. The same letters are available again for the next guess. A word, once found, cannot be scored again.

The official answers are not “any English word that fits.” They are every legal spelling that also appears in a familiar everyday word list. Wider real spellings that fit the same constraints can still be accepted as bonus words (see Assistance and rewards).

There is exactly one full-wheel word: the target itself. No other accepted word is an anagram of it.

## Goal, win condition, and progress

The official goal is to find every word in a known-size official pool (always 20–40 words on v4). A **perfect** board is that complete official list. It is optional; the game does not require it.

Progress is the count and percentage of official words found (percentage rounds down, so 100% means the pool is actually complete). **Stars** are awarded at 60%, 80%, and 90% of that official count. Three stars therefore means “almost everything,” not perfection. Bonus words, and the use of clues, do not change the official count or the stars. Finding the full-wheel word is a milestone (it is always one of the official answers) but is not enough to finish the puzzle.

## Information shown or hidden

**Shown from the start:** the wheel and centre; the official blanks, each with its true length, in alphabetical columns; how many official words there are, how many have been found, and how many stars have been earned; a **LETTERS** strip of each distinct wheel letter.

**Revealed through play:** found official words fill their blanks (the most recent one is marked). A letter on the LETTERS strip lights when every official answer _starting with that letter_ has been found. Letters that start no official answers stay dark until the board is perfect, then they light too.

**Hidden:** the letters of unfound official words, unless the player takes a clue; whether a still-dark LETTERS tile still has starter words, or will only light at perfect; the target, until it is found. The history card of a past puzzle shows the centre and the outer letters alphabetised, so the target cannot be read off the card.

## Assistance and rewards

**Clues** are free and optional. They do not change stars or the accepted lists. The player may clue as many official blanks as they like, but only twice per word: first the last letter, then also the second-to-last. There is no third clue. A **shuffle** rearranges the rim only; the centre and the word list stay the same.

**Official words** fill blanks and count toward stars and letter-complete. **Bonus words** (v4) are a side channel: a legal spelling from a wider list, acknowledged with a count, a list, a distinct sound and a toast, but they do not fill official blanks and do not count toward completion, stars, clues, or the LETTERS strip.

## Feedback and juice

Invalid guesses are named (too short, missing the centre, or not in the list) rather than rejected silently. A repeat guess is announced and, if the list is visible, the existing row is pointed out. Official finds reveal in place on their blank, with a richer sound for longer words and for the full-wheel target. Stars fly onto the score plaque; completed LETTERS tiles fly to the strip. A perfect board adds confetti, a short modal that names the target, and a dedicated sound. All of this is feedback; none of it changes the rules. Sound can be muted or themed as a preference.

## Puzzle generation and fairness

Every puzzle comes from a **seed** (a short shareable code) plus a **version**. The same pair always yields the same wheel, centre, tile order, official pool, and bonus pool. Generation is constrained so that:

- the target is a familiar 8–10 letter word;
- no other word in the official or wider lists is an anagram of it;
- the official pool has between 20 and 40 answers, inclusive;
- every distinct letter on the wheel appears in at least three official answers (the target counts).

The last rule means no rim letter is decorative; it is not the same as the LETTERS strip, which tracks _starting_ letters.

## Session and sharing

There is **no daily puzzle** and no hidden rotation. The player may open a seed from the URL, type one, or roll a new random seed (with a confirmation if the current puzzle has already been started). Progress — official finds, per-word clue levels, and bonus finds — is saved locally for that seed and version, and can be resumed from Past Games. History is a personal list of started puzzles, not a social feed. Sharing is the URL (seed and version). Two people with the same link play the same board; there is no live or asynchronous competition built into the game.

## Difficulty levers

Difficulty is mostly in the generated board, not in a selectable mode: how common the centre letter is, whether letters are doubled, the exact official pool size inside the 20–40 band, the target length, and how obscure the remaining official tail feels. The player also chooses how far to push (stop at a star, hunt the target, or go for perfect) and how much free clueing to use. Shuffle can change how the rim is read, but not what words exist.

## What is deliberately absent

- No timer, move limit, or other time pressure.
- No lives, strikes, or score penalties for a wrong or repeated guess.
- No points economy, combos, or currency; clues are not a scarce resource.
- No leaderboard, rankings, or versus play.
- No forced daily; no account or cloud save (progress is local to the browser).
- No open-ended “any English word” victory; the official hunt is a closed, finishable list.
- No second full-wheel answer.

---

## Comparison template

Add a column for another game and fill the same rows.

| Dimension              | Letter Wheel (v4)                                                                                                     | Other game |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------- |
| Core loop              | Form words from a closed letter wheel; fill a known official list                                                     |            |
| Letter inventory       | 8–10 letter multiset; one centre, rest on the rim                                                                     |            |
| Tile reuse in a guess  | Each tile at most once; bag resets next guess                                                                         |            |
| Mandatory letter       | Centre letter required in every accepted word                                                                         |            |
| Length floor           | 4 letters                                                                                                             |            |
| Official pool          | Closed everyday list; every legal official word is in the blanks; size 20–40                                          |            |
| Unique full-wheel word | Exactly one; always official; a milestone, not the whole goal                                                         |            |
| Bonus / extra words    | Wider real words accepted as a separate, non-scoring count                                                            |            |
| Win / soft goals       | Optional perfect (all official words); stars at 60 / 80 / 90% of official finds                                       |            |
| What counts for score  | Official finds only; clues and bonus do not                                                                           |            |
| Information shown      | Blank lengths, alphabetical list, found/total, LETTERS by starting letter                                             |            |
| Information hidden     | Unfound letters (unless clued); whether a dark LETTERS tile has starters                                              |            |
| Assistance             | Free clues (up to two ending letters per official blank); rim shuffle                                                 |            |
| Feedback / juice       | Named errors, in-place reveal, sounds, star and letter celebrations, perfect modal                                    |            |
| Generation / fairness  | Seeded and deterministic; familiar target; unique pangram; 20–40 answers; every distinct letter in ≥ 3 official words |            |
| Session                | Local save per seed + version; random or entered seed; no daily rotation                                              |            |
| Sharing / social       | Shareable URL (seed + version); no live play, no leaderboard                                                          |            |
| Time pressure          | None                                                                                                                  |            |
| Penalties              | None                                                                                                                  |            |
| Competition            | None                                                                                                                  |            |
| Difficulty levers      | Centre, doubles, pool size, target length, leftover official tail; player-chosen stopping point and clue use          |            |
