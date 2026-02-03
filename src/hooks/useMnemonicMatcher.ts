import { useMemo } from 'react';
import { MnemonicSystem, mnemonicSystems } from '@/lib/mnemonicSystems';
import { Favorite } from '@/hooks/useFavorites';
import { Dictionary, findWordsForDigits } from '@/lib/dictionaryService';
import { 
  findOptimalCombinations, 
  findPartialMatches, 
  DijkstraResult 
} from '@/lib/dijkstraWordMatcher';

export interface MatchResult {
  words: string[];
  digits: string;
  digitsCovered: number[];
  isFullMatch: boolean;
  combinedFrequency: number;
  isCustomPeg?: boolean;
}

// Convert a word to its digit sequence based on the mnemonic system (for validation)
export function wordToDigits(word: string, system: MnemonicSystem): string {
  const config = mnemonicSystems[system];
  const lowerWord = word.toLowerCase();
  let digits = '';
  let i = 0;

  while (i < lowerWord.length) {
    let matched = false;
    
    // Skip consecutive identical consonants (e.g., ll, ss, tt) - treat as single sound
    if (i > 0 && lowerWord[i] === lowerWord[i - 1] && config.consonantToDigit[lowerWord[i]] !== undefined) {
      i++;
      continue;
    }
    
    // Try matching multi-character consonant patterns first (longest first)
    const multiPatterns = ['sch', 'tch', 'dge', 'ck', 'ph', 'th', 'ch', 'sh', 'sc', 'ss', 'ge', 'dg'];
    
    for (const pattern of multiPatterns) {
      if (lowerWord.slice(i).startsWith(pattern)) {
        const digit = config.consonantToDigit[pattern];
        if (digit !== undefined) {
          digits += digit;
          i += pattern.length;
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      // Try single character
      const char = lowerWord[i];
      const digit = config.consonantToDigit[char];
      if (digit !== undefined) {
        digits += digit;
      }
      // Skip vowels and other non-mapped characters
      i++;
    }
  }

  return digits;
}

// Check if two words are too similar (share the same root/stem)
function areSimilar(word1: string, word2: string): boolean {
  const w1 = word1.toLowerCase();
  const w2 = word2.toLowerCase();
  
  // Exact match
  if (w1 === w2) return true;
  
  // One is prefix of other (e.g., "run" and "running")
  if (w1.startsWith(w2) || w2.startsWith(w1)) return true;
  
  // Check common suffix variations
  const suffixes = ['s', 'es', 'ed', 'ing', 'er', 'est', 'ly', 'tion', 'ness'];
  for (const suffix of suffixes) {
    const base1 = w1.endsWith(suffix) ? w1.slice(0, -suffix.length) : w1;
    const base2 = w2.endsWith(suffix) ? w2.slice(0, -suffix.length) : w2;
    if (base1 === base2 || base1 === w2 || base2 === w1) return true;
  }
  
  return false;
}

// Filter results to avoid similar words
function diversifyResults(results: MatchResult[], maxResults: number): MatchResult[] {
  const diversified: MatchResult[] = [];
  const usedWords = new Set<string>();
  
  for (const result of results) {
    // Check if any word in this result is too similar to already used words
    const hasSimilar = result.words.some(word => {
      for (const usedWord of usedWords) {
        if (areSimilar(word, usedWord)) return true;
      }
      return false;
    });
    
    // Custom pegs always get included
    if (!hasSimilar || result.isCustomPeg) {
      diversified.push(result);
      result.words.forEach(w => usedWords.add(w.toLowerCase()));
    }
    
    if (diversified.length >= maxResults) break;
  }
  
  return diversified;
}

// Convert Dijkstra results to MatchResults
function convertToMatchResults(dijkstraResults: DijkstraResult[]): MatchResult[] {
  return dijkstraResults.map((result, index) => ({
    words: result.words,
    digits: result.digits,
    digitsCovered: result.digitsCovered,
    isFullMatch: result.isFullMatch,
    combinedFrequency: result.totalWeight + index * 0.01, // Use weight as frequency proxy
    isCustomPeg: result.isCustomPeg,
  }));
}

// Find word combinations using Dijkstra's algorithm
function findWordCombinations(
  targetDigits: string,
  dictionary: Dictionary,
  system: MnemonicSystem,
  customPegs: Favorite[],
  maxResults: number = 20
): MatchResult[] {
  if (!targetDigits) return [];
  
  const results: MatchResult[] = [];
  const seen = new Set<string>();
  
  // First, check for exact custom peg matches (highest priority)
  for (const peg of customPegs) {
    if (peg.digits === targetDigits) {
      const key = `peg:${peg.words.join('+')}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          words: peg.words,
          digits: targetDigits,
          digitsCovered: Array.from({ length: targetDigits.length }, (_, i) => i),
          isFullMatch: true,
          combinedFrequency: -1000, // Highest priority
          isCustomPeg: true,
        });
      }
    }
  }
  
  // Find exact single-word matches from dictionary (high priority)
  const exactWords = findWordsForDigits(dictionary, targetDigits, system);
  for (const word of exactWords.slice(0, 15)) {
    const key = word;
    if (!seen.has(key)) {
      seen.add(key);
      results.push({
        words: [word],
        digits: targetDigits,
        digitsCovered: Array.from({ length: targetDigits.length }, (_, i) => i),
        isFullMatch: true,
        combinedFrequency: exactWords.indexOf(word),
      });
    }
  }
  
  // Use Dijkstra to find optimal combinations
  const dijkstraResults = findOptimalCombinations(
    targetDigits, 
    dictionary, 
    system, 
    customPegs, 
    50 // Abort after 50 matches
  );
  
  // Convert and add Dijkstra results (skip single-word exact matches we already have)
  for (const result of dijkstraResults) {
    if (result.words.length === 1 && seen.has(result.words[0])) continue;
    
    const key = result.words.join('+');
    if (!seen.has(key)) {
      seen.add(key);
      results.push({
        words: result.words,
        digits: result.digits,
        digitsCovered: result.digitsCovered,
        isFullMatch: result.isFullMatch,
        combinedFrequency: result.totalWeight + results.length * 0.01,
        isCustomPeg: result.isCustomPeg,
      });
    }
  }
  
  // Add partial matches if we don't have enough full matches
  if (results.filter(r => r.isFullMatch).length < maxResults) {
    const partialResults = findPartialMatches(targetDigits, dictionary, system, customPegs, 10);
    const convertedPartials = convertToMatchResults(partialResults);
    
    for (const partial of convertedPartials) {
      const key = `partial:${partial.words.join('+')}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push(partial);
      }
    }
  }
  
  // Sort: custom pegs first, then full matches, then by weight (fewer = better)
  results.sort((a, b) => {
    // Custom pegs always first
    if (a.isCustomPeg && !b.isCustomPeg) return -1;
    if (!a.isCustomPeg && b.isCustomPeg) return 1;
    
    // Full matches before partial
    if (a.isFullMatch && !b.isFullMatch) return -1;
    if (!a.isFullMatch && b.isFullMatch) return 1;
    
    // Fewer words preferred
    if (a.words.length !== b.words.length) {
      return a.words.length - b.words.length;
    }
    
    // Lower frequency/weight is better
    return a.combinedFrequency - b.combinedFrequency;
  });
  
  // Diversify results to avoid similar words
  return diversifyResults(results, maxResults);
}

export function useMnemonicMatcher(
  digits: string, 
  system: MnemonicSystem, 
  dictionary: Dictionary | null,
  customPegs: Favorite[] = []
) {
  const results = useMemo(() => {
    if (!dictionary) return [];
    
    const cleanDigits = digits.replace(/\D/g, '');
    if (!cleanDigits) return [];
    
    return findWordCombinations(cleanDigits, dictionary, system, customPegs, 20);
  }, [digits, system, dictionary, customPegs]);
  
  return results;
}

// Export utility for getting word's digit representation
export function getWordDigits(word: string, system: MnemonicSystem): string {
  return wordToDigits(word, system);
}
