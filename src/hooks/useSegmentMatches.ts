import { useMemo } from 'react';
import { MnemonicSystem } from '@/lib/mnemonicSystems';
import { Favorite } from '@/hooks/useFavorites';
import { Dictionary, findWordsForDigits } from '@/lib/dictionaryService';
import { getDisplaySplits, DigitSplit } from '@/lib/digitSplitter';

export interface SegmentMatch {
  word: string;
  isCustomPeg?: boolean;
}

export interface Segment {
  digits: string;
  matches: SegmentMatch[];
  hasMore: boolean;
}

export interface SplitRow {
  pattern: string;
  parts: string[];
  segments: Segment[];
}

/**
 * Get all matching words for a specific digit segment.
 */
export function getMatchesForDigits(
  digits: string,
  dictionary: Dictionary,
  system: MnemonicSystem,
  customPegs: Favorite[]
): SegmentMatch[] {
  const results: SegmentMatch[] = [];
  const seen = new Set<string>();
  
  // Add custom pegs first (highest priority)
  for (const peg of customPegs) {
    if (peg.digits === digits && peg.words.length === 1) {
      const word = peg.words[0];
      if (!seen.has(word.toLowerCase())) {
        seen.add(word.toLowerCase());
        results.push({ word, isCustomPeg: true });
      }
    }
  }
  
  // Add dictionary words
  const dictWords = findWordsForDigits(dictionary, digits, system);
  for (const word of dictWords) {
    if (!seen.has(word.toLowerCase())) {
      seen.add(word.toLowerCase());
      results.push({ word });
    }
  }
  
  return results;
}

/**
 * Build split rows with segment matches for display.
 * Filters out rows where any segment has no matches.
 * Stops adding rows once total word combinations exceeds maxCombinations.
 */
export function buildSplitRows(
  digits: string,
  dictionary: Dictionary,
  system: MnemonicSystem,
  customPegs: Favorite[],
  maxCombinations: number = 50
): SplitRow[] {
  if (!digits) return [];
  
  // Get all possible splits (no pre-limit, we'll filter as we go)
  const allSplits = getDisplaySplits(digits, 100);
  
  const result: SplitRow[] = [];
  let totalCombinations = 0;
  
  for (const split of allSplits) {
    // Build segments for this split
    const segments: Segment[] = [];
    let allHaveMatches = true;
    let minCombinationsForRow = 1;
    
    for (const part of split.parts) {
      const matches = getMatchesForDigits(part, dictionary, system, customPegs);
      
      if (matches.length === 0) {
        allHaveMatches = false;
        break;
      }
      
      // Track minimum combinations (product of match counts per segment)
      minCombinationsForRow *= Math.min(matches.length, 5); // Use displayed count
      
      segments.push({
        digits: part,
        matches: matches.slice(0, 5), // Top 5 for display
        hasMore: matches.length > 5,
      });
    }
    
    // Skip rows where any segment has no matches
    if (!allHaveMatches) {
      continue;
    }
    
    // Check if adding this row would exceed the limit
    if (totalCombinations + minCombinationsForRow > maxCombinations && result.length > 0) {
      break;
    }
    
    totalCombinations += minCombinationsForRow;
    
    result.push({
      pattern: split.pattern,
      parts: split.parts,
      segments,
    });
  }
  
  return result;
}

/**
 * Hook to get all split rows with matches for the given digits.
 */
export function useSegmentMatches(
  digits: string,
  system: MnemonicSystem,
  dictionary: Dictionary | null,
  customPegs: Favorite[] = []
) {
  return useMemo(() => {
    if (!dictionary) return [];
    
    const cleanDigits = digits.replace(/\D/g, '');
    if (!cleanDigits) return [];
    
    return buildSplitRows(cleanDigits, dictionary, system, customPegs);
  }, [digits, system, dictionary, customPegs]);
}
