import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NumberInput } from '@/components/NumberInput';
import { ModeToggle } from '@/components/ModeToggle';
import { MappingChart } from '@/components/MappingChart';
import { SplitResultsList } from '@/components/SplitResultsList';
import { FavoritesList } from '@/components/FavoritesList';
import { HowItWorksModal } from '@/components/HowItWorksModal';
import { useFavorites } from '@/hooks/useFavorites';
import { useDictionary } from '@/hooks/useDictionary';
import { MnemonicSystem } from '@/lib/mnemonicSystems';
import { Music, Search, Heart, Loader2 } from 'lucide-react';

const Index = () => {
  const [digits, setDigits] = useState('');
  const [system, setSystem] = useState<MnemonicSystem>('do-re-major');
  const [activeTab, setActiveTab] = useState('search');

  const { dictionary, isLoading: isDictionaryLoading, error: dictionaryError } = useDictionary();
  const { favorites, addFavorite, addCustomPeg, removeFavorite, isFavorite, getCustomPegs } = useFavorites();
  const customPegs = getCustomPegs(system);

  // Handler for favoriting individual segment matches
  const handleSegmentFavorite = (segmentDigits: string, word: string) => {
    if (isFavorite(segmentDigits, [word], system)) {
      const fav = favorites.find(
        f => f.digits === segmentDigits && 
             f.words.length === 1 &&
             f.words[0] === word &&
             f.system === system
      );
      if (fav) removeFavorite(fav.id);
    } else {
      addFavorite({ digits: segmentDigits, words: [word], system });
    }
  };

  const checkSegmentFavorite = (segmentDigits: string, word: string) => {
    return isFavorite(segmentDigits, [word], system);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Music className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Do Re Major</h1>
                <p className="text-xs text-muted-foreground">Number Mnemonics</p>
              </div>
            </div>
            <HowItWorksModal />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-2xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search" className="gap-2">
              <Search className="h-4 w-4" />
              Search
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-2">
              <Heart className="h-4 w-4" />
              Saved
              {favorites.length > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground text-xs px-1.5 rounded-full">
                  {favorites.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6 mt-0">
            {/* Input Section */}
            <section className="space-y-4">
              <NumberInput
                value={digits}
                onChange={setDigits}
                placeholder="Enter numbers to memorise..."
              />
              <ModeToggle system={system} onSystemChange={setSystem} />
            </section>

            {/* Results */}
            <section>
              {isDictionaryLoading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading dictionary...</span>
                </div>
              ) : dictionaryError ? (
                <div className="text-center py-12 text-destructive">
                  <p>Failed to load dictionary</p>
                  <p className="text-sm text-muted-foreground">{dictionaryError}</p>
                </div>
              ) : (
                <SplitResultsList
                  digits={digits}
                  dictionary={dictionary}
                  system={system}
                  customPegs={customPegs}
                  onFavorite={handleSegmentFavorite}
                  isFavorite={checkSegmentFavorite}
                />
              )}
            </section>

            {/* Mapping Reference */}
            <MappingChart system={system} />

          </TabsContent>

          <TabsContent value="saved" className="mt-0">
            <FavoritesList
              favorites={favorites}
              onRemove={removeFavorite}
              onAddCustomPeg={addCustomPeg}
              currentSystem={system}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="container max-w-2xl mx-auto px-4 py-6 text-center text-xs text-muted-foreground">
        <p>Tip: Use memorable words to recall important numbers like PINs and dates!</p>
      </footer>
    </div>
  );
};

export default Index;
