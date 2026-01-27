import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Favorite } from '@/hooks/useFavorites';
import { Trash2, Copy, Heart } from 'lucide-react';
import { toast } from 'sonner';

interface FavoritesListProps {
  favorites: Favorite[];
  onRemove: (id: string) => void;
}

export function FavoritesList({ favorites, onRemove }: FavoritesListProps) {
  const handleCopy = async (words: string[]) => {
    await navigator.clipboard.writeText(words.join(' + '));
    toast.success('Copied to clipboard!');
  };

  if (favorites.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Heart className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <p className="text-lg">No saved mnemonics yet</p>
        <p className="text-sm mt-2">Tap the heart icon on any result to save it</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {favorites.map(favorite => (
        <Card key={favorite.id} className="transition-all hover:shadow-md">
          <CardContent className="p-3 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-lg truncate">
                {favorite.words.join(' + ')}
              </p>
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
                onClick={() => handleCopy(favorite.words)}
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
      ))}
    </div>
  );
}
