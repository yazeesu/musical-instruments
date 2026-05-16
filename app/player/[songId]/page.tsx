"use client";

import * as Tone from "tone";
import { Midi, Track } from "@tonejs/midi";
import { InstrumentAudioEngine } from "@/src/audio/core";
import { SynthBassInstrument } from "@/src/audio/instruments/synth-bass-guitar";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { fromPromise, setup } from "xstate";
import { useMachine } from "@xstate/react";
import { SynthRetroPianoInstrument } from "@/src/audio/instruments/synth-retro-piano";

type MIDIFetchResult =
  | { success: true; midi: Midi; source: string }
  | { success: false; error: Error; reason: string };

class MIDISourceError extends Error {
  constructor(
    message: string,
    public readonly reason: string,
  ) {
    super(message);
    console.error(this.name, this.message);
  }
}

class MIDIPlaybackError extends Error {
  constructor(
    message: string,
    public readonly reason: string,
  ) {
    super(message);
    console.error(this.name, this.message);
  }
}

class MIDIPlaybackEngine {
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

  async load(source: string): Promise<MIDIFetchResult> {
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
        midi,
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
  async stop() {
    this._transport.stop();
    this._transport.cancel();
  }

  async dispose() {
    this._transport.stop();
    this._transport.cancel();

    this._instrumentMap.forEach((instrument) => instrument.dispose());
    this._instrumentMap.clear();

    this._midiFile = null;
  }
}

type MIDIPlayerContext = {
  engineRef: React.RefObject<MIDIPlaybackEngine | null>;
  source: string;
};

type MIDIPlayerInput = {
  engineRef: React.RefObject<MIDIPlaybackEngine | null>;
  source: string;
};

const midiPlayerMachine = setup({
  types: {
    context: {} as MIDIPlayerContext,
    input: {} as MIDIPlayerInput,
    events: {} as
      | { type: "LOAD" }
      | { type: "PLAY" }
      | { type: "PAUSE" }
      | { type: "STOP" },
  },
  actors: {
    loadMidi: fromPromise(
      async ({
        input,
      }: {
        input: {
          engineRef: React.RefObject<MIDIPlaybackEngine | null>;
          source: string;
        };
      }) => {
        const result = await input.engineRef.current?.load(input.source);
        if (!result?.success) {
          throw result?.error;
        }
        return result.success ? result : null;
      },
    ),
  },
  actions: {
    playEngine: ({ context }) => {
      void context.engineRef.current?.play();
    },
    pauseEngine: ({ context }) => {
      void context.engineRef.current?.pause();
    },
    stopEngine: ({ context }) => {
      void context.engineRef.current?.stop();
    },
  },
}).createMachine({
  id: "midi-playback-engine",
  initial: "loading",
  context: ({ input }) => ({
    engineRef: input.engineRef,
    source: input.source,
  }),

  states: {
    idle: {
      on: {
        LOAD: "loading",
      },
    },

    loading: {
      invoke: {
        src: "loadMidi",
        input: ({ context }) => ({
          engineRef: context.engineRef,
          source: context.source,
        }),
        onDone: {
          target: "ready",
        },
        onError: {
          target: "error",
        },
      },
    },

    ready: {
      on: {
        PLAY: "playing",
      },
    },

    playing: {
      entry: "playEngine",
      on: {
        PAUSE: "paused",
        STOP: {
          target: "ready",
          actions: "stopEngine",
        },
      },
    },

    paused: {
      entry: "pauseEngine",
      on: {
        PLAY: "playing",
        STOP: {
          target: "ready",
          actions: "stopEngine",
        },
      },
    },

    error: {},
  },
});

export function useMIDIPlayer(source: string) {
  const engineRef = useRef<MIDIPlaybackEngine | null>(null);

  useEffect(() => {
    engineRef.current = new MIDIPlaybackEngine()
      .withInstrument("bass", "electric bass (pick)", new SynthBassInstrument())
      .withInstrument(
        "synth lead",
        "lead 6 (voice)",
        new SynthRetroPianoInstrument(),
      )
      .withBpmScale(1);

    return () => {
      engineRef.current?.dispose();
    };
  }, []);

  const [state, send] = useMachine(midiPlayerMachine, {
    input: {
      engineRef,
      source,
    },
  });

  const handlePlay = useCallback(() => {
    send({ type: "PLAY" });
  }, [send]);

  const handleStop = useCallback(() => {
    send({ type: "STOP" });
  }, [send]);

  const handlePause = useCallback(() => {
    send({ type: "PAUSE" });
  }, [send]);

  return {
    state,
    handlePlay,
    handleStop,
    handlePause,
  };
}

export default function SongPlayerPage() {
  const { songId } = useParams<{ songId: string }>();
  const songSource = useMemo(() => `/songs/${songId}.mid`, [songId]);

  const { state, handlePlay, handleStop } = useMIDIPlayer(songSource);

  return (
    <div className="flex flex-col gap-4 p-16">
      <h1>{songSource}</h1>
      <div className="flex items-center gap-4">
        <button onClick={handlePlay}>Play</button>
        <button onClick={handleStop}>Stop</button>
        <p>Status : {state.value}</p>
      </div>
    </div>
  );
}
