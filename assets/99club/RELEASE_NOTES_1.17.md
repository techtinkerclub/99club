# 99 Club Studio — v1.17 release notes

## Direct-maths scope tightened before public beta

The provisional `word_problems` family from v1.16 has been removed from the active teacher catalogue and from every Year 1–6 quick-pick.

The reason is deliberate: a handful of fixed pencil/sticker/bag sentence templates with changing numbers is too repetitive to be presented as a proper word-problem bank. Contextual/story problems will be developed separately with a structured engine that separates mathematical structure, context, vocabulary and phrasing.

The existing concise mathematical prompts remain part of Custom Worksheet. Examples include:

- `Round 673 to the nearest 100.`
- `What is the value of 6 in 678?`
- `3/4 as a percentage =`
- `Find the mean of 8, 11, 7, 10 and 9.`

The active catalogue is now **106 families**: 104 curriculum-oriented direct/non-graphical families plus 2 explicit extension families. The retired pre-release word-problem ID is kept internally only as an empty index placeholder so later compact recreation-family numbers do not shift; the old sentence-template generator itself has been removed.

## Teacher notes on answer sheets

Teachers can now add an optional short note in Step 4.

- maximum **240 characters**;
- printed only at the end of teacher answer sheets;
- never printed on pupil worksheets;
- shown in the answer preview;
- saved in browser state, one-setup exports, Full backups and Full recreation codes;
- deliberately omitted from the compact answer-sheet QR so a note cannot make the QR unnecessarily dense.

When a note is present, the answer layout reserves a small block above the normal footer. Pupil-sheet geometry is unchanged.

## Curriculum quick-picks

Removing the contextual story family changes the Year 1–6 quick-pick counts to:

- Year 1: 22 active families
- Year 2: 33
- Year 3: 41
- Year 4: 55
- Year 5: 65
- Year 6: 90

All direct numerical and concise mathematical-prompt families from v1.16 remain available.

## Compatibility and QA

- `GENERATION_VERSION` remains `G1`; named Classic/alternative 11–99 and Bronze–Diamond generation paths are unchanged.
- The public `FAMILY_ORDER` excludes the retired word-problem family.
- A separate stable compact-family order retains its old slot so v1.16 pre-release compact replacement recipes do not shift later family indices.
- Dependency-free smoke tests cover all 106 active families, Year 1–6 quick-picks, progression defaults, direct-prompt retention, retired-word-problem exclusion, and teacher-note answer/pupil separation.
