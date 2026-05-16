/**
 * This error is thrown when trying to play a MIDI file without loading it first.
 */
export class MIDISourceError extends Error {
  constructor(
    message: string,
    public readonly reason: string,
  ) {
    super(message);
    console.error(this.name, this.message);
  }
}

/**
 * This error is thrown when an error occurs during the playback of a MIDI file.
 */
export class MIDIPlaybackError extends Error {
  constructor(
    message: string,
    public readonly reason: string,
  ) {
    super(message);
    console.error(this.name, this.message);
  }
}
