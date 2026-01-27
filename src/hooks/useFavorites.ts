import { useState, useEffect, useCallback } from 'react';

export interface Favorite {
  id: string;
  digits: string;
  words: string[];
  system: 'do-re-major' | 'major';
  createdAt: number;
}

const STORAGE_KEY = 'do-re-major-favorites';

function loadFavorites(): Favorite[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load favorites:', error);
  }
  return [];
}

function saveFavorites(favorites: Favorite[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error('Failed to save favorites:', error);
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  // Load favorites on mount
  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  const addFavorite = useCallback((favorite: Omit<Favorite, 'id' | 'createdAt'>) => {
    const newFavorite: Favorite = {
      ...favorite,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      createdAt: Date.now(),
    };

    setFavorites(prev => {
      // Check if already exists
      const exists = prev.some(
        f => f.digits === favorite.digits && 
             f.words.join('+') === favorite.words.join('+') &&
             f.system === favorite.system
      );
      
      if (exists) return prev;

      const updated = [newFavorite, ...prev];
      saveFavorites(updated);
      return updated;
    });
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const updated = prev.filter(f => f.id !== id);
      saveFavorites(updated);
      return updated;
    });
  }, []);

  const isFavorite = useCallback((digits: string, words: string[], system: 'do-re-major' | 'major') => {
    return favorites.some(
      f => f.digits === digits && 
           f.words.join('+') === words.join('+') &&
           f.system === system
    );
  }, [favorites]);

  const clearAllFavorites = useCallback(() => {
    setFavorites([]);
    saveFavorites([]);
  }, []);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    clearAllFavorites,
  };
}
