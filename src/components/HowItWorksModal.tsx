import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HelpCircle, Music, BookOpen } from 'lucide-react';
import { digitColors, mnemonicSystems } from '@/lib/mnemonicSystems';

export function HowItWorksModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <HelpCircle className="h-4 w-4" />
          How It Works
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            Understanding Mnemonic Systems
          </DialogTitle>
          <DialogDescription>
            Convert numbers into memorable words using consonant sounds
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Introduction */}
          <section>
            <h3 className="font-semibold mb-2">What is a Mnemonic System?</h3>
            <p className="text-sm text-muted-foreground">
              Mnemonic systems help you remember numbers by converting them into 
              words. Each digit is assigned consonant sounds, and you form words 
              using those consonants. Vowels don't count – they're just "glue" 
              to make words!
            </p>
          </section>

          {/* Do-Re-Major System */}
          <section>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Music className="h-4 w-4 text-primary" />
              Do-Re-Major System
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              A musical variant with intuitive associations. Think of the musical 
              notes Do, Re, Mi... mapped to numbers!
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(mnemonicSystems['do-re-major'].mappings).map(([digit, sounds]) => (
                <div 
                  key={digit} 
                  className="flex items-center gap-2 p-2 rounded"
                  style={{ backgroundColor: `${digitColors[digit]}15` }}
                >
                  <span 
                    className="w-6 h-6 flex items-center justify-center rounded font-bold text-white text-xs"
                    style={{ backgroundColor: digitColors[digit] }}
                  >
                    {digit}
                  </span>
                  <span className="font-mono text-xs">{sounds.slice(0, 3).join(', ')}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Major System */}
          <section>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Classic Major System
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              The traditional phonetic system used since the 17th century. 
              Based on visual similarities between numbers and letters.
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(mnemonicSystems['major'].mappings).map(([digit, sounds]) => (
                <div 
                  key={digit} 
                  className="flex items-center gap-2 p-2 rounded"
                  style={{ backgroundColor: `${digitColors[digit]}15` }}
                >
                  <span 
                    className="w-6 h-6 flex items-center justify-center rounded font-bold text-white text-xs"
                    style={{ backgroundColor: digitColors[digit] }}
                  >
                    {digit}
                  </span>
                  <span className="font-mono text-xs">{sounds.slice(0, 3).join(', ')}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Examples */}
          <section className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">📝 Examples</h3>
            <div className="space-y-2 text-sm">
              <div>
                <strong>123</strong> → "dream" (d=1, r=2, m=3) in Do-Re-Major
              </div>
              <div>
                <strong>42</strong> → "rain" (r=4, n=2) in Major System
              </div>
              <div>
                <strong>91</strong> → "bat" (b=9, t=1) in Do-Re-Major
              </div>
            </div>
          </section>

          {/* Tips */}
          <section>
            <h3 className="font-semibold mb-2">💡 Tips for Memorising</h3>
            <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
              <li>Create vivid mental images of the words</li>
              <li>Link multiple words into a story</li>
              <li>The sillier the image, the more memorable!</li>
              <li>Practice by converting phone numbers or PINs</li>
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
