import { Notes } from "../theory";

/**
 * This error is thrown when a note is not defined in the chromatic scale.
 * Look at: {@link Notes} enum for the list of notes.
 */
export class UndefinedNoteError extends Error {
  constructor(note: string) {
    const allNotes = Object.values(Notes).join(", ");
    super(
      `Note ${note} is not defined in the chromatic scale. Available notes: ${allNotes}`,
    );
  }
  public name = "UndefinedNoteError";
}
