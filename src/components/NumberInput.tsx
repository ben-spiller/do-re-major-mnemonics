import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Hash } from 'lucide-react';

interface NumberInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function NumberInput({ value, onChange, placeholder = "Enter numbers..." }: NumberInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const newValue = e.target.value.replace(/\D/g, '');
    onChange(newValue);
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
        <Hash className="h-5 w-5" />
      </div>
      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="h-14 pl-12 pr-12 text-2xl font-mono tracking-widest text-center bg-card border-2 focus-visible:ring-primary"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
