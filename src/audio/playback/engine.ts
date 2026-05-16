import { Midi, Track } from "@tonejs/midi";
import * as Tone from "tone";
import { InstrumentAudioEngine } from "../core";
import { MIDIPlaybackError, MIDISourceError } from "./errors";
import { AudioPlayerEngine, AudioPlayerSourceLoadResult } from "./core";

/**
 * Imports `.mid` files and plays them using the ToneJS library.
 * @implements {AudioPlayerEngine<Midi>}
 * @see {@link AudioPlayerEngine} for the interface implementation.
 */
export class MIDIPlaybackEngine implements AudioPlayerEngine<Midi> {
  /**
   * A map of instrument keys to instrument audio engines.
   * @see {@link InstrumentAudioEngine} for the interface implementation.
   */
  private _instrumentMap: Map<string, InstrumentAudioEngine> = new Map();

  /**
   * The loaded MIDI file source.
   */
  private _midiFile: Midi | null = null;

  /**
   * The ToneJS transport instance.
   */
  private _transport = Tone.getTransport();

  /**
   * The default BPM. If the MIDI file does not specify any BPM, it will be playing at 120 BPM.
   */
  private _defaultBpm = 120;

  /**
   * Multiplier for the BPM.
   * 1 means the BPM will be the same as the MIDI file.
   * Higher values will make the playback faster.
   * Lower values will make the playback slower.
   */
  private _bpmScale = 1;

  /**
   * Generates a key for the instrument.
   * @param family - The family of the instrument.
   * @param name - The name of the instrument.
   * @returns The key for the instrument in string type.
   */
  private generateInstrumentKey(family: string, name: string) {
    return `${family}__${name}`;
  }

  /**
   * Registers an instrument into the audio player engine.
   *
   * @param family - The family of the instrument.
   * @param name - The name of the instrument.
   * @param instrument - The instrument audio engine to use for the instrument.
   * @returns The audio player engine itself.
   */
  withInstrument(
    family: string,
    name: string,
    instrument: InstrumentAudioEngine,
  ) {
    this._instrumentMap.set(
      this.generateInstrumentKey(family, name),
      instrument,
    );
    return this;
  }

  /**
   * Registers a BPM scale into the audio player engine.
   *
   * @param scale - The target BPM scale. ( min: 0.1, default: 1 )
   * @returns The audio player engine itself.
   */
  withBpmScale(scale: number) {
    this._bpmScale = Math.max(0.1, scale);
    return this;
  }

  /**
   * Extracts the instrument instance from the registered instrument map.
   * @param track - The track to extract the instrument from.
   * @returns The instrument audio engine instance. Returns `null` if the instrument is not registered.
   */
  private resolveInstrument(track: Track): InstrumentAudioEngine | null {
    const family = track.instrument.family;
    const name = track.instrument.name;
    const instrumentKey = this.generateInstrumentKey(family, name);
    return this._instrumentMap.get(instrumentKey) ?? null;
  }

  /**
   * Loads the MIDI file into the audio player engine.
   * @see {@link AudioPlayerEngine.load()} for the interface implementation.
   */
  async load(source: string): Promise<AudioPlayerSourceLoadResult<Midi>> {
    try {
      const response = await fetch(source);

      if (!response.ok) {
        throw new MIDISourceError("Failed to fetch MIDI file", "HTTP error");
      }

      const arrayBuffer = await response.arrayBuffer();
      const midi = new Midi(arrayBuffer);

      this._midiFile = midi;

      const instrumentSet = new Set<string>();

      for (const track of midi.tracks) {
        instrumentSet.add(
          this.generateInstrumentKey(
            track.instrument.family,
            track.instrument.name,
          ),
        );
      }
      console.debug("Instrument set : ", instrumentSet);

      return {
        success: true,
        data: midi,
        source,
      };
    } catch (error) {
      const e =
        error instanceof Error
          ? error
          : new MIDISourceError("Failed to fetch MIDI file", "Unknown error");
      return {
        success: false,
        error: e,
        reason: e.message,
      };
    }
  }

  /**
   * Plays the source.
   * @see {@link AudioPlayerEngine.play()} for the interface implementation.
   */
  async play() {
    if (this._midiFile === null) {
      throw new MIDIPlaybackError(
        "MIDI file is not loaded",
        "No MIDI file loaded",
      );
    }
    console.debug("play -> playing");
    await Tone.start();

    this._transport.stop();
    this._transport.cancel();

    this._transport.position = 0;
    this._transport.bpm.value =
      (this._midiFile.header.tempos[0]?.bpm ?? this._defaultBpm) *
      this._bpmScale;

    this._midiFile.tracks.forEach((track) => {
      const instrument = this.resolveInstrument(track);

      if (!instrument) {
        console.warn(
          `No instrument found for track | Name : ${track.instrument.name} | Family: ${track.instrument.family}`,
        );
        return;
      }

      track.notes.forEach((note) => {
        const n = Tone.Frequency(note.midi, "midi").toNote();
        const vel = Math.max(0.05, Math.min(1, note.velocity));
        const start = note.time;
        const end = start + note.duration;

        this._transport.schedule(() => {
          void instrument.playNote({ note: n, velocity: vel });
        }, start);

        this._transport.schedule(() => {
          void instrument.muteNote({ note: n });
        }, end);
      });
    });

    this._transport.start();
  }

  /**
   * TODO: Implement `pause()` method.
   * @see {@link AudioPlayerEngine.pause()} for the interface implementation.
   */
  async pause() {}

  /**
   * TODO: Implement `stop()` method.
   * @see {@link AudioPlayerEngine.stop()} for the interface implementation.
   */
  async stop() {}

  /**
   * TODO: Implement `restart()` method.
   * @see {@link AudioPlayerEngine.restart()} for the interface implementation.
   */
  async restart() {}

  /**
   * Disposes the audio player engine.
   * @see {@link AudioPlayerEngine.dispose()} for the interface implementation.
   */
  async dispose() {
    this._transport.stop();
    this._transport.cancel();

    this._instrumentMap.forEach((instrument) => instrument.dispose());
    this._instrumentMap.clear();

    this._midiFile = null;
  }
}
