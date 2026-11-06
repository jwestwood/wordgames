# Letter Wheel — game mechanics

How Letter Wheel plays, mechanic by mechanic: what it is, and what it adds (strategy, or honest comfort/feedback). This is the player-facing companion to [ARCHITECTURE.md](./ARCHITECTURE.md), which covers how the code is put together.

**As shipped:** the public default is puzzle **version 3**. Older numbered versions and beta are noted only where a shared seed would not be the same puzzle. UI, clues, the LETTERS strip, and similar aids apply to every version — they are not versioned with the rules.

---

## Core puzzle rules

These decide what the puzzle *is* and which words count.

### The wheel

An 8–10 letter everyday word (the **target**) is laid out as a wheel: one of its letters sits in the **centre**; the remaining letters (including any extra copies of the centre letter) sit around the outside. You spell answers from that multiset — each tile at most once per guess.

*Strategy.* The board is a closed bag of letters, not an open dictionary hunt. You plan around what you can actually spell, including doubled letters when the target has them. Longer words spend more of the bag; short words leave leftovers you can recombine.

### Centre letter

Every accepted word must include the centre letter. A guess that does not is rejected (“Every word must use the centre letter.”) and does not count.

*Strategy.* The centre is a hinge. You search in families that share it (stems, prefixes, suffixes around that letter) rather than every anagram of the rim. An uncommon centre tightens the puzzle; a common one (E, A, I, R, …) opens more branches — and more ways to get lost.

### Minimum length

Answers are at least **4** letters (`MIN_WORD`). Shorter spellings are rejected.

*Strategy.* Three-letter words are off the table, so the obvious crumbs are gone. You spend attention on 4+ letter constructions, which is also why the blank list’s length pattern is worth reading (see Progress).

### Answer pool

The official list is every 4+ letter word that can be spelled from the wheel, uses the centre, and appears in the **common** vocabulary list (see Word list tiers). A guess that is English but not in that pool is rejected (“Not in the word list.”). You cannot reuse a word you have already found.

*Strategy.* You are not proving a word exists in English; you are finding the words *this* puzzle accepted. If a clever spelling bounces, it is usually too rare for the list (or it uses a letter you do not have). That pushes play toward ordinary vocabulary first.

### Unique full-wheel word

The target is chosen so that no other word in the common **or** extended lists is an anagram of it. There is exactly one way to use every tile: the target itself, which is always in the answer pool.

*Strategy.* Hunting the “whole wheel” word is a real goal with a single answer — you are not choosing between LISTEN and SILENT for the pangram. Finding it is a milestone (and plays a bigger success sound) but you still need the rest of the pool for a perfect game.

### Pool size (20–40)

Version 3 only accepts wheels whose answer pool has between **20 and 40** words (inclusive).

*Strategy.* The session is meant to be finishable, not a marathon. The blank count is a budget: you can see at a glance how much remains, and 60/80/90% stars fall on whole numbers you can feel (for example, 18 of 30 is exactly 60%). Older versions differ here — see Meta › Puzzle versions.

### Letter coverage

Version 3 also requires that **every distinct letter** on the wheel appears in at least **three** answers (the target counts). “Appears in” means the letter occurs *somewhere* in the word, not that the word starts with it.

*Strategy.* No letter is decorative. If you are stuck, it is reasonable to try constructions that use a neglected tile — the generator promised that tile is doing work in at least three words. This is a different idea from the LETTERS strip, which tracks words *starting* with a letter.

### Word list tiers

Three lists sit behind a puzzle:

- **Targets** — a stricter, familiar subset of everyday words, length 8–10. The wheel word is drawn from here, so the pangram should feel like a word people know.
- **Common** — the answer list (looser everyday vocabulary on v2/v3: roughly Zipf ≥ 2.6, plus a small allowlist). This is what `checkGuess` accepts.
- **Extended** — not accepted as answers. Used only so the unique-anagram check also rejects targets that have an obscure twin.

*Strategy.* You are rewarded for thinking of ordinary words, not dictionary oddities. The extended list’s only job is fairness: the full-wheel word should not secretly be two rare anagrams.

---

## Progress & goals

How you can tell how you are doing, and what “done enough” means.

### The blank list

Unfound answers appear as blank slots whose length matches the word, arranged alphabetically in columns. Found words fill in; the most recent one is marked as the last word.

*Strategy.* Length is information: a lone 10-letter blank is almost certainly the target; a run of 4-letter blanks is a different hunt. Because the list is alphabetical, words that share a starting letter cluster together — you can see how many A-slots remain without revealing their letters. That pairs directly with letter-complete (below).

### Stars (60% / 80% / 90%)

Stars are awarded at **60%**, **80%**, and **90%** of the pool found (thresholds `[0.6, 0.8, 0.9]`). The percent shown is rounded down, so 100% appears only when the pool is complete. Stars are about *how many* words you have found, not which ones, and clues do not change the score.

*Strategy.* Three stars is “almost everything,” not perfection. You can decide to stop at a star threshold, push for the next, or keep going for a perfect board. A 30-word pool hits one star at 18, two at 24, three at 27 — three words short of clearing it.

### Perfect

Finding every word in the pool is **perfect**: the third star is already earned by 90%, and 100% adds a celebration (confetti, a short modal that names the full-wheel word, a dedicated sound). Progress is saved, so you can leave and come back.

*Strategy.* Perfect is an optional extra goal on top of three stars. The last few words are often the obscure tail of an otherwise ordinary list; whether that hunt is worth it is a player choice, not a requirement.

### LETTERS strip and letter-complete

Under the list, **LETTERS:** shows each distinct wheel letter as a small tile, in alphabetical order (a visual index, not a spelling order).

A letter **L** is complete when every answer that **starts with L** has been found. Completed tiles stay highlighted (the highlight is derived from your found words, so it survives a reload). Letters that start *no* answers stay unhighlighted until the puzzle is 100% complete, then they fill in too — with the same celebration as the others.

When a letter becomes complete, its tile flies from the wheel onto the strip, a toast reads `All A words found!` (with that letter), and a sound plays. If one guess completes several letters, the celebrations queue rather than overlap.

*Strategy.* This is one of the stronger strategic signals. Once A is lit, you can stop looking for more A-words. Combined with the alphabetical blanks, you can also *see* the remaining A-slots empty out. The honest catch: an unlit letter mid-game might still have words — or it might be a letter nothing starts with, which only lights at perfect. Do not treat every dark tile as leftover work.

---

## Aids

Optional tools. None of them change stars or the accepted word list.

### Clues

The Clue button arms pick mode; you tap a blank to reveal letters on that word, then the button turns off (tap it again or press Escape to cancel without spending a clue).

- First clue on a word: its **last** letter.
- Second clue on the same word: the **second-to-last** letter as well (so `alert` goes `____T` then `___RT`).
- No third clue. There is **no** limit on how many different words you can clue, and clues do not affect scoring. Clue state is saved with progress.

*Strategy.* Because clues are free, they are not a scarce resource to budget against stars. The strategy is *which* blank to open. Last-letter (and then the two-letter ending) is most useful for suffixes (`-ING`, `-ED`, `-ER`, `-LY`, `-ES`, …) and for long isolated blanks. Clueing a short, obvious 4-letter slot wastes less uncertainty than clueing a word you were about to see anyway. The list still has to be solved; clues only narrow a particular row.

### Shuffle

The shuffle control rearranges the outer wheel tiles (the centre stays put). Each shuffle is seeded from the puzzle seed plus a counter, so it is deterministic but different every time.

*Strategy, lightly.* A fresh arrangement can break fixation — you notice stems you stopped seeing. It does not change what words exist. Comfort first, with a small strategic side-effect.

### Last-word reminder

The list header shows the most recently found word (“Last word: …”), including across a reload.

*Comfort / light strategy.* On a long list, or with auto-scroll off, it answers “what did I just find?” It is not a hint about remaining words.

### Scroll-to-found setting

Letter Wheel’s settings cog currently has one toggle: **Scroll to found words** (on by default). When on, a found word’s fly-in animation scrolls that row into view. When off, an off-screen word pops and fades over the wheel instead, and star fly-ins only play if the score plaque is on screen.

*Comfort.* This does not change the puzzle. Turn it off if the page jumping on a phone is more distraction than help.

---

## Feedback & celebration

These tell you what just happened. They do not change the rules.

### Toasts

Short paper toasts slide in over the wheel: a found word (`ABIDE — nice!`), an error (`Words need at least 4 letters.`, `Not in the word list.`, and so on), a repeat guess, or a completed letter (`All A words found!`). A new toast replaces the previous one.

*Feedback.* The messages name the failure mode so you can adjust (too short vs missing the centre vs not in the list) instead of guessing why a word bounced.

### Re-guess flash

Submitting a word you have already found plays a distinct sound, toasts `ALREADY FOUND!`, and pulses that row in the list (scrolling to it if auto-scroll is on).

*Feedback, with a small use.* If you cannot remember whether you already entered something, submitting it again *finds it for you* in the list. That is bookkeeping, not a new scoring trick.

### Fly-ins

Found words fly from the wheel into their list slot (matching the list’s letter sizing). Stars fly onto the score plaque when you cross a threshold. Completed letters fly onto the LETTERS strip as square tiles. Animations queue so several at once do not collide; they keep tracking their target if the page scrolls.

*Celebration / feedback.* The motion is there so the eye can follow where a word or star landed. It does not hide or reveal extra information beyond what the list and plaque already show.

### Sounds and mute

Actions play named sound *slots* (tap, success, error, star, perfect, shuffle, and so on). A global header control picks a **sound theme** (Classic, Soft, Tabletop, Arcade) that fills every slot with a matching set of files; a separate header button **mutes** everything. Mute and theme persist for the whole site, not per puzzle. Playback is silent when muted, when the tab is in the background, or before audio has unlocked on a first gesture.

*Comfort.* Themes and mute are preference. They do not encode extra game state. (A completed letter reuses the star sound slot so every theme has something to play.)

### Perfect celebration

On a complete pool: a perfect sound, confetti, and a modal that congratulates you and names the full-wheel word. You can admire the board or roll a new seed.

*Celebration.* By this point you have already found the target in the list; the modal is a bow on the session.

---

## Meta

How puzzles are named, shared, remembered, and kept fair.

### Seeded puzzles

Every puzzle is generated from a **seed** — a six-character code (Crockford-style: digits and letters, no I/L/O/U; typed O becomes 0, I/L become 1). The same seed plus the same puzzle version always yields the same wheel, centre, tile order, and answer pool. The seed lives in the URL (`#/games/letter-wheel?seed=GSP0MH&v=3`) and in the seed field at the top of the game. A new seed (the dice control) asks for confirmation if you have already started the current one, so you do not wipe progress by accident.

*Strategy, at the table.* Seeds are how you share a specific puzzle, rematch a friend, or return to one you liked. There is no hidden daily rotation you cannot point at: if two people use the same seed and version, they are playing the same game.

### Puzzle versions

A puzzle is identified by **(seed, version)**. Numbered versions are frozen:

| Version | What changes (fairness) |
| --- | --- |
| **v1** | Original generator and lists. Answers = older common list. Pool sized about 40–80. No “every letter in ≥ 3 answers” rule. |
| **v2** | Same *wheel* selection idea as v1 for most seeds (so `GSP0MH` stays `prevalent`), but answers come from the looser common list, capped at 100. |
| **v3** (public default) | Same lists as v2; the *accepted* pool must be 20–40 words, and every distinct wheel letter must appear in ≥ 3 answers. The same seed can therefore pick a **different** wheel than v1/v2 (`GSP0MH` is `debating` on v3). |
| **beta** | Opt-in (`?v=beta`). May change at any time; saves and history stay separate from numbered versions. |

Share links include `v`. A missing or unknown `v` is pinned to the latest numbered version (currently 3). History entries remember the version they were played on, and an older entry reopens with those exact rules and lists.

*Fairness, not an in-puzzle tactic.* If you challenge someone, send the link (seed **and** version). Comparing scores on `GSP0MH` without saying `v=1` or `v=3` is comparing different boards.

### Puzzle history

The site keeps a shared history (Past Games): one card per game + seed + version, created on your **first submitted guess** (right or wrong) or when the seed already has saved words or clues. Merely opening or randomising a puzzle does not add clutter. Cards show a spoiler-free preview (outer letters **alphabetised**, plus the centre — so the target word is not readable off the card), progress, and stars. Older-than-latest versions get a small `v1` / `Beta` stamp. Cap: 200 entries.

*Meta strategy.* History is how you resume a half-finished wheel and see which seeds you have already starred. It does not hint at remaining answers.

### Progress persistence

Found words and per-word clue levels are saved for that seed and version in the browser. Letter-complete highlights are not stored separately; they are computed from the found list, so they come back the same on reload.

*Comfort.* You can close the tab without losing a session. The save is local to the device/browser.

---

## A short play loop

1. Read the centre, then the rim; notice doubled letters and the longest blank.
2. Spell ordinary words that must include the centre; watch the alphabetical list and the LETTERS strip to see which starting letters are finished.
3. Use stars as optional stopping points (60 / 80 / 90); treat perfect as extra.
4. If you stall, shuffle the rim, clue a long or awkward blank (ending letters first), or chase a letter that coverage guaranteed is in several words — remembering that a dark LETTERS tile might also be a letter nothing starts with.
5. Share the URL (seed + version) if someone else should face the same wheel.
