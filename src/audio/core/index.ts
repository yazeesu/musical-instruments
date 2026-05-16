/**
 * The instrument audio engine interface.
 * This interface is used to play and mute notes using a specific instrument.
 */
export interface InstrumentAudioEngine {
  /**
   * Plays a note.
   * @param note - The target note to play (C3, D3, D#3, etc.)
   * @param velocity - The velocity of the note (0.0 to 1.0)
   * @param duration - The duration of the note in seconds.
   * @param time - The time at which the note should start playing. ( default: Tone.now() if not provided. )
   */
  playNote(options: {
    /** */
    note: string;

    /** */
    velocity?: number;

    /** */
    duration?: number;

    /** */
    time?: number;
  }): Promise<void>;

  /**
   * Mutes the target note.
   * @param note - The target note to mute.
   */
  muteNote(options: { note: string }): Promise<void>;

  /**
   * Disposes the audio engine.
   * This function should be called when the audio engine is no longer needed.
   * It cleans up all the resources used by the audio engine in order to prevent memory leaks.
   */
  dispose(): void;
}
