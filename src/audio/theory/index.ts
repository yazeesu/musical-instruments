import { UndefinedNoteError } from "../errors";

/**
 * The notes of the chromatic scale.
 */
export enum Notes {
  C = "C",
  CSharp = "C#", // Or D bemol
  D = "D",
  DSharp = "D#", // Or E bemol
  E = "E",
  F = "F",
  FSharp = "F#", // Or G bemol
  G = "G",
  GSharp = "G#", // Or A bemol
  A = "A",
  ASharp = "A#", // Or B bemol
  B = "B",
}

/**
 * Notes repeat every 12 semitones.
 */
export enum Semitones {
  C = 0,
  CSharp = 1,
  D = 2,
  DSharp = 3,
  E = 4,
  F = 5,
  FSharp = 6,
  G = 7,
  GSharp = 8,
  A = 9,
  ASharp = 10,
  B = 11,
}

export const KEYBOARD_MAPS: Record<string, string> = {
  q: Notes.C,
  "2": Notes.CSharp,
  w: Notes.D,
  "3": Notes.DSharp,
  e: Notes.E,
  r: Notes.F,
  "5": Notes.FSharp,
  t: Notes.G,
  "6": Notes.GSharp,
  y: Notes.A,
  "7": Notes.ASharp,
  u: Notes.B,
};

const BASE_A_FREQUENCY = 440;

/**
 * Converts a note name to a MIDI note number.
 *
 * @example
 * convertNoteToMIDI("C4") // 60 -> MIDI number
 * convertNoteToMIDI("C#4") // 61 -> MIDI number
 * convertNoteToMIDI("D4") // 62 -> MIDI number
 * convertNoteToMIDI("D#4") // 63 -> MIDI number
 * @param note - Note name to convert to MIDI number.
 * @returns
 * @deprecated - ToneJS provides this function out of the box.
 */
export const convertNoteToMIDI = (note: string): number => {
  const match = note.match(/^([A-G]#?)(\d)$/);

  if (!match) throw new UndefinedNoteError(note);

  const [, pitch, octaveStr] = match;

  const octave = parseInt(octaveStr);

  return (octave + 1) * 12 + Semitones[pitch as keyof typeof Semitones];
};

/**
 * Converts a MIDI note number to a frequency in Hertz.
 * @example
 * const midi = convertNoteToMIDI("A4");
 * const frequency = convertMIDIToFrequency(midi);
 * console.log(frequency, "Hz"); // 440 Hz
 * @param midi - MIDI note number to convert to frequency.
 * @returns
 * @deprecated - ToneJS provides this function out of the box.
 */
export const convertMIDIToFrequency = (midi: number): number =>
  BASE_A_FREQUENCY * Math.pow(2, (midi - 69) / 12);

/**
 * Abstracts the conversion of a note to a frequency.
 * @param note - Note name to convert to frequency.
 * @returns
 * @deprecated - ToneJS provides this function out of the box.
 */
export const convertNoteToFrequency = (note: string): number =>
  convertMIDIToFrequency(convertNoteToMIDI(note));
