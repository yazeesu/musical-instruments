import { Midi, Track } from "@tonejs/midi";
import * as Tone from "tone";
import { InstrumentAudioEngine } from "../core";
import { MIDIPlaybackError, MIDISourceError } from "./errors";
import { AudioPlayerEngine, AudioPlayerSourceLoadResult } from "./core";

export class MIDIPlaybackEngine implements AudioPlayerEngine<Midi> {
  private _instrumentMap: Map<string, InstrumentAudioEngine> = new Map();

  private _midiFile: Midi | null = null;
  private _transport = Tone.getTransport();

  private _defaultBpm = 120;
  private _bpmScale = 1;

  private generateInstrumentKey(family: string, name: string) {
    return `${family}__${name}`;
  }

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

  withBpmScale(scale: number) {
    this._bpmScale = Math.max(0.1, scale);
    return this;
  }

  private resolveInstrument(track: Track): InstrumentAudioEngine | null {
    const family = track.instrument.family;
    const name = track.instrument.name;
    const instrumentKey = this.generateInstrumentKey(family, name);
    return this._instrumentMap.get(instrumentKey) ?? null;
  }

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

        Tone.Transport.schedule(() => {
          void instrument.playNote({ note: n, velocity: vel });
        }, start);

        Tone.Transport.schedule(() => {
          void instrument.muteNote({ note: n });
        }, end);
      });
    });

    this._transport.start();
  }

  async pause() {}

  async stop() {}

  async restart() {}

  async dispose() {
    this._transport.stop();
    this._transport.cancel();

    this._instrumentMap.forEach((instrument) => instrument.dispose());
    this._instrumentMap.clear();

    this._midiFile = null;
  }
}
