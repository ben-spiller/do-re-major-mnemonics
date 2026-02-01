
/**
 * Standalone script for generating the dictionary. Builds a derived work using  
 * some opensource third party data.
 * 
 * HOW TO RUN:
 * 1. Ensure you have Node.js installed.
 * 2. Download input files as described in INPUT_FILES
 * 2. Run: npx ts-node dict-generator.ts
 * 
 */

/**
 * ATTRIBUTIONS & LICENSES:
- Britfone
  MIT License
  Copyright (c) by 2017 Jose Llarena
  https://github.com/JoseLlarena/Britfone/blob/master/britfone.main.3.0.1.csv
- Concreteness Norms: Brysbaert et al. (2014) (CC BY-NC 4.0).
 * - Lancaster Sensorimotor Norms: Lynott et al. (2020), Lancaster University (CC BY 4.0). From paper by Lynott, D. Connell, L. Brysbaert, M., Brand, J., & Carney. J. The Lancaster Sensorimotor Norms: Multidimensional measures of Perceptual and Action Strength for 40,000 English words.  
 *   from https://osf.io/48wsc/download
 * See: https://creativecommons.org/licenses/by-nc/4.0/deed.en
 *      https://creativecommons.org/licenses/by/4.0/
 * For non-commercial use only. 
 */

/*
Output file format definition:

### Dictionary File Format: `dictionary-*.json`

The generated file is a **minified JSON Object** structured as a **Reverse Phonetic Map**. Instead of words being the keys, the keys are **Bridge Codes**.

* **Key (Bridge Code):** A string of uppercase ASCII characters representing the phonetic consonant skeleton of a word (e.g., `D`, `N`, `M`, `R`, `L`, `J`, `K`, `F`, `P`, `S`).
* **Value:** An array of exactly 0 to 15 lowercase strings (words). These words are pre-sorted by "Mnemonic Quality"—favoring concrete, visual nouns that start with the target sound.

**Example Entry:**

```json
{
  "DK": ["dog", "duck", "deck", "dock", "dagger"],
  "PL": ["apple", "pill", "ball", "bell", "pool"]
}

```

---

### Lookup Algorithm (For AI Implementation)

To find words for a specific number in a given mnemonic system, an AI or system should follow these three steps:

#### 1. Define the System Map

Create a mapping from the **Bridge Code Characters** to the **Target Digits** for the specific system being used.

| Bridge Char | Standard Major | Do-Re-Major (Example) |
| --- | --- | --- |
| **D** (t/d) | 1 | 2 |
| **N** (n) | 2 | 6 |
| **K** (k/g) | 7 | 1 |

#### 2. Generate Search Keys

Since multiple Bridge Codes can result in the same digit sequence, the algorithm must identify all matching keys.

* **Input:** A digit string (e.g., `"21"`).
* **Process:** Iterate through all keys in `dictionary.json`. For each key, translate its characters into digits using the System Map.
* **Match:** If the translated digits equal the input string, add that key's word list to the results.

#### 3. Handle Rhoticity (UK Specific)

To account for non-rhotic (Standard UK) vs. rhotic accents:

* **Rhotic Search:** Match the digits exactly.
* **Non-Rhotic Search:** If a Bridge Code ends in `R` (e.g., `KR`), treat that `R` as optional. A search for digit `7` (K) should return words from both the `K` key and the `KR` key (like "Car").

---

### Implementation Pseudocode

```typescript
function findMnemonics(digits, systemMap, dictionary) {
  let matches = [];
  
  for (const [bridgeCode, words] of Object.entries(dictionary)) {
    const numericValue = bridgeCode.split('')
                                   .map(char => systemMap[char])
                                   .join('');
                                   
    if (numericValue === digits) {
      matches.push(...words);
    }
  }
  return matches; // Optionally re-sort or limit to top 15 total
}

```

*/


/**
 * HOW TO RUN:
 * 1. Ensure Node.js is installed.
 * 2. Save as 'generate.ts' and run: npx ts-node generate.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// --- CONFIGURATION ---
const INPUT_FILES = {
    "britfone": "britfone.main.3.0.1.csv",
    "concreteness": "Concreteness_ratings_Brysbaert_et_al_BRM.txt",
    "sensorimotor": "Lancaster_sensorimotor_norms_for_39707_words.csv"
};

const OUTPUT_FILE = '../public/dictionary-en_GB.json';

const COPYRIGHT_NOTICE = "Copyright (C) Ben Spiller 2026-present ; Commercial use of this dictionary is not permitted ; See https://github.com/ben-spiller/do-re-major-mnemonics for licensing information about this dictionary and the opensource data used to help created it";

// Standard Major System mapping used ONLY for calculating coverage statistics
const STATS_MAP: Record<string, string> = {
    'D': '1', 'N': '2', 'M': '3', 'R': '4', 'L': '5', 
    'J': '6', 'K': '7', 'F': '8', 'P': '9', 'S': '0'
};

/**
 * UPDATED PHONETIC MAP:
 * Includes Britfone IPA symbols: 
 * ɹ = R, dʒ = J, tʃ = CH, ʃ = SH, θ = T/D, ð = T/D, etc.
 */
const PHONETIC_MAP: Record<string, string> = {
    // T / D
    't': 'D', 'd': 'D', 'θ': 'D', 'ð': 'D', 
    // N
    'n': 'N', 'ŋ': 'N', 
    // M
    'm': 'M',
    // R
    'ɹ': 'R', 'r': 'R',
    // L
    'l': 'L',
    // J / CH / SH / ZH
    'dʒ': 'J', 'tʃ': 'J', 'ʃ': 'J', 'ʒ': 'J', 'j': 'J', 
    // K / G
    'k': 'K', 'ɡ': 'K', 'g': 'K',
    // F / V
    'f': 'F', 'v': 'F',
    // P / B
    'p': 'P', 'b': 'P',
    // S / Z
    's': 'S', 'z': 'S'
};

interface WordEntry {
    word: string;
    score: number;
}

function parseDataFile(filename: string) {
    if (!fs.existsSync(filename)) throw new Error(`CRITICAL: File "${filename}" not found.`);
    const content = fs.readFileSync(filename, 'utf-8');
    const lines = content.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length === 0) return [];

    const delimiter = lines[0].includes('\t') ? '\t' : (lines[0].includes(';') ? ';' : ',');
    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
    
    return lines.slice(1).map(line => {
        const values = line.split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
        const obj: any = { _rawValues: values };
        headers.forEach((h, i) => { if (values[i] !== undefined) obj[h] = values[i]; });
        return obj;
    });
}

function runGenerator() {
    const startTime = Date.now();
    console.log("🚀 Initializing Mnemonic Dictionary Generation...");

    try {
        const rankingData: Record<string, { concreteness: number, visual: number, haptic: number }> = {};
        let counts = { conc: 0, sensor: 0, britTotal: 0, britMapped: 0 };

        parseDataFile(INPUT_FILES.concreteness).forEach(row => {
            const word = (row.Word || "").toLowerCase();
            const score = parseFloat(row['Conc.M']);
            if (word && !isNaN(score)) {
                rankingData[word] = { concreteness: score, visual: 0, haptic: 0 };
                counts.conc++;
            }
        });

        parseDataFile(INPUT_FILES.sensorimotor).forEach(row => {
            const word = (row.Word || "").toLowerCase();
            if (rankingData[word]) {
                rankingData[word].visual = parseFloat(row['Visual.mean']) || 0;
                rankingData[word].haptic = parseFloat(row['Hand_Arm.mean']) || 0;
                counts.sensor++;
            }
        });

        const bridgeDict: Record<string, WordEntry[]> = {};
        console.log(`--- Processing IPA Phonetics from: ${INPUT_FILES.britfone}`);

        parseDataFile(INPUT_FILES.britfone).forEach(row => {
            counts.britTotal++;
            const rawWord = row['Word'] || row['word'] || row._rawValues[0];
            const phoneticsRaw = row['Phonemes'] || row['phonemes'] || row._rawValues[1];
            if (!rawWord || !phoneticsRaw) return;

            const word = rawWord.toLowerCase();
            
            // Cleanup IPA: Remove stress markers and length marks
            const cleanPhonemes = phoneticsRaw
                .replace(/[ˈˌː]/g, '') // Remove IPA stress/length marks
                .trim()
                .split(/\s+/);

            /**
             * BRIDGE CODE LOGIC:
             * Maps cleansed IPA phonemes to the Bridge Code skeleton.
             */
            let bridgeCode = "";
            let firstSoundIsConsonant = false;
            let foundFirstConsonant = false;

            for (let i = 0; i < cleanPhonemes.length; i++) {
                const sound = cleanPhonemes[i];
                const mapped = PHONETIC_MAP[sound];
                if (mapped) {
                    bridgeCode += mapped;
                    if (!foundFirstConsonant) {
                        if (i === 0) firstSoundIsConsonant = true;
                        foundFirstConsonant = true;
                    }
                }
            }

            if (!bridgeCode) return;
            counts.britMapped++;

            const norms = rankingData[word] || { concreteness: 1.5, visual: 1.5, haptic: 1.5 };
            let score = (norms.concreteness * 5) + (norms.visual * 2) + (norms.haptic * 3);
            if (firstSoundIsConsonant) score += 100;

            const spellingConsonants = word.replace(/[aeiouy]/g, '').length;
            const mismatchPenalty = Math.abs(spellingConsonants - bridgeCode.length);
            score += (mismatchPenalty === 0) ? 30 : -(mismatchPenalty * 25);

            if (bridgeCode.endsWith('R')) score -= 15;
            if (word.length <= 2) score -= 10;

            if (!bridgeDict[bridgeCode]) bridgeDict[bridgeCode] = [];
            if (!bridgeDict[bridgeCode].some(e => e.word === word)) {
                bridgeDict[bridgeCode].push({ word, score });
            }
        });

        // 3. Finalize and Analyze Coverage
        const finalOutput: any = { "_metadata": COPYRIGHT_NOTICE };
        const coverageStats: Record<number, Set<string>> = {};
        let maxLength = 0;

        for (const code in bridgeDict) {
            const len = code.length;
            if (len > maxLength) maxLength = len;
            if (!coverageStats[len]) coverageStats[len] = new Set();
            const digits = code.split('').map(c => STATS_MAP[c]).join('');
            coverageStats[len].add(digits);

            finalOutput[code] = bridgeDict[code]
                .sort((a, b) => b.score - a.score)
                .slice(0, 15)
                .map(e => e.word);
        }

        const dir = path.dirname(OUTPUT_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalOutput));

        // 4. Statistics Dashboard
        console.log("\n" + "=".repeat(40));
        console.log("📊 GENERATION STATISTICS");
        console.log("-".repeat(40));
        for (let i = 1; i <= maxLength; i++) {
            const count = coverageStats[i]?.size || 0;
            const possible = Math.pow(10, i);
            if (count > 0 || i <= 3) {
                console.log(`Length ${i} Coverage:   ${((count / possible) * 100).toFixed(1)}% (${count}/${possible})`);
            }
        }
        console.log("-".repeat(40));
        console.log(`📂 Output:              ${OUTPUT_FILE}`);
        console.log(`⏱️ Execution Time:     ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
        console.log("=".repeat(40));

    } catch (error: any) {
        console.error(`\n❌ SCRIPT ERROR: ${error.message}`);
        process.exit(1);
    }
}

runGenerator();