
# Do Re Major Mnemonics - Implementation Plan

## Overview
A mobile-friendly educational web app that converts numbers into memorable words using consonant-based mnemonic systems. Users enter numbers and receive word suggestions that map to those digits.

---

## Core Features

### 1. Number Input & Mode Selection
- Large, mobile-friendly number input field
- Toggle switch between **Do-Re-Major** (default) and **Major Mnemonic** modes
- Clear button to reset input
- Real-time results as user types

### 2. Mnemonic Mapping Reference
- **Educational side panel/drawer** showing the current system's consonant mappings
- Visual chart displaying each digit (0-9) with its corresponding consonants
- Toggle to switch between systems and see how mappings differ
- Helpful tips on how the mnemonic systems work

### 3. Word Matching Algorithm
- **Embedded UK English word list** (no backend needed)
- Matching logic that:
  1. First finds single words matching the entire number sequence
  2. Then finds optimal word combinations (fewest words covering all digits)
  3. Also suggests common/frequent words for partial matches
- Results ranked: **Longer matches first**, with common word alternatives shown below
- Display up to 20 results

### 4. Results Display
- Clear visual hierarchy showing:
  - **Perfect matches** (single words covering all digits) highlighted at top
  - **Word combinations** shown with "+" notation (e.g., "dog + mat")
  - Each result shows which digits it covers
- Copy-to-clipboard button for each result

### 5. Favorites System
- Heart/star button to save favorite mnemonics
- **Local storage** to persist across sessions (device-specific)
- Dedicated "Saved" tab/section to view favorites
- Ability to organize or delete saved items

---

## Design Approach

### Educational & Friendly Style
- Clean layout with instructional elements
- Colour-coded digit mappings for easy learning
- Tutorial/info modal for first-time users explaining the systems
- Subtle musical theming in icons/colours (honouring the "Do Re" name)

### Mobile-First Responsive
- Large touch targets for number input
- Swipeable or collapsible reference panel
- Works well on phones, tablets, and desktop

---

## Pages/Views

1. **Main View** - Number input, mode toggle, live results
2. **Reference Panel** - Expandable/collapsible consonant chart
3. **Saved Mnemonics** - Tab or section for favourites
4. **How It Works** - Educational modal/page explaining both systems

---

## Technical Notes

- Embedded curated UK English word list (~5,000-10,000 common words)
- Algorithm analyses consonant sounds (not just letters) for accurate matching
- Handles phonetic edge cases (e.g., "ph" = f sound, "th", silent letters)
- No backend required - fully client-side application
