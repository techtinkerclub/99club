# Alphametics word source and curation

The live 99 Club Studio Alphametics engine is deliberately **offline**. It does not fetch a dictionary when a teacher generates a worksheet. Instead, development uses the English Speller Database (ESDB, formerly SCOWL) as the reference word-list source and ships a small curated catalogue of already validated puzzles.

## Source

Project: English Speller Database (ESDB) / SCOWL  
Repository: `en-wl/wordlist`  
Default branch: `v2`

ESDB contains English words plus information about commonness, dialect spelling, variants, basic part of speech and inflections. Its documented command-line interface can generate a British English list, for example:

```text
./scowl word-list 60 B 1 > wl.txt
```

For future catalogue rebuilds, use the normal British English list rather than the large cryptic/word-game list. Restrict the candidate set to ordinary alphabetic words suitable for primary-school worksheets.

## Licence

The ESDB repository states:

> Copyright 2000-2026 by Kevin Atkinson

and grants permission to use, copy, modify, distribute and sell ESDB or generated word lists without fee, provided the copyright and permission notice are retained in copies/supporting documentation.

The project also documents additional notices for some specialist source subsets. Our intended workflow uses an ordinary British word list and stores only a small curated derived catalogue, not the ESDB database itself.

The source licence must therefore remain documented here whenever the catalogue is rebuilt from ESDB.

## Curation rules

A dictionary word is only a candidate; it is **not automatically a good Alphametic**. The catalogue builder should:

1. use familiar, age-appropriate British-English words;
2. reject proper nouns, abbreviations, offensive/adult terms, obscure variants and punctuation/hyphenated forms;
3. normally keep words between 3 and 6 letters for print readability;
4. combine words into addition patterns such as `WORD + WORD = WORD` (and occasionally three-addend classics);
5. reject combinations using more than 10 distinct letters;
6. run the Alphametics column/carry solver;
7. keep only puzzles with a mathematically valid solution;
8. prefer puzzles with exactly one solution before hints;
9. where a classic puzzle has several solutions, store a fixed clue only when that clue makes the puzzle unique (for example `TWO + TWO = FOUR` with `O = 4`);
10. assign each retained puzzle a difficulty and a familiar-word theme;
11. visually inspect a sample in browser and PDF before release.

## Runtime design

`assets/99club/games-alphametics-library-v141.js` contains the local catalogue used by the website. It currently expands the five original hand-picked puzzles into a larger set of curated real-word puzzles grouped into:

- Classic alphametics
- Maths words
- School words
- Food
- Nature
- Body
- Family
- Colours

The engine chooses deterministically from the selected difficulty/theme using the worksheet seed. It still runs the solver and guarantees a unique puzzle after any supplied digit hints.

This approach is preferable to querying a dictionary at runtime because it keeps the public tool fast, reproducible, private, offline-friendly and safe from inappropriate/obscure vocabulary.