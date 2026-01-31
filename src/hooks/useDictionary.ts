import { useState, useEffect } from 'react';
import { loadDictionary, Dictionary } from '@/lib/dictionaryService';

/**
 * Hook to load and cache the dictionary.
 */
export function useDictionary() {
  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDictionary()
      .then(dict => {
        setDictionary(dict);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load dictionary:', err);
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  return { dictionary, isLoading, error };
}
