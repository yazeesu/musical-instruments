/**
 * The result of loading a audio source into an audio player engine.
 */
export type AudioPlayerSourceLoadResult<TData = unknown> =
  /**
   * The loading was successful.
   * @param source - The path of the source that was loaded.
   * @param data - The data of the source that was loaded.
   */
  | { success: true; source: string; data: TData }

  /**
   * The loading failed.
   * @param error - The error that occurred during the loading.
   * @param reason - The reason why the loading failed.
   */
  | { success: false; error: Error; reason: string };

/**
 * The audio playback engine interface.
 */
export interface AudioPlayerEngine<TSource = unknown> {
  /**
   * Loads the audio source into the audio player engine.
   * First of all, the audio source MUST be loaded before playing it.
   * @param source - The path of the source to load.
   */
  load(source: string): Promise<AudioPlayerSourceLoadResult<TSource>>;

  /**
   * Plays the audio source.
   */
  play(): Promise<void>;

  /**
   * Restarts the audio source from the beginning of the source.
   */
  restart(): Promise<void>;

  /**
   * Pauses the audio source.
   * However, the audio source will be paused at the current position.
   */
  pause(): Promise<void>;

  /**
   * Stops the audio source completely.
   */
  stop(): Promise<void>;

  /**
   * Disposes the audio player engine.
   * This function should be called when the audio player engine is no longer needed.
   * It cleans up all the resources used by the audio player engine in order to prevent memory leaks.
   */
  dispose(): void;
}
