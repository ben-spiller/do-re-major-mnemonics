import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Favorite } from '@/hooks/useFavorites';
import { MnemonicSystem } from '@/lib/mnemonicSystems';
import { Trash2, Copy, Heart, Star } from 'lucide-react';
import { toast } from 'sonner';
import { CustomPegEntry } from './CustomPegEntry';

interface FavoritesListProps {
  favorites: Favorite[];
  onRemove: (id: string) => void;
  onAddCustomPeg: (digits: string, word: string, system: MnemonicSystem) => void;
  currentSystem: MnemonicSystem;
}

export function FavoritesList({ favorites, onRemove, onAddCustomPeg, currentSystem }: FavoritesListProps) {
  const handleCopy = async (words: string[]) => {
    await navigator.clipboard.writeText(words.join(' + '));
    toast.success('Copied to clipboard!');
  };

  const handleAddPeg = (digits: string, word: string) => {
    onAddCustomPeg(digits, word, currentSystem);
    toast.success(`Added "${word}" as peg for ${digits}`);
  };

  // Separate custom pegs from regular favorites
  const customPegs = favorites.filter(f => f.isCustomPeg);
  const regularFavorites = favorites.filter(f => !f.isCustomPeg);

  return (
    <div className="space-y-6">
      <CustomPegEntry system={currentSystem} onAddPeg={handleAddPeg} />

      {customPegs.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Star className="h-4 w-4 text-primary" />
            Custom Pegs
          </h3>
          <div className="space-y-2">
            {customPegs.map(favorite => (
              <FavoriteCard
                key={favorite.id}
                favorite={favorite}
                onCopy={handleCopy}
                onRemove={onRemove}
                isCustomPeg
              />
            ))}
          </div>
        </div>
      )}

      {regularFavorites.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Saved Favourites
          </h3>
          <div className="space-y-2">
            {regularFavorites.map(favorite => (
              <FavoriteCard
                key={favorite.id}
                favorite={favorite}
                onCopy={handleCopy}
                onRemove={onRemove}
                isCustomPeg={false}
              />
            ))}
          </div>
        </div>
      )}

      {favorites.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Heart className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg">No saved mnemonics yet</p>
          <p className="text-sm mt-2">Add custom pegs above or tap the heart on results</p>
        </div>
      )}
    </div>
  );
}

interface FavoriteCardProps {
  favorite: Favorite;
  onCopy: (words: string[]) => void;
  onRemove: (id: string) => void;
  isCustomPeg: boolean;
}

function FavoriteCard({ favorite, onCopy, onRemove, isCustomPeg }: FavoriteCardProps) {
  return (
    <Card className={`transition-all hover:shadow-md ${isCustomPeg ? 'border-primary/30 bg-primary/5' : ''}`}>
      <CardContent className="p-3 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-lg truncate">
              {favorite.words.join(' + ')}
            </p>
            {isCustomPeg && (
              <Badge variant="secondary" className="text-xs shrink-0">
                Peg
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">{favorite.digits}</span>
            <span>•</span>
            <span className="capitalize">{favorite.system.replace('-', ' ')}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onCopy(favorite.words)}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onRemove(favorite.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
