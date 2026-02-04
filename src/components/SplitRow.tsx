import { SplitRow as SplitRowType } from '@/hooks/useSegmentMatches';
import { SegmentBox } from '@/components/SegmentBox';
import { Dictionary } from '@/lib/dictionaryService';
import { MnemonicSystem } from '@/lib/mnemonicSystems';
import { Favorite } from '@/hooks/useFavorites';

interface SplitRowProps {
  splitRow: SplitRowType;
  dictionary: Dictionary;
  system: MnemonicSystem;
  customPegs: Favorite[];
  onFavorite: (digits: string, word: string) => void;
  isFavorite: (digits: string, word: string) => boolean;
}

export function SplitRow({
  splitRow,
  dictionary,
  system,
  customPegs,
  onFavorite,
  isFavorite,
}: SplitRowProps) {
  const hasAnyMatches = splitRow.segments.some(seg => seg.matches.length > 0);

  if (!hasAnyMatches) {
    return null; // Don't show splits with no matches
  }

  return (
    <div className="space-y-2">
      {/* Pattern label */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-muted-foreground">
          {splitRow.pattern}
        </span>
        {splitRow.parts.length === 1 && (
          <span className="text-xs text-primary font-medium">single word</span>
        )}
      </div>

      {/* Segment boxes */}
      <div className="flex gap-2">
        {splitRow.segments.map((segment, idx) => (
          <SegmentBox
            key={idx}
            segment={segment}
            dictionary={dictionary}
            system={system}
            customPegs={customPegs}
            onFavorite={onFavorite}
            isFavorite={isFavorite}
          />
        ))}
      </div>
    </div>
  );
}
