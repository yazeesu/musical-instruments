export type AudioPlayerSourceLoadResult<TData = unknown> =
  | { success: true; source: string; data: TData }
  | { success: false; error: Error; reason: string };

export interface AudioPlayerEngine<TSource = unknown> {
  load(source: string): Promise<AudioPlayerSourceLoadResult<TSource>>;
  play(): Promise<void>;
  restart(): Promise<void>;
  pause(): Promise<void>;
  stop(): Promise<void>;
  dispose(): void;
}
