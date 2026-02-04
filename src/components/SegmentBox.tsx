import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { Segment, SegmentMatch, getMatchesForDigits } from '@/hooks/useSegmentMatches';
import { HighlightedWord } from '@/components/HighlightedWord';
import { Dictionary } from '@/lib/dictionaryService';
import { MnemonicSystem } from '@/lib/mnemonicSystems';
import { Favorite } from '@/hooks/useFavorites';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface SegmentBoxProps {
  segment: Segment;
  dictionary: Dictionary;
  system: MnemonicSystem;
  customPegs: Favorite[];
  onFavorite: (digits: string, word: string) => void;
  isFavorite: (digits: string, word: string) => boolean;
}

export function SegmentBox({
  segment,
  dictionary,
  system,
  customPegs,
  onFavorite,
  isFavorite,
}: SegmentBoxProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [allMatches, setAllMatches] = useState<SegmentMatch[] | null>(null);

  const handleExpand = () => {
    if (!isExpanded && !allMatches) {
      // Load all matches when expanding
      const matches = getMatchesForDigits(segment.digits, dictionary, system, customPegs);
      setAllMatches(matches);
    }
    setIsExpanded(!isExpanded);
  };

  const displayMatches = isExpanded && allMatches ? allMatches : segment.matches;
  const showExpandButton = segment.hasMore || (allMatches && allMatches.length > 5);

  return (
    <Card className="flex-1 min-w-0">
      <Collapsible open={isExpanded} onOpenChange={handleExpand}>
        <CardContent className="p-3">
          {/* Header with digits */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {segment.digits}
            </span>
            {showExpandButton && (
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  {isExpanded ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </Button>
              </CollapsibleTrigger>
            )}
          </div>

          {/* Collapsed view: Top 5 matches with favorite buttons */}
          {!isExpanded && (
            <div className="space-y-1">
              {segment.matches.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No matches</p>
              ) : (
                segment.matches.map((match, idx) => {
                  const favorited = isFavorite(segment.digits, match.word);
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between group hover:bg-muted/50 rounded px-1 -mx-1"
                    >
                      <div className="text-sm truncate flex-1">
                        <HighlightedWord word={match.word} />
                        {match.isCustomPeg && (
                          <span className="ml-1 text-xs text-primary">★</span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-6 w-6 transition-opacity ${
                          favorited ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                        onClick={() => onFavorite(segment.digits, match.word)}
                      >
                        <Heart
                          className={`h-3 w-3 ${
                            favorited ? 'fill-red-500 text-red-500' : ''
                          }`}
                        />
                      </Button>
                    </div>
                  );
                })
              )}
              {segment.hasMore && !isExpanded && (
                <CollapsibleTrigger asChild>
                  <button className="text-xs text-primary hover:underline">
                    + more...
                  </button>
                </CollapsibleTrigger>
              )}
            </div>
          )}

          {/* Expanded view: All matches with favorite buttons */}
          <CollapsibleContent>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {displayMatches.map((match, idx) => {
                const favorited = isFavorite(segment.digits, match.word);
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between group hover:bg-muted/50 rounded px-1 -mx-1"
                  >
                    <div className="text-sm truncate flex-1">
                      <HighlightedWord word={match.word} />
                      {match.isCustomPeg && (
                        <span className="ml-1 text-xs text-primary">★</span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-6 w-6 transition-opacity ${
                        favorited ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                      onClick={() => onFavorite(segment.digits, match.word)}
                    >
                      <Heart
                        className={`h-3 w-3 ${
                          favorited ? 'fill-red-500 text-red-500' : ''
                        }`}
                      />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
}
