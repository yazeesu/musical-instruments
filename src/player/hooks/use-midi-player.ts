import { SynthBassInstrument } from "@/src/audio/instruments/synth-bass-guitar";
import { SynthRetroPianoInstrument } from "@/src/audio/instruments/synth-retro-piano";
import { AudioPlayerEngine } from "@/src/audio/playback/core";
import { MIDIPlaybackEngine } from "@/src/audio/playback/engine";
import { Midi } from "@tonejs/midi";
import { useMachine } from "@xstate/react";
import { useCallback, useEffect, useRef } from "react";
import { audioPlayerMachine } from "../context/audio-player-machine";

/**
 * A hook that manages the state of the MIDI player. This function should be used in React components.
 *
 * @param source - The source of the MIDI file to play.
 * @returns The state of the MIDI player and the functions to play, stop, and pause the MIDI file.
 */
export function useMIDIPlayer(source: string) {
  const engineRef = useRef<AudioPlayerEngine<Midi> | null>(null);

  /**
   * TODO: Implement the better way to initialize the audio player engine.
   */
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

  const [state, send] = useMachine(audioPlayerMachine, {
    input: {
      engineRef,
      source,
    },
  });

  /**
   * TODO: Idk if these functions are needed.
   * They just add abstraction layer on top of the state machine.
   */
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
