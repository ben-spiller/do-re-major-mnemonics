import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MnemonicSystem } from '@/lib/mnemonicSystems';
import { Music, BookOpen } from 'lucide-react';

interface ModeToggleProps {
  system: MnemonicSystem;
  onSystemChange: (system: MnemonicSystem) => void;
}

export function ModeToggle({ system, onSystemChange }: ModeToggleProps) {
  const isDoReMajor = system === 'do-re-major';

  return (
    <div className="flex items-center justify-center gap-3 p-3 rounded-lg bg-muted/50">
      <div className={`flex items-center gap-1.5 transition-opacity ${!isDoReMajor ? 'opacity-50' : ''}`}>
        <Music className="h-4 w-4 text-primary" />
        <Label 
          htmlFor="mode-toggle" 
          className={`text-sm font-medium cursor-pointer ${isDoReMajor ? 'text-primary' : 'text-muted-foreground'}`}
        >
          Do-Re-Major
        </Label>
      </div>
      
      <Switch
        id="mode-toggle"
        checked={!isDoReMajor}
        onCheckedChange={(checked) => onSystemChange(checked ? 'major' : 'do-re-major')}
        className="data-[state=checked]:bg-secondary"
      />
      
      <div className={`flex items-center gap-1.5 transition-opacity ${isDoReMajor ? 'opacity-50' : ''}`}>
        <BookOpen className="h-4 w-4 text-secondary-foreground" />
        <Label 
          htmlFor="mode-toggle" 
          className={`text-sm font-medium cursor-pointer ${!isDoReMajor ? 'text-foreground' : 'text-muted-foreground'}`}
        >
          Major System
        </Label>
      </div>
    </div>
  );
}
