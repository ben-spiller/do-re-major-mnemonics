import { SplitRow } from '@/components/SplitRow';
import { useSegmentMatches } from '@/hooks/useSegmentMatches';
import { Dictionary } from '@/lib/dictionaryService';
import { MnemonicSystem } from '@/lib/mnemonicSystems';
import { Favorite } from '@/hooks/useFavorites';

interface SplitResultsListProps {
  digits: string;
  dictionary: Dictionary;
  system: MnemonicSystem;
  customPegs: Favorite[];
  onFavorite: (digits: string, word: string) => void;
  isFavorite: (digits: string, word: string) => boolean;
}

export function SplitResultsList({
  digits,
  dictionary,
  system,
  customPegs,
  onFavorite,
  isFavorite,
}: SplitResultsListProps) {
  const splitRows = useSegmentMatches(digits, system, dictionary, customPegs);
  const cleanDigits = digits.replace(/\D/g, '');

  if (!cleanDigits) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">Enter numbers above to see matching words</p>
        <p className="text-sm mt-2">Try entering a memorable number like a phone or PIN</p>
      </div>
    );
  }

  if (splitRows.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No matches found for "{cleanDigits}"</p>
        <p className="text-sm mt-2">Try a shorter number sequence</p>
      </div>
    );
  }

  // Filter out rows with no matches
  const rowsWithMatches = splitRows.filter(row =>
    row.segments.some(seg => seg.matches.length > 0)
  );

  if (rowsWithMatches.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No matches found for "{cleanDigits}"</p>
        <p className="text-sm mt-2">Try a shorter number sequence</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rowsWithMatches.map((splitRow, idx) => (
        <SplitRow
          key={splitRow.pattern}
          splitRow={splitRow}
          dictionary={dictionary}
          system={system}
          customPegs={customPegs}
          onFavorite={onFavorite}
          isFavorite={isFavorite}
        />
      ))}
    </div>
  );
}
