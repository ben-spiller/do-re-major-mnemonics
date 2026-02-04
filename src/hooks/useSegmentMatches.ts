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
 */
export function buildSplitRows(
  digits: string,
  dictionary: Dictionary,
  system: MnemonicSystem,
  customPegs: Favorite[],
  maxSplits: number = 15
): SplitRow[] {
  if (!digits) return [];
  
  const displaySplits = getDisplaySplits(digits, maxSplits);
  
  return displaySplits.map(split => {
    const segments: Segment[] = split.parts.map(part => {
      const matches = getMatchesForDigits(part, dictionary, system, customPegs);
      return {
        digits: part,
        matches: matches.slice(0, 5), // Top 5 for display
        hasMore: matches.length > 5,
      };
    });
    
    return {
      pattern: split.pattern,
      parts: split.parts,
      segments,
    };
  });
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
