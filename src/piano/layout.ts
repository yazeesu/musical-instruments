import { Notes } from "../audio/theory";

export const NATURAL_NOTES = [
  Notes.C,
  Notes.D,
  Notes.E,
  Notes.F,
  Notes.G,
  Notes.A,
  Notes.B,
] as const;

const SHARP_AFTER: Record<(typeof NATURAL_NOTES)[number], string | null> = {
  [Notes.C]: Notes.CSharp,
  [Notes.D]: Notes.DSharp,
  [Notes.E]: null,
  [Notes.F]: Notes.FSharp,
  [Notes.G]: Notes.GSharp,
  [Notes.A]: Notes.ASharp,
  [Notes.B]: null,
};

export type PianoBlackKey = {
  note: string;
  afterWhiteIndex: number;
};

export type PianoLayout = {
  whiteKeys: string[];
  blackKeys: PianoBlackKey[];
};

/**
 *
 * @param startOctave - The octave to start at.
 * @param octaveCount - The number of octaves to create.
 * @returns A piano layout with the given number of octaves.
 */
export function createPianoLayout(
  startOctave: number,
  octaveCount: number,
): PianoLayout {
  const whiteKeys: string[] = [];
  const blackKeys: PianoBlackKey[] = [];

  for (let o = 0; o < octaveCount; o++) {
    const octave = startOctave + o;
    for (const natural of NATURAL_NOTES) {
      const whiteIndex = whiteKeys.length;
      whiteKeys.push(`${natural}${octave}`);

      const sharpPitch = SHARP_AFTER[natural];
      if (sharpPitch) {
        blackKeys.push({
          note: `${sharpPitch}${octave}`,
          afterWhiteIndex: whiteIndex,
        });
      }
    }
  }

  return { whiteKeys, blackKeys };
}

export function blackKeyLeftPercent(
  afterWhiteIndex: number,
  whiteKeyCount: number,
): number {
  return ((afterWhiteIndex + 1) / whiteKeyCount) * 100;
}

export function blackKeyWidthPercent(whiteKeyCount: number): number {
  return (100 / whiteKeyCount) * 0.62;
}
