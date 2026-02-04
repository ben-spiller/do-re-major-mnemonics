/**
 * Utility for generating all possible ways to split a digit string.
 */

export interface DigitSplit {
  parts: string[];
  pattern: string; // e.g., "12+34" or "1234"
}

/**
 * Generate all possible ways to split a digit string into contiguous parts.
 * For "1234" returns: ["1234"], ["123","4"], ["12","34"], ["1","234"], ["12","3","4"], etc.
 * Limited to reasonable split counts for performance.
 */
export function generateAllSplits(digits: string, maxParts: number = 4): DigitSplit[] {
  if (!digits || digits.length === 0) return [];
  
  const results: DigitSplit[] = [];
  
  // Helper to recursively generate splits
  function generateSplitsRecursive(
    remaining: string,
    currentParts: string[],
    startIndex: number
  ) {
    // If we've used all digits, record this split
    if (remaining.length === 0) {
      if (currentParts.length <= maxParts) {
        results.push({
          parts: [...currentParts],
          pattern: currentParts.join('+'),
        });
      }
      return;
    }
    
    // Limit splits to maxParts
    if (currentParts.length >= maxParts) {
      // Must take remaining as final part
      results.push({
        parts: [...currentParts, remaining],
        pattern: [...currentParts, remaining].join('+'),
      });
      return;
    }
    
    // Try taking 1, 2, 3, ... digits as next part
    for (let len = 1; len <= remaining.length; len++) {
      const part = remaining.slice(0, len);
      const rest = remaining.slice(len);
      generateSplitsRecursive(rest, [...currentParts, part], startIndex + len);
    }
  }
  
  generateSplitsRecursive(digits, [], 0);
  
  // Sort by number of parts (fewer parts first), then by pattern
  results.sort((a, b) => {
    if (a.parts.length !== b.parts.length) {
      return a.parts.length - b.parts.length;
    }
    // For same number of parts, prefer balanced splits (similar part lengths)
    const balanceA = Math.max(...a.parts.map(p => p.length)) - Math.min(...a.parts.map(p => p.length));
    const balanceB = Math.max(...b.parts.map(p => p.length)) - Math.min(...b.parts.map(p => p.length));
    return balanceA - balanceB;
  });
  
  return results;
}

/**
 * Get a reasonable subset of splits for display.
 * Limits total combinations to avoid overwhelming the UI.
 */
export function getDisplaySplits(digits: string, maxSplits: number = 15): DigitSplit[] {
  const allSplits = generateAllSplits(digits, 4);
  return allSplits.slice(0, maxSplits);
}
