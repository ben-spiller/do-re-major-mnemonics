/**
 * Dictionary service for loading and caching the phonetic dictionary.
 * Uses bridge codes as keys (e.g., "DK" = D+K consonant sounds).
 */

import { MnemonicSystem } from './mnemonicSystems';

export interface Dictionary {
  [bridgeCode: string]: string[];
}

// Bridge code to digit mappings for each system
// Bridge codes: D=t/d, N=n, M=m, R=r, L=l, J=ch/sh/j, K=k/g, F=f/v, P=p/b, S=s/z
const BRIDGE_TO_DIGIT: Record<MnemonicSystem, Record<string, string>> = {
  'major': {
    'D': '1', 'N': '2', 'M': '3', 'R': '4', 'L': '5',
    'J': '6', 'K': '7', 'F': '8', 'P': '9', 'S': '0'
  },
  'do-re-major': {
    'D': '1', 'N': '0', 'M': '3', 'R': '2', 'L': '6',
    'J': '8', 'K': '7', 'F': '4', 'P': '9', 'S': '5'
  }
};

// Reverse mapping: digit to possible bridge codes
const DIGIT_TO_BRIDGE: Record<MnemonicSystem, Record<string, string>> = {
  'major': {
    '0': 'S', '1': 'D', '2': 'N', '3': 'M', '4': 'R',
    '5': 'L', '6': 'J', '7': 'K', '8': 'F', '9': 'P'
  },
  'do-re-major': {
    '0': 'N', '1': 'D', '2': 'R', '3': 'M', '4': 'F',
    '5': 'S', '6': 'L', '7': 'K', '8': 'J', '9': 'P'
  }
};

// Cached dictionary
let cachedDictionary: Dictionary | null = null;
let loadPromise: Promise<Dictionary> | null = null;

/**
 * Load the dictionary from the JSON file.
 * Uses caching to avoid reloading.
 */
export async function loadDictionary(): Promise<Dictionary> {
  if (cachedDictionary) {
    return cachedDictionary;
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = fetch('/dictionary-en_GB.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load dictionary: ${response.statusText}`);
      }
      return response.json();
    })
    .then((data: Dictionary) => {
      // Remove metadata key if present
      const { _metadata, ...dictionary } = data as Dictionary & { _metadata?: string };
      cachedDictionary = dictionary;
      console.log(`Dictionary loaded: ${Object.keys(dictionary).length} bridge codes`);
      return dictionary;
    })
    .catch(error => {
      loadPromise = null;
      throw error;
    });

  return loadPromise;
}

/**
 * Convert a bridge code to its digit representation for a given system.
 */
export function bridgeCodeToDigits(bridgeCode: string, system: MnemonicSystem): string {
  const mapping = BRIDGE_TO_DIGIT[system];
  return bridgeCode.split('').map(char => mapping[char] || '').join('');
}

/**
 * Convert a digit string to the corresponding bridge code for a given system.
 */
export function digitsToBridgeCode(digits: string, system: MnemonicSystem): string {
  const mapping = DIGIT_TO_BRIDGE[system];
  return digits.split('').map(d => mapping[d] || '').join('');
}

/**
 * Find all words from the dictionary that match a given digit sequence.
 */
export function findWordsForDigits(
  dictionary: Dictionary,
  digits: string,
  system: MnemonicSystem
): string[] {
  const bridgeCode = digitsToBridgeCode(digits, system);
  return dictionary[bridgeCode] || [];
}

/**
 * Find all bridge codes that start with a prefix matching the digits.
 */
export function findPrefixMatches(
  dictionary: Dictionary,
  digits: string,
  system: MnemonicSystem
): { bridgeCode: string; digits: string; words: string[] }[] {
  const results: { bridgeCode: string; digits: string; words: string[] }[] = [];
  const targetBridgePrefix = digitsToBridgeCode(digits, system);

  for (const [bridgeCode, words] of Object.entries(dictionary)) {
    if (bridgeCode.length > 0 && words.length > 0) {
      // Check if this bridge code represents a prefix of our target digits
      const codeDigits = bridgeCodeToDigits(bridgeCode, system);
      if (digits.startsWith(codeDigits) && codeDigits.length > 0 && codeDigits.length <= digits.length) {
        results.push({ bridgeCode, digits: codeDigits, words });
      }
    }
  }

  // Sort by length (longer first), to prioritize longer matches
  return results.sort((a, b) => b.digits.length - a.digits.length);
}

/**
 * Get the bridge code mapping for display/debugging.
 */
export function getBridgeToDigitMapping(system: MnemonicSystem): Record<string, string> {
  return BRIDGE_TO_DIGIT[system];
}
