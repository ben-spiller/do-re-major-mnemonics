import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mnemonicSystems, MnemonicSystem, digitColors } from '@/lib/mnemonicSystems';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface MappingChartProps {
  system: MnemonicSystem;
}

export function MappingChart({ system }: MappingChartProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = mnemonicSystems[system];
  const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <Card className="border-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{config.name} Mapping</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 px-2"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span className="ml-1 text-xs">{isExpanded ? 'Less' : 'More'}</span>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">{config.description}</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-2">
          {digits.map(digit => (
            <div
              key={digit}
              className="flex flex-col items-center p-2 rounded-lg transition-all hover:scale-105"
              style={{ backgroundColor: `${digitColors[digit]}20` }}
            >
              <span
                className="text-xl font-bold"
                style={{ color: digitColors[digit] }}
              >
                {digit}
              </span>
              <span className="text-xs font-medium text-center mt-1 text-foreground">
                {config.mappings[digit].slice(0, 3).join(', ')}
              </span>
            </div>
          ))}
        </div>
        
        {isExpanded && (
          <div className="mt-4 pt-4 border-t space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">Full Mapping Details:</h4>
            <div className="grid gap-1.5">
              {digits.map(digit => (
                <div key={digit} className="flex items-center gap-2 text-sm">
                  <span
                    className="w-6 h-6 flex items-center justify-center rounded font-bold text-white"
                    style={{ backgroundColor: digitColors[digit] }}
                  >
                    {digit}
                  </span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-mono">
                    {config.mappings[digit].join(', ')}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 rounded-lg bg-muted/50">
              <h4 className="font-medium text-sm mb-2">💡 Tips:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Vowels (a, e, i, o, u) have no value</li>
                <li>• W, H, Y are also ignored</li>
                <li>• Focus on <strong>sounds</strong>, not just letters</li>
                <li>• "ph" sounds like "f", "th" is its own sound</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
