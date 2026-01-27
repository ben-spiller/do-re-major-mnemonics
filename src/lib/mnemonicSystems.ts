// Mnemonic system configurations

export type MnemonicSystem = 'do-re-major' | 'major';

export interface SystemConfig {
  name: string;
  description: string;
  mappings: Record<string, string[]>;
  consonantToDigit: Record<string, string>;
}

// Do-Re-Major system (custom variant)
// 1=d/t/th, 2=r, 3=m, 4=f/ph, 5=s/z, 6=l, 7=k/g/c/q/ck, 8=ch/j, 9=p/b, 0=n
const doReMajorMappings: Record<string, string[]> = {
  '0': ['n'],
  '1': ['d', 't', 'th'],
  '2': ['r'],
  '3': ['m'],
  '4': ['f', 'ph', 'v'],
  '5': ['s', 'z', 'ss', 'c', 'sc'],
  '6': ['l'],
  '7': ['k', 'g', 'c', 'q', 'ck', 'ch', 'x'],
  '8': ['ch', 'j', 'sh', 'ge', 'dg'],
  '9': ['p', 'b'],
};

// Standard Major mnemonic system
// 0=s/z, 1=t/d/th, 2=n, 3=m, 4=r, 5=l, 6=j/ch/sh, 7=k/g/c/q, 8=f/v/ph, 9=p/b
const majorMappings: Record<string, string[]> = {
  '0': ['s', 'z', 'ss', 'c', 'sc'],
  '1': ['t', 'd', 'th'],
  '2': ['n'],
  '3': ['m'],
  '4': ['r'],
  '5': ['l'],
  '6': ['j', 'ch', 'sh', 'ge', 'dg'],
  '7': ['k', 'g', 'c', 'q', 'ck', 'x'],
  '8': ['f', 'v', 'ph'],
  '9': ['p', 'b'],
};

function buildConsonantToDigitMap(mappings: Record<string, string[]>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [digit, consonants] of Object.entries(mappings)) {
    for (const consonant of consonants) {
      result[consonant.toLowerCase()] = digit;
    }
  }
  return result;
}

export const mnemonicSystems: Record<MnemonicSystem, SystemConfig> = {
  'do-re-major': {
    name: 'Do-Re-Major',
    description: 'A musical variant using intuitive consonant associations',
    mappings: doReMajorMappings,
    consonantToDigit: buildConsonantToDigitMap(doReMajorMappings),
  },
  'major': {
    name: 'Major System',
    description: 'The classic phonetic number system used since the 17th century',
    mappings: majorMappings,
    consonantToDigit: buildConsonantToDigitMap(majorMappings),
  },
};

// Display info for the mapping chart
export const digitColors: Record<string, string> = {
  '0': 'hsl(var(--chart-1))',
  '1': 'hsl(var(--chart-2))',
  '2': 'hsl(var(--chart-3))',
  '3': 'hsl(var(--chart-4))',
  '4': 'hsl(var(--chart-5))',
  '5': 'hsl(200, 70%, 50%)',
  '6': 'hsl(280, 60%, 55%)',
  '7': 'hsl(30, 80%, 50%)',
  '8': 'hsl(350, 70%, 55%)',
  '9': 'hsl(170, 60%, 45%)',
};

export const digitDisplayInfo: Record<string, { label: string; mnemonic: string }> = {
  '0': { label: '0', mnemonic: 'N for None/Zero' },
  '1': { label: '1', mnemonic: 'D/T - one downstroke' },
  '2': { label: '2', mnemonic: 'R - two strokes' },
  '3': { label: '3', mnemonic: 'M - three humps' },
  '4': { label: '4', mnemonic: 'F - four letters' },
  '5': { label: '5', mnemonic: 'S - curves like 5' },
  '6': { label: '6', mnemonic: 'L - looks like 6' },
  '7': { label: '7', mnemonic: 'K/G - angular like 7' },
  '8': { label: '8', mnemonic: 'Ch/J - two loops' },
  '9': { label: '9', mnemonic: 'P/B - mirror of 9' },
};
