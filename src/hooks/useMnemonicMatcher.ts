import { useMemo } from 'react';
import { wordList, WordEntry } from '@/lib/wordList';
import { mnemonicSystems, MnemonicSystem } from '@/lib/mnemonicSystems';

export interface MatchResult {
  words: string[];
  digits: string;
  digitsCovered: number[];
  isFullMatch: boolean;
  combinedFrequency: number;
}

// Convert a word to its digit sequence based on the mnemonic system
function wordToDigits(word: string, system: MnemonicSystem): string {
  const config = mnemonicSystems[system];
  const lowerWord = word.toLowerCase();
  let digits = '';
  let i = 0;

  while (i < lowerWord.length) {
    let matched = false;
    
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

// Find optimal word combinations using dynamic programming
function findWordCombinations(
  targetDigits: string,
  wordCache: Map<string, { word: string; digits: string; frequency: number }>,
  maxResults: number = 20
): MatchResult[] {
  if (!targetDigits) return [];
  
  const results: MatchResult[] = [];
  const seen = new Set<string>();
  
  // First, find exact single-word matches
  const exactMatches = findMatchingWords(targetDigits, wordCache);
  for (const match of exactMatches.slice(0, 5)) {
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
  
  // Then find combinations using greedy approach
  const findCombinationsRecursive = (
    remaining: string,
    startIndex: number,
    currentWords: string[],
    currentFrequency: number,
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
          combinedFrequency: currentFrequency,
        });
      }
      return;
    }
    
    if (depth > 4 || results.length >= maxResults * 2) return; // Limit depth and results
    
    const prefixMatches = findPrefixMatches(remaining, wordCache);
    
    for (const match of prefixMatches.slice(0, 10)) {
      findCombinationsRecursive(
        remaining.slice(match.digits.length),
        startIndex + match.digits.length,
        [...currentWords, match.word],
        currentFrequency + match.frequency,
        depth + 1
      );
    }
  };
  
  findCombinationsRecursive(targetDigits, 0, [], 0, 0);
  
  // Sort results: fewer words first, then by combined frequency
  results.sort((a, b) => {
    if (a.words.length !== b.words.length) {
      return a.words.length - b.words.length;
    }
    return a.combinedFrequency - b.combinedFrequency;
  });
  
  // Add some common partial matches for variety
  if (results.length < maxResults) {
    const prefixMatches = findPrefixMatches(targetDigits, wordCache);
    for (const match of prefixMatches.slice(0, 10)) {
      if (results.length >= maxResults) break;
      
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
  
  return results.slice(0, maxResults);
}

export function useMnemonicMatcher(digits: string, system: MnemonicSystem) {
  const wordCache = useMemo(() => buildWordDigitCache(system), [system]);
  
  const results = useMemo(() => {
    const cleanDigits = digits.replace(/\D/g, '');
    if (!cleanDigits) return [];
    
    return findWordCombinations(cleanDigits, wordCache, 20);
  }, [digits, wordCache]);
  
  return results;
}

// Export utility for getting word's digit representation
export function getWordDigits(word: string, system: MnemonicSystem): string {
  return wordToDigits(word, system);
}
