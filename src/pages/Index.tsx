import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NumberInput } from '@/components/NumberInput';
import { ModeToggle } from '@/components/ModeToggle';
import { MappingChart } from '@/components/MappingChart';
import { ResultsList } from '@/components/ResultsList';
import { FavoritesList } from '@/components/FavoritesList';
import { HowItWorksModal } from '@/components/HowItWorksModal';
import { useMnemonicMatcher } from '@/hooks/useMnemonicMatcher';
import { useFavorites } from '@/hooks/useFavorites';
import { MnemonicSystem } from '@/lib/mnemonicSystems';
import { Music, Search, Heart } from 'lucide-react';

const Index = () => {
  const [digits, setDigits] = useState('');
  const [system, setSystem] = useState<MnemonicSystem>('do-re-major');
  const [activeTab, setActiveTab] = useState('search');

  const results = useMnemonicMatcher(digits, system);
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();

  const handleFavorite = (words: string[]) => {
    const cleanDigits = digits.replace(/\D/g, '');
    if (isFavorite(cleanDigits, words, system)) {
      const fav = favorites.find(
        f => f.digits === cleanDigits && 
             f.words.join('+') === words.join('+') &&
             f.system === system
      );
      if (fav) removeFavorite(fav.id);
    } else {
      addFavorite({ digits: cleanDigits, words, system });
    }
  };

  const checkIsFavorite = (words: string[]) => {
    const cleanDigits = digits.replace(/\D/g, '');
    return isFavorite(cleanDigits, words, system);
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

            {/* Mapping Reference */}
            <MappingChart system={system} />

            {/* Results */}
            <section>
              <ResultsList
                results={results}
                system={system}
                digits={digits}
                onFavorite={handleFavorite}
                isFavorite={checkIsFavorite}
              />
            </section>
          </TabsContent>

          <TabsContent value="saved" className="mt-0">
            <FavoritesList
              favorites={favorites}
              onRemove={removeFavorite}
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
