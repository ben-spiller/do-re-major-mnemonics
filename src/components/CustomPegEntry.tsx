import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, AlertTriangle } from 'lucide-react';
import { MnemonicSystem } from '@/lib/mnemonicSystems';
import { wordToDigits } from '@/hooks/useMnemonicMatcher';

interface CustomPegEntryProps {
  system: MnemonicSystem;
  onAddPeg: (digits: string, word: string) => void;
}

export function CustomPegEntry({ system, onAddPeg }: CustomPegEntryProps) {
  const [digits, setDigits] = useState('');
  const [word, setWord] = useState('');
  const [warning, setWarning] = useState<string | null>(null);

  const handleDigitsChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    setDigits(cleaned);
    validatePeg(cleaned, word);
  };

  const handleWordChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z]/g, '');
    setWord(cleaned);
    validatePeg(digits, cleaned);
  };

  const validatePeg = (d: string, w: string) => {
    if (!d || !w) {
      setWarning(null);
      return;
    }

    const expectedDigits = wordToDigits(w, system);
    
    if (expectedDigits !== d) {
      if (expectedDigits) {
        setWarning(`"${w}" normally maps to "${expectedDigits}" in ${system === 'do-re-major' ? 'Do-Re-Major' : 'Major'} system, not "${d}"`);
      } else {
        setWarning(`"${w}" has no consonants that map to digits`);
      }
    } else {
      setWarning(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (digits && word) {
      onAddPeg(digits, word);
      setDigits('');
      setWord('');
      setWarning(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-muted/30 rounded-lg border">
      <p className="text-sm font-medium">Add Custom Peg</p>
      <div className="flex gap-2">
        <Input
          type="text"
          inputMode="numeric"
          placeholder="Digits (e.g., 16)"
          value={digits}
          onChange={(e) => handleDigitsChange(e.target.value)}
          className="w-24 font-mono"
        />
        <Input
          type="text"
          placeholder="Word (e.g., doll)"
          value={word}
          onChange={(e) => handleWordChange(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={!digits || !word}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      {warning && (
        <Alert variant="default" className="py-2 border-warning/50 bg-warning/10">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-xs text-warning">
            {warning}
          </AlertDescription>
        </Alert>
      )}
      
      <p className="text-xs text-muted-foreground">
        Your custom pegs will appear first in search results
      </p>
    </form>
  );
}
