export interface InstrumentAudioEngine {
  /**
   * Plays a tune.
   * @param options - The options for playing a note.
   */
  playNote(options: {
    note: string;
    velocity?: number;
    duration?: number;
    time?: number;
  }): Promise<void>;

  /**
   * Mutes the active note.
   * @param options - The options for muting a note.
   */
  muteNote(options: { note: string }): Promise<void>;

  /**
   * Disposes the audio engine.
   */
  dispose(): void;
}
