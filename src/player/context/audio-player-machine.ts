import { AudioPlayerEngine } from "@/src/audio/playback/core";
import { Midi } from "@tonejs/midi";
import { fromPromise, setup } from "xstate";

/**
 * The events that can be sent to the audio player state machine.
 */
export type AudioPlayerMachineEvent =
  | { type: "LOAD" }
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "STOP" };

/**
 * The context of the audio player state machine.
 */
export type AudioPlayerMachineContext<TSource = unknown> = {
  engineRef: React.RefObject<AudioPlayerEngine<TSource> | null>;
  source: string;
};

/**
 * The input type of the audio player state machine.
 */
export type AudioPlayerMachineInput<TSource = unknown> = {
  engineRef: React.RefObject<AudioPlayerEngine<TSource> | null>;
  source: string;
};

/**
 * The state machine for the audio player in order to manage the state of the audio player.
 * Valid states are:
 * - `idle` - The initial state. This is the state when the source is not loaded yet.
 * - `loading` - The state when the source is loading.
 * - `ready` - The state when the source is loaded and ready to play.
 * - `playing` - The state when the source is playing.
 * - `paused` - The state when the source is paused.
 * - `error` - The state when an error occurs.
 */
export const audioPlayerMachine = setup({
  types: {
    context: {} as AudioPlayerMachineContext<Midi>,
    input: {} as AudioPlayerMachineInput<Midi>,
    events: {} as AudioPlayerMachineEvent,
  },
  actors: {
    loadSource: fromPromise(
      async ({
        input,
      }: {
        input: {
          engineRef: React.RefObject<AudioPlayerEngine<Midi> | null>;
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
    playSource: ({ context }) => {
      void context.engineRef.current?.play();
    },
    pauseSource: ({ context }) => {
      void context.engineRef.current?.pause();
    },
    stopSource: ({ context }) => {
      void context.engineRef.current?.stop();
    },
  },
}).createMachine({
  id: "audio-playback-engine",
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
        src: "loadSource",
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
      entry: "playSource",
      on: {
        PAUSE: "paused",
        STOP: {
          target: "ready",
          actions: "stopSource",
        },
      },
    },

    paused: {
      entry: "pauseSource",
      on: {
        PLAY: "playing",
        STOP: {
          target: "ready",
          actions: "stopSource",
        },
      },
    },

    error: {},
  },
});
