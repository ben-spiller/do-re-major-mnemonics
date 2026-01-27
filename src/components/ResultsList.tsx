import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MatchResult } from '@/hooks/useMnemonicMatcher';
import { MnemonicSystem } from '@/lib/mnemonicSystems';
import { Heart, Copy, Check, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ResultsListProps {
  results: MatchResult[];
  system: MnemonicSystem;
  digits: string;
  onFavorite: (words: string[]) => void;
  isFavorite: (words: string[]) => boolean;
}

export function ResultsList({ 
  results, 
  system, 
  digits, 
  onFavorite, 
  isFavorite 
}: ResultsListProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (words: string[], index: number) => {
    const text = words.join(' + ');
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!digits) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">Enter numbers above to see matching words</p>
        <p className="text-sm mt-2">Try entering a memorable number like a phone or PIN</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No matches found for "{digits}"</p>
        <p className="text-sm mt-2">Try a shorter number sequence</p>
      </div>
    );
  }

  // Separate full matches from partial matches
  const fullMatches = results.filter(r => r.isFullMatch);
  const partialMatches = results.filter(r => !r.isFullMatch);

  return (
    <div className="space-y-4">
      {fullMatches.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Perfect Matches
          </h3>
          <div className="grid gap-2">
            {fullMatches.map((result, index) => (
              <ResultCard
                key={`full-${index}`}
                result={result}
                index={index}
                onCopy={handleCopy}
                onFavorite={onFavorite}
                isCopied={copiedIndex === index}
                isFav={isFavorite(result.words)}
                isPerfect
              />
            ))}
          </div>
        </div>
      )}

      {partialMatches.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Partial Matches
          </h3>
          <div className="grid gap-2">
            {partialMatches.map((result, index) => (
              <ResultCard
                key={`partial-${index}`}
                result={result}
                index={fullMatches.length + index}
                onCopy={handleCopy}
                onFavorite={onFavorite}
                isCopied={copiedIndex === fullMatches.length + index}
                isFav={isFavorite(result.words)}
                isPerfect={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ResultCardProps {
  result: MatchResult;
  index: number;
  onCopy: (words: string[], index: number) => void;
  onFavorite: (words: string[]) => void;
  isCopied: boolean;
  isFav: boolean;
  isPerfect: boolean;
}

function ResultCard({ 
  result, 
  index, 
  onCopy, 
  onFavorite, 
  isCopied, 
  isFav, 
  isPerfect 
}: ResultCardProps) {
  return (
    <Card className={`transition-all hover:shadow-md ${isPerfect ? 'border-primary/50 bg-primary/5' : ''}`}>
      <CardContent className="p-3 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-lg truncate">
            {result.words.join(' + ')}
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            {result.digits}
            {!result.isFullMatch && (
              <span className="ml-2 text-warning">
                (covers {result.digits.length} digit{result.digits.length !== 1 ? 's' : ''})
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onCopy(result.words, index)}
          >
            {isCopied ? (
              <Check className="h-4 w-4 text-primary" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onFavorite(result.words)}
          >
            <Heart 
              className={`h-4 w-4 transition-colors ${isFav ? 'fill-red-500 text-red-500' : ''}`} 
            />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
