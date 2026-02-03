/**
 * HOW TO RUN:
 * 1. Ensure Node.js is installed.
 * 2. Save as 'generate.ts' and run: npx ts-node generate.ts
 * * ATTRIBUTIONS & LICENSES:
 * - Britfone: Created by Jose Llarena (MIT License). 
 * - Concreteness Norms: Brysbaert et al. (2014) (CC BY-NC 4.0).
 * - Sensorimotor Norms: Lynott et al. (2020), Lancaster University (CC BY 4.0).
 * - SCOWL: Kevin Atkinson (Copyright 2000-2019).
 */

import * as fs from 'fs';
import * as path from 'path';

// --- CONFIGURATION ---
const INPUT_FILES = {
    "britfone": "britfone.main.3.0.1.csv",
    "concreteness": "Concreteness_ratings_Brysbaert_et_al_BRM.txt",
    "sensorimotor": "Lancaster_sensorimotor_norms_for_39707_words.csv",
    "fallbackwords": "scowl-en_GB-ise.txt" 
};

const OUTPUT_FILE = '../public/dictionary-en_GB.json';
const COPYRIGHT_NOTICE = "Copyright (C) Ben Spiller 2026-present ; Commercial use of this dictionary is not permitted ; See https://github.com/ben-spiller/do-re-major-mnemonics for licensing information about this dictionary and the opensource data used to help created it";

const STATS_MAP: Record<string, string> = {
    'D': '1', 'N': '2', 'M': '3', 'R': '4', 'L': '5', 
    'J': '6', 'K': '7', 'F': '8', 'P': '9', 'S': '0'
};

const PHONETIC_MAP: Record<string, string> = {
    't': 'D', 'd': 'D', 'θ': 'D', 'ð': 'D', 
    'n': 'N', 'ŋ': 'N', 'm': 'M',
    'ɹ': 'R', 'r': 'R', 'l': 'L',
    'dʒ': 'J', 'tʃ': 'J', 'ʃ': 'J', 'ʒ': 'J', 'j': 'J', 
    'k': 'K', 'ɡ': 'K', 'g': 'K',
    'f': 'F', 'v': 'F',
    'p': 'P', 'b': 'P',
    's': 'S', 'z': 'S'
};

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

interface WordEntry {
    word: string;
    score: number;
}

/**
 * HEURISTIC: Estimates Bridge Code for words without phonetic data.
 */
function estimateBridgeCode(word: string): string {
    let w = word.toLowerCase().split("'")[0]; 
    w = w.replace(/ck/g, 'k').replace(/ph/g, 'f').replace(/tch/g, 'j')
         .replace(/kn/g, 'n').replace(/gn/g, 'n').replace(/wr/g, 'r');

    const rules: Record<string, string> = {
        't': 'D', 'd': 'D', 'n': 'N', 'm': 'M', 'r': 'R', 'l': 'L',
        'j': 'J', 'g': 'K', 'k': 'K', 'c': 'K', 'f': 'F', 'v': 'F',
        'p': 'P', 'b': 'P', 's': 'S', 'z': 'S'
    };

    let code = "";
    for (const char of w) { if (rules[char]) code += rules[char]; }
    return code.replace(/(.)\1+/g, '$1'); 
}

function highlightMnemonic(word: string, bridgeCode: string): string {
    let result = word.split("'")[0].toLowerCase();
    let currentPos = 0;
    for (const sound of bridgeCode) {
        const patterns = SOUND_TO_LETTERS[sound] || [];
        let bestMatch: { index: number; length: number } | null = null;
        for (const pattern of patterns) {
            const foundIndex = result.indexOf(pattern, currentPos);
            if (foundIndex !== -1 && (bestMatch === null || foundIndex < bestMatch.index)) {
                bestMatch = { index: foundIndex, length: pattern.length };
            }
        }
        if (bestMatch) {
            result = result.substring(0, bestMatch.index) + 
                     result.substring(bestMatch.index, bestMatch.index + bestMatch.length).toUpperCase() + 
                     result.substring(bestMatch.index + bestMatch.length);
            currentPos = bestMatch.index + bestMatch.length;
        }
    }
    return result;
}

function parseDataFile(filename: string) {
    if (!fs.existsSync(filename)) return [];
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
    console.log("🚀 Initializing Mnemonic Waterfall Generation...");

    try {
        const rankingData: Record<string, { concreteness: number, visual: number, haptic: number }> = {};
        const bridgeDict: Record<string, WordEntry[]> = {};
        let counts = { conc: 0, sensor: 0, britMapped: 0, fallbackMapped: 0 };

        // 1. Load Ranking Data
        parseDataFile(INPUT_FILES.concreteness).forEach(row => {
            const word = (row.Word || "").toLowerCase();
            rankingData[word] = { concreteness: parseFloat(row['Conc.M']) || 1.5, visual: 0, haptic: 0 };
            counts.conc++;
        });
        parseDataFile(INPUT_FILES.sensorimotor).forEach(row => {
            const word = (row.Word || "").toLowerCase();
            if (rankingData[word]) {
                rankingData[word].visual = parseFloat(row['Visual.mean']) || 0;
                rankingData[word].haptic = parseFloat(row['Hand_Arm.mean']) || 0;
                counts.sensor++;
            }
        });
        console.log(`    ✅ Loaded ${counts.conc} concrete and ${counts.sensor} sensorimotor ratings.`);

        // 2. Load Britfone (IPA)
        console.log("--- Processing Britfone (IPA-Verified)...");
        parseDataFile(INPUT_FILES.britfone).forEach(row => {
            const rawWord = (row['Word'] || row['word'] || row._rawValues[0] || "").replace(/\(\d+\)/g, '').trim();
            const phoneticsRaw = (row['Phonemes'] || row['phonemes'] || row._rawValues[1] || "");
            if (!rawWord || !phoneticsRaw) return;

            const word = rawWord.toLowerCase();
            const cleanPhonemes = phoneticsRaw.replace(/[ˈˌː]/g, '').trim().split(/\s+/);
            
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
            let score = (norms.concreteness * 5) + (norms.visual * 2) + (norms.haptic * 3) + 100; // IPA Priority

            const spellingConsonants = word.replace(/[aeiouy]/g, '').length;
            const mismatchPenalty = Math.abs(spellingConsonants - bridgeCode.length);
            score += (mismatchPenalty === 0) ? 30 : -(mismatchPenalty * 25);
            if (firstSoundIsConsonant) score += 100;

            if (!bridgeDict[bridgeCode]) bridgeDict[bridgeCode] = [];
            if (!bridgeDict[bridgeCode].some(e => e.word === word)) {
                bridgeDict[bridgeCode].push({ word, score });
            }
        });

        // 3. Load SCOWL Fallback
        if (fs.existsSync(INPUT_FILES.fallbackwords)) {
            console.log("--- Processing SCOWL (Heuristic Fallback)...");
            const scowlWords = fs.readFileSync(INPUT_FILES.fallbackwords, 'utf-8').split(/\r?\n/);
            scowlWords.forEach(line => {
                const rawWord = line.trim();
                const word = rawWord.split("'")[0]; 
                if (!word || word.length < 3) return;
                
                const bridgeCode = estimateBridgeCode(word);
                if (!bridgeCode) return;

                // Priority Check: Don't let fallback override IPA word
                const normWord = word.toLowerCase();
                if (bridgeDict[bridgeCode]?.some(e => e.word.toLowerCase() === normWord)) return;

                counts.fallbackMapped++;
                const norms = rankingData[normWord] || { concreteness: 1.2, visual: 1.0, haptic: 1.0 };
                let score = (norms.concreteness * 5) + (norms.visual * 2) + (norms.haptic * 3); // No IPA boost

                if (!bridgeDict[bridgeCode]) bridgeDict[bridgeCode] = [];
                bridgeDict[bridgeCode].push({ word: rawWord, score });
            });
        }

        // 4. Finalize & Coverage Stats
        const finalOutput: any = { "_metadata": COPYRIGHT_NOTICE };
        const coverageStats: Record<number, Set<string>> = {};
        let maxLength = 0;

        for (const code in bridgeDict) {
            const len = code.length;
            if (len > maxLength) maxLength = len;
            if (!coverageStats[len]) coverageStats[len] = new Set();
            const digits = code.split('').map(c => STATS_MAP[c] || "").join('');
            coverageStats[len].add(digits);

            finalOutput[code] = bridgeDict[code]
                .sort((a, b) => b.score - a.score)
                .slice(0, 15)
                .map(e => highlightMnemonic(e.word, code));
        }

        const dir = path.dirname(OUTPUT_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalOutput));

        // 5. Statistics Dashboard
        console.log("\n" + "=".repeat(40));
        console.log("📊 GENERATION STATISTICS");
        console.log("-".repeat(40));
        for (let i = 1; i <= Math.min(maxLength, 7); i++) {
            const count = coverageStats[i]?.size || 0;
            const possible = Math.pow(10, i);
            console.log(`Length ${i} Coverage:   ${((count / possible) * 100).toFixed(1)}% (${count}/${possible})`);
        }
        
        console.log("-".repeat(40));
        console.log("🧪 KEY VERIFICATION (TOP 5 PER DIGIT)");
        console.log("-".repeat(40));
        Object.entries(STATS_MAP).sort((a,b) => a[1].localeCompare(b[1])).forEach(([bridgeChar, digit]) => {
            const words = (finalOutput[bridgeChar] || []).slice(0, 5).join(', ');
            console.log(`${digit} (${bridgeChar}): ${words || "EMPTY ❌"}`);
        });

        console.log("-".repeat(40));
        console.log(`⏱️ Execution Time:     ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
        console.log(`📂 Output:              ${OUTPUT_FILE}`);
        console.log("=".repeat(40));

    } catch (err) { console.error(err); }
}

runGenerator();