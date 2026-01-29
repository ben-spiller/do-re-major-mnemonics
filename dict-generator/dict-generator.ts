/**
 * Standalone script for generating the dictionary. Requires downloading 
 * some third party files.
 * 
 * HOW TO RUN:
 * 1. Ensure you have Node.js installed.
 * 2. Run: npx ts-node generate-dictionary.ts
 * * REQUIRED SOURCE FILES IN SAME FOLDER:
 * - beep.txt (From OpenSLR)
 * - concreteness.csv (From Brysbaert et al.)
 * - sensorimotor.csv (From Lancaster University)
 */

import * as fs from 'fs';

/**
 * BRIDGE CODE DEFINITION:
 * A Bridge Code is an intermediate phonetic string used to decouple sounds from digits.
 * It allows the same dictionary to work for Standard Major, Do-Re-Major, etc.
 * * Example: Word "Dog"
 * Phonetics: [D, AO, G]
 * Bridge Code: "DK" (D for t/d, K for k/g)
 * Standard Mapping: D->1, K->7 = "17"
 * Do-Re-Major Mapping: D->2, K->1 = "21"
 */

const PHONETIC_MAP: Record<string, string> = {
    'T': 'D', 'D': 'D',
    'N': 'N', 'M': 'M', 'R': 'R', 'L': 'L',
    'CH': 'J', 'JH': 'J', 'SH': 'J', 'ZH': 'J',
    'K': 'K', 'G': 'K',
    'F': 'F', 'V': 'F',
    'P': 'P', 'B': 'P',
    'S': 'S', 'Z': 'S'
};

interface WordEntry {
    word: string;
    score: number;
}

// Simple CSV parser using string operations to avoid dependencies
function parseCsv(filename: string) {
    const content = fs.readFileSync(filename, 'utf-8');
    const lines = content.split(/\r?\n/);
    const headers = lines[0].split(/[,\t]/).map(h => h.trim().replace(/^"|"$/g, ''));
    
    return lines.slice(1).map(line => {
        const values = line.split(/[,\t]/).map(v => v.trim().replace(/^"|"$/g, ''));
        const obj: any = {};
        headers.forEach((h, i) => obj[h] = values[i]);
        return obj;
    });
}

function runGenerator() {
    console.log("🚀 Starting Mnemonic Dictionary Build...");

    const rankingData: Record<string, { concreteness: number, visual: number, haptic: number }> = {};

    // 1. Load Concreteness (Brysbaert)
    console.log("--- Reading Concreteness Norms...");
    const concreteRecords = parseCsv('concreteness.csv');
    concreteRecords.forEach(row => {
        const word = (row.Word || "").toLowerCase();
        if (word) {
            rankingData[word] = { 
                concreteness: parseFloat(row['Conc.M']) || 0, 
                visual: 0, 
                haptic: 0 
            };
        }
    });

    // 2. Load Sensorimotor (Lancaster)
    console.log("--- Reading Sensorimotor Norms...");
    const sensorRecords = parseCsv('sensorimotor.csv');
    sensorRecords.forEach(row => {
        const word = (row.Word || "").toLowerCase();
        if (rankingData[word]) {
            rankingData[word].visual = parseFloat(row['Visual.mean']) || 0;
            rankingData[word].haptic = parseFloat(row['Hand_Arm.mean']) || 0;
        }
    });

    // 3. Process BEEP
    const bridgeDict: Record<string, WordEntry[]> = {};
    if (!fs.existsSync('beep.txt')) {
        console.error("❌ Error: beep.txt not found.");
        return;
    }
    const beepLines = fs.readFileSync('beep.txt', 'utf-8').split('\n');

    console.log("--- Analyzing BEEP Phonetics...");
    for (const line of beepLines) {
        if (!line || line.startsWith('#')) continue;

        const parts = line.split(/\t/);
        const rawWord = parts[0];
        const phoneticsRaw = parts[1];
        if (!phoneticsRaw) continue;

        const word = rawWord.toLowerCase().split('(')[0]; 
        const phonetics = phoneticsRaw.trim().split(' ');

        let bridgeCode = "";
        let firstSoundIsConsonant = false;
        let foundFirstConsonant = false;

        for (let i = 0; i < phonetics.length; i++) {
            const sound = phonetics[i].replace(/[0-9]/g, ''); 
            const mapped = PHONETIC_MAP[sound];

            if (mapped) {
                bridgeCode += mapped;
                if (!foundFirstConsonant) {
                    if (i === 0) firstSoundIsConsonant = true;
                    foundFirstConsonant = true;
                }
            }
        }

        if (!bridgeCode) continue;

        const norms = rankingData[word] || { concreteness: 2, visual: 2, haptic: 2 };
        
        // Final Ranking Formula
        let score = (norms.concreteness * 5) + (norms.visual * 2) + (norms.haptic * 3);
        
        // Mnemonic Preferences
        if (firstSoundIsConsonant) score += 100; // Prefer "Dog" over "Add"
        if (bridgeCode.endsWith('R')) score -= 15; // Penalty for UK non-rhotic ambiguity
        if (word.length <= 2) score -= 10; // Avoid tiny abstract words

        if (!bridgeDict[bridgeCode]) bridgeDict[bridgeCode] = [];
        if (!bridgeDict[bridgeCode].some(e => e.word === word)) {
            bridgeDict[bridgeCode].push({ word, score });
        }
    }

    // 4. Sort and Export
    console.log("--- Sorting and Picking Top 15...");
    const finalOutput: Record<string, string[]> = {};
    for (const code in bridgeDict) {
        finalOutput[code] = bridgeDict[code]
            .sort((a, b) => b.score - a.score)
            .slice(0, 15)
            .map(e => e.word);
    }

    fs.writeFileSync('../public/dictionary-en-uk.json', JSON.stringify(finalOutput, null, 2));
    console.log(`✅ Success! Generated ${Object.keys(finalOutput).length} mappings in dictionary.json`);
}

runGenerator();