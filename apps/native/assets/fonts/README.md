# Lardon Eczar

Eczar Medium and SemiBold (SIL Open Font License, see `OFL.txt`), cut down to Latin and with tighter vertical metrics: ascent 1000 and descent 300 on 1000 units per em, instead of 1143 and 634. Eczar's own metrics leave room for Devanagari, which made every line 1.78 times the font size and clipped headings on iOS. Every Latin glyph, accents included, still fits.

Made with fontTools `subset` (Basic Latin, Latin-1, Latin Extended-A, typographic punctuation, euro) from `@expo-google-fonts/eczar` 0.4.1, then setting `hhea` and `OS/2` ascent, descent and line gap and renaming the family to Lardon Eczar.
