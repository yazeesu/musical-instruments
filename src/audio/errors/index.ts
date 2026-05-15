export class UndefinedNoteError extends Error {
  constructor(note: string) {
    super(`Note ${note} is not defined in the chromatic scale.`);
  }
  public name = "UndefinedNoteError";
}
