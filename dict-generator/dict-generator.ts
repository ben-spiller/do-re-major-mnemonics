/**
 * HOW TO RUN:
 * 1. Ensure Node.js is installed.
 * 2. Save as 'generate.ts' and run: npx ts-node generate.ts
 * * ATTRIBUTIONS & LICENSES:
 * - Britfone: Created by Jose Llarena (MIT License). 
 * - Concreteness Norms: Brysbaert et al. (2014) (CC BY-NC 4.0).
 * - Sensorimotor Norms: Lynott et al. (2020), Lancaster University (CC BY 4.0).
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

interface WordEntry {
    word: string;
    score: number;
}

// Standard Major System mapping used ONLY for calculating coverage statistics
const STATS_MAP: Record<string, string> = {
    'D': '1', 'N': '2', 'M': '3', 'R': '4', 'L': '5', 
    'J': '6', 'K': '7', 'F': '8', 'P': '9', 'S': '0'
};

const PHONETIC_MAP: Record<string, string> = {
    't': 'D', 'd': 'D', 'θ': 'D', 'ð': 'D', 
    'n': 'N', 'ŋ': 'N', 
    'm': 'M',
    'ɹ': 'R', 'r': 'R',
    'l': 'L',
    'dʒ': 'J', 'tʃ': 'J', 'ʃ': 'J', 'ʒ': 'J', 'j': 'J', 
    'k': 'K', 'ɡ': 'K', 'g': 'K',
    'f': 'F', 'v': 'F',
    'p': 'P', 'b': 'P',
    's': 'S', 'z': 'S'
};

/**
 * Maps Bridge Sounds to the most likely letter clusters in English spelling.
 * Sorted by length (greedy) so 'ch' is checked before 'c'.
 */
const SOUND_TO_LETTERS: Record<string, string[]> = {
    'D': ['th', 'tt', 'dd', 't', 'd'],
    'N': ['nn', 'ng', 'kn', 'gn', 'n'],
    'M': ['mm', 'm'],
    'R': ['wr', 'rr', 'r'],
    'L': ['ll', 'l'],
    'J': ['tch', 'ch', 'sh', 'dg', 'jh', 'j', 'g', 's'],
    'K': ['ck', 'kk', 'gg', 'qu', 'k', 'g', 'c', 'x'],
    'F': ['ph', 'ff', 'vv', 'f', 'v'],
    'P': ['pp', 'bb', 'p', 'b'],
    'S': ['ss', 'zz', 's', 'z', 'c', 'x']
};

/**
 * Dynamically highlights the mnemonic letters by uppercasing them.
 */
function highlightMnemonic(word: string, bridgeCode: string): string {
    let result = word.toLowerCase();
    let currentPos = 0;

    for (const sound of bridgeCode) {
        const patterns = SOUND_TO_LETTERS[sound] || [];
        let bestMatch: { index: number; length: number } | null = null;

        // Find the earliest occurrence of any valid pattern for this sound
        // starting from the current position.
        for (const pattern of patterns) {
            const foundIndex = result.indexOf(pattern, currentPos);
            if (foundIndex !== -1) {
                if (bestMatch === null || foundIndex < bestMatch.index) {
                    bestMatch = { index: foundIndex, length: pattern.length };
                }
            }
        }

        if (bestMatch !== null) {
            const before = result.substring(0, bestMatch.index);
            const match = result.substring(bestMatch.index, bestMatch.index + bestMatch.length).toUpperCase();
            const after = result.substring(bestMatch.index + bestMatch.length);
            
            result = before + match + after;
            // Move currentPos past the match to handle duplicate letters like "PaINTiNG"
            currentPos = bestMatch.index + bestMatch.length;
        }
    }
    return result;
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
        console.log(`--- Processing IPA Phonetics: ${INPUT_FILES.britfone}`);

        parseDataFile(INPUT_FILES.britfone).forEach(row => {
            counts.britTotal++;
            const rawWord = row['Word'] || row['word'] || row._rawValues[0];
            const phoneticsRaw = row['Phonemes'] || row['phonemes'] || row._rawValues[1];
            if (!rawWord || !phoneticsRaw) return;

            const word = rawWord.toLowerCase();
            const cleanPhonemes = phoneticsRaw.replace(/[ˈˌː]/g, '').trim().split(/\s+/);

            /**
             * BRIDGE CODE COMMENT:
             * The bridgeCode represents the consonant skeleton of the word.
             * Mapping phonetic IPA sounds to a stable uppercase skeleton (e.g., "DK").
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
                .map(e => highlightMnemonic(e.word, code));
        }

        const dir = path.dirname(OUTPUT_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalOutput));

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
        console.log("🧪 KEY VERIFICATION (TOP 5 PER DIGIT)");
        console.log("-".repeat(40));
        Object.entries(STATS_MAP).sort((a,b) => a[1].localeCompare(b[1])).forEach(([bridgeChar, digit]) => {
            const words = (finalOutput[bridgeChar] || []).slice(0, 5).join(', ');
            console.log(`${digit} (${bridgeChar}): ${words || "EMPTY ❌"}`);
        });

        const fileSizeKB = Math.round(fs.statSync(OUTPUT_FILE).size / 1024);
        console.log("-".repeat(40));
        console.log(`💾 File Size:           ${fileSizeKB} KB`);
        console.log(`⏱️ Execution Time:     ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
        console.log("=".repeat(40));

    } catch (error: any) {
        console.error(`\n❌ SCRIPT ERROR: ${error.message}`);
        process.exit(1);
    }
}

runGenerator();