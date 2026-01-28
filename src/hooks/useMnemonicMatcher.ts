import { useMemo } from 'react';
import { wordList } from '@/lib/wordList';
import { mnemonicSystems, MnemonicSystem } from '@/lib/mnemonicSystems';
import { Favorite } from '@/hooks/useFavorites';

export interface MatchResult {
  words: string[];
  digits: string;
  digitsCovered: number[];
  isFullMatch: boolean;
  combinedFrequency: number;
  isCustomPeg?: boolean;
}

// Convert a word to its digit sequence based on the mnemonic system
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

// Pre-compute word-to-digit mappings for efficiency
function buildWordDigitCache(system: MnemonicSystem): Map<string, { word: string; digits: string; frequency: number }> {
  const cache = new Map();
  
  for (const entry of wordList) {
    const digits = wordToDigits(entry.word, system);
    if (digits.length > 0) {
      cache.set(entry.word, {
        word: entry.word,
        digits,
        frequency: entry.frequency,
      });
    }
  }
  
  return cache;
}

// Find all words that match a specific digit sequence
function findMatchingWords(
  targetDigits: string,
  wordCache: Map<string, { word: string; digits: string; frequency: number }>
): { word: string; frequency: number }[] {
  const matches: { word: string; frequency: number }[] = [];
  
  for (const [word, data] of wordCache) {
    if (data.digits === targetDigits) {
      matches.push({ word, frequency: data.frequency });
    }
  }
  
  // Sort by frequency (most common first)
  return matches.sort((a, b) => a.frequency - b.frequency);
}

// Find words that match a prefix of the target digits
function findPrefixMatches(
  targetDigits: string,
  wordCache: Map<string, { word: string; digits: string; frequency: number }>
): { word: string; digits: string; frequency: number }[] {
  const matches: { word: string; digits: string; frequency: number }[] = [];
  
  for (const [word, data] of wordCache) {
    if (targetDigits.startsWith(data.digits) && data.digits.length > 0) {
      matches.push({ word, digits: data.digits, frequency: data.frequency });
    }
  }
  
  // Sort by length (longer first), then frequency
  return matches.sort((a, b) => {
    if (b.digits.length !== a.digits.length) {
      return b.digits.length - a.digits.length;
    }
    return a.frequency - b.frequency;
  });
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

// Find optimal word combinations using dynamic programming
function findWordCombinations(
  targetDigits: string,
  wordCache: Map<string, { word: string; digits: string; frequency: number }>,
  customPegs: Favorite[],
  maxResults: number = 20
): MatchResult[] {
  if (!targetDigits) return [];
  
  const results: MatchResult[] = [];
  const seen = new Set<string>();
  
  // First, check for custom pegs that match
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
  
  // Then, find exact single-word matches
  const exactMatches = findMatchingWords(targetDigits, wordCache);
  for (const match of exactMatches.slice(0, 8)) {
    const key = match.word;
    if (!seen.has(key)) {
      seen.add(key);
      results.push({
        words: [match.word],
        digits: targetDigits,
        digitsCovered: Array.from({ length: targetDigits.length }, (_, i) => i),
        isFullMatch: true,
        combinedFrequency: match.frequency,
      });
    }
  }
  
  // Build a map of custom peg words for quick lookup during combinations
  const pegDigitsMap = new Map<string, { word: string; digits: string }>();
  for (const peg of customPegs) {
    if (targetDigits.startsWith(peg.digits) && peg.words.length === 1) {
      pegDigitsMap.set(peg.digits, { word: peg.words[0], digits: peg.digits });
    }
  }
  
  // Then find combinations using greedy approach
  const findCombinationsRecursive = (
    remaining: string,
    startIndex: number,
    currentWords: string[],
    currentFrequency: number,
    hasCustomPeg: boolean,
    depth: number = 0
  ) => {
    if (remaining.length === 0) {
      const key = currentWords.slice().sort().join('+');
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          words: [...currentWords],
          digits: targetDigits,
          digitsCovered: Array.from({ length: targetDigits.length }, (_, i) => i),
          isFullMatch: true,
          combinedFrequency: hasCustomPeg ? currentFrequency - 500 : currentFrequency,
          isCustomPeg: hasCustomPeg,
        });
      }
      return;
    }
    
    if (depth > 4 || results.length >= maxResults * 3) return;
    
    // First try custom pegs that match the remaining digits
    for (const [pegDigits, pegData] of pegDigitsMap) {
      if (remaining.startsWith(pegDigits)) {
        findCombinationsRecursive(
          remaining.slice(pegDigits.length),
          startIndex + pegDigits.length,
          [...currentWords, pegData.word],
          currentFrequency - 500,
          true,
          depth + 1
        );
      }
    }
    
    const prefixMatches = findPrefixMatches(remaining, wordCache);
    
    for (const match of prefixMatches.slice(0, 8)) {
      findCombinationsRecursive(
        remaining.slice(match.digits.length),
        startIndex + match.digits.length,
        [...currentWords, match.word],
        currentFrequency + match.frequency,
        hasCustomPeg,
        depth + 1
      );
    }
  };
  
  findCombinationsRecursive(targetDigits, 0, [], 0, false, 0);
  
  // Sort results: custom pegs first, then fewer words, then by combined frequency
  results.sort((a, b) => {
    // Custom pegs always first
    if (a.isCustomPeg && !b.isCustomPeg) return -1;
    if (!a.isCustomPeg && b.isCustomPeg) return 1;
    
    if (a.words.length !== b.words.length) {
      return a.words.length - b.words.length;
    }
    return a.combinedFrequency - b.combinedFrequency;
  });
  
  // Add some partial matches for variety
  if (results.length < maxResults) {
    // Check for partial custom pegs
    for (const peg of customPegs) {
      if (targetDigits.startsWith(peg.digits) && peg.digits.length < targetDigits.length) {
        const key = `partial-peg:${peg.words.join('+')}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            words: peg.words,
            digits: peg.digits,
            digitsCovered: Array.from({ length: peg.digits.length }, (_, i) => i),
            isFullMatch: false,
            combinedFrequency: -500,
            isCustomPeg: true,
          });
        }
      }
    }
    
    const prefixMatches = findPrefixMatches(targetDigits, wordCache);
    for (const match of prefixMatches.slice(0, 10)) {
      if (results.length >= maxResults * 2) break;
      
      const key = `partial:${match.word}`;
      if (!seen.has(key) && match.digits.length < targetDigits.length) {
        seen.add(key);
        results.push({
          words: [match.word],
          digits: match.digits,
          digitsCovered: Array.from({ length: match.digits.length }, (_, i) => i),
          isFullMatch: false,
          combinedFrequency: match.frequency,
        });
      }
    }
  }
  
  // Diversify results to avoid similar words
  return diversifyResults(results, maxResults);
}

export function useMnemonicMatcher(digits: string, system: MnemonicSystem, customPegs: Favorite[] = []) {
  const wordCache = useMemo(() => buildWordDigitCache(system), [system]);
  
  const results = useMemo(() => {
    const cleanDigits = digits.replace(/\D/g, '');
    if (!cleanDigits) return [];
    
    return findWordCombinations(cleanDigits, wordCache, customPegs, 20);
  }, [digits, wordCache, customPegs]);
  
  return results;
}

// Export utility for getting word's digit representation
export function getWordDigits(word: string, system: MnemonicSystem): string {
  return wordToDigits(word, system);
}
