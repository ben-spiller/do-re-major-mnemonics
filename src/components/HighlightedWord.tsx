import { cn } from '@/lib/utils';

interface HighlightedWordProps {
  /** Word with uppercase letters indicating consonants to highlight */
  word: string;
  className?: string;
}

/**
 * Renders a word in lowercase with the consonant letters (originally uppercase) 
 * displayed in bold and with primary color highlighting.
 */
export function HighlightedWord({ word, className }: HighlightedWordProps) {
  const segments: { char: string; isConsonant: boolean }[] = [];
  
  for (const char of word) {
    // Skip variant markers like (1), (2)
    if (char === '(' || char === ')' || /\d/.test(char)) continue;
    
    const isUpper = char === char.toUpperCase() && char !== char.toLowerCase();
    segments.push({
      char: char.toLowerCase(),
      isConsonant: isUpper,
    });
  }

  return (
    <span className={cn("", className)}>
      {segments.map((seg, i) => (
        <span
          key={i}
          className={cn(
            seg.isConsonant && "font-bold text-primary"
          )}
        >
          {seg.char}
        </span>
      ))}
    </span>
  );
}

interface HighlightedWordsProps {
  /** Array of words with uppercase consonants */
  words: string[];
  separator?: string;
  className?: string;
}

/**
 * Renders multiple words separated by a connector, each with consonant highlighting.
 */
export function HighlightedWords({ words, separator = " + ", className }: HighlightedWordsProps) {
  return (
    <span className={cn("", className)}>
      {words.map((word, i) => (
        <span key={i}>
          {i > 0 && <span className="text-muted-foreground">{separator}</span>}
          <HighlightedWord word={word} />
        </span>
      ))}
    </span>
  );
}
