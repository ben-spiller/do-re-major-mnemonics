/**
 * Dijkstra-based word matcher for finding optimal digit-to-word combinations.
 * Uses weighted shortest path to favor balanced mid-sized words.
 */

import { Dictionary, digitsToBridgeCode } from './dictionaryService';
import { MnemonicSystem } from './mnemonicSystems';
import { Favorite } from '@/hooks/useFavorites';

// Weight penalties for word lengths
const WEIGHT_1_DIGIT = 10;  // Heavy penalty for single-digit matches
const WEIGHT_2_DIGIT = 3;   // Light penalty for 2-digit matches
const WEIGHT_DEFAULT = 1;   // Base weight for 3+ digit matches

interface PathNode {
  position: number;
  totalWeight: number;
  words: { word: string; startPos: number; endPos: number; isCustomPeg?: boolean }[];
}

interface WordMatch {
  word: string;
  digits: string;
  length: number;
  weight: number;
  isCustomPeg?: boolean;
}

/**
 * Calculate weight based on word length (in digits covered)
 */
function getWeight(digitLength: number): number {
  if (digitLength === 1) return WEIGHT_1_DIGIT;
  if (digitLength === 2) return WEIGHT_2_DIGIT;
  return WEIGHT_DEFAULT;
}

/**
 * Build a map of all possible word matches at each position
 */
function buildWordMap(
  targetDigits: string,
  dictionary: Dictionary,
  system: MnemonicSystem,
  customPegs: Favorite[]
): Map<number, WordMatch[]> {
  const wordMap = new Map<number, WordMatch[]>();
  
  // Initialize empty arrays for each position
  for (let i = 0; i < targetDigits.length; i++) {
    wordMap.set(i, []);
  }
  
  // Add custom pegs first (they get priority via slight weight reduction)
  for (const peg of customPegs) {
    if (peg.words.length === 1) {
      for (let startPos = 0; startPos <= targetDigits.length - peg.digits.length; startPos++) {
        if (targetDigits.slice(startPos, startPos + peg.digits.length) === peg.digits) {
          const matches = wordMap.get(startPos)!;
          matches.push({
            word: peg.words[0],
            digits: peg.digits,
            length: peg.digits.length,
            weight: getWeight(peg.digits.length) - 0.5, // Slight priority for custom pegs
            isCustomPeg: true,
          });
        }
      }
    }
  }
  
  // Add dictionary words for each starting position
  for (let startPos = 0; startPos < targetDigits.length; startPos++) {
    const matches = wordMap.get(startPos)!;
    
    // Try all possible lengths from this position
    for (let len = 1; len <= targetDigits.length - startPos; len++) {
      const digitSlice = targetDigits.slice(startPos, startPos + len);
      const bridgeCode = digitsToBridgeCode(digitSlice, system);
      const words = dictionary[bridgeCode];
      
      if (words && words.length > 0) {
        // Take top 5 words for each bridge code to limit search space
        for (const word of words.slice(0, 5)) {
          matches.push({
            word,
            digits: digitSlice,
            length: len,
            weight: getWeight(len),
          });
        }
      }
    }
  }
  
  return wordMap;
}

export interface DijkstraResult {
  words: string[];
  digits: string;
  digitsCovered: number[];
  isFullMatch: boolean;
  totalWeight: number;
  isCustomPeg?: boolean;
}

/**
 * Find optimal word combinations using Dijkstra's shortest path algorithm.
 * Returns up to maxResults combinations, aborting early once limit is reached.
 */
export function findOptimalCombinations(
  targetDigits: string,
  dictionary: Dictionary,
  system: MnemonicSystem,
  customPegs: Favorite[],
  maxResults: number = 50
): DijkstraResult[] {
  if (!targetDigits || targetDigits.length === 0) return [];
  
  const wordMap = buildWordMap(targetDigits, dictionary, system, customPegs);
  const results: DijkstraResult[] = [];
  const seen = new Set<string>();
  
  // Priority queue: [position, totalWeight, path]
  // Using array and sorting (simple implementation)
  const queue: PathNode[] = [{ position: 0, totalWeight: 0, words: [] }];
  
  // Track best weight to reach each position (for pruning)
  const bestWeightToPosition = new Map<number, number>();
  bestWeightToPosition.set(0, 0);
  
  while (queue.length > 0 && results.length < maxResults) {
    // Sort by weight and extract minimum
    queue.sort((a, b) => a.totalWeight - b.totalWeight);
    const current = queue.shift()!;
    
    // If we've reached the end, record this result
    if (current.position === targetDigits.length) {
      const wordList = current.words.map(w => w.word);
      const key = wordList.join('+');
      
      if (!seen.has(key)) {
        seen.add(key);
        const hasCustomPeg = current.words.some(w => w.isCustomPeg);
        results.push({
          words: wordList,
          digits: targetDigits,
          digitsCovered: Array.from({ length: targetDigits.length }, (_, i) => i),
          isFullMatch: true,
          totalWeight: current.totalWeight,
          isCustomPeg: hasCustomPeg,
        });
      }
      continue;
    }
    
    // Get all possible next words from current position
    const possibleWords = wordMap.get(current.position) || [];
    
    for (const match of possibleWords) {
      const newPosition = current.position + match.length;
      const newWeight = current.totalWeight + match.weight;
      
      // Pruning: skip if we've found a better path to this position
      const bestWeight = bestWeightToPosition.get(newPosition);
      // Allow slightly worse paths to find diverse results
      if (bestWeight !== undefined && newWeight > bestWeight + 5) {
        continue;
      }
      
      if (bestWeight === undefined || newWeight < bestWeight) {
        bestWeightToPosition.set(newPosition, newWeight);
      }
      
      queue.push({
        position: newPosition,
        totalWeight: newWeight,
        words: [...current.words, {
          word: match.word,
          startPos: current.position,
          endPos: newPosition,
          isCustomPeg: match.isCustomPeg,
        }],
      });
    }
  }
  
  return results;
}

/**
 * Find partial matches (for when no full match exists)
 * Returns words that cover a prefix of the target digits
 */
export function findPartialMatches(
  targetDigits: string,
  dictionary: Dictionary,
  system: MnemonicSystem,
  customPegs: Favorite[],
  maxResults: number = 10
): DijkstraResult[] {
  const results: DijkstraResult[] = [];
  const seen = new Set<string>();
  
  // Check custom pegs first
  for (const peg of customPegs) {
    if (targetDigits.startsWith(peg.digits) && peg.digits.length < targetDigits.length) {
      const key = `peg:${peg.words.join('+')}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          words: peg.words,
          digits: peg.digits,
          digitsCovered: Array.from({ length: peg.digits.length }, (_, i) => i),
          isFullMatch: false,
          totalWeight: getWeight(peg.digits.length) - 0.5,
          isCustomPeg: true,
        });
      }
    }
  }
  
  // Find longest partial matches from dictionary
  for (let len = Math.min(targetDigits.length - 1, 8); len >= 1; len--) {
    if (results.length >= maxResults) break;
    
    const digitSlice = targetDigits.slice(0, len);
    const bridgeCode = digitsToBridgeCode(digitSlice, system);
    const words = dictionary[bridgeCode];
    
    if (words && words.length > 0) {
      for (const word of words.slice(0, 3)) {
        const key = `partial:${word}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            words: [word],
            digits: digitSlice,
            digitsCovered: Array.from({ length: len }, (_, i) => i),
            isFullMatch: false,
            totalWeight: getWeight(len),
          });
        }
      }
    }
  }
  
  // Sort by coverage (longer = better), then by weight
  results.sort((a, b) => {
    const coverageDiff = b.digits.length - a.digits.length;
    if (coverageDiff !== 0) return coverageDiff;
    return a.totalWeight - b.totalWeight;
  });
  
  return results.slice(0, maxResults);
}
