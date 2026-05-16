import { SynthBassInstrument } from "@/src/audio/instruments/synth-bass-guitar";
import { SynthRetroPianoInstrument } from "@/src/audio/instruments/synth-retro-piano";
import { AudioPlayerEngine } from "@/src/audio/playback/core";
import { MIDIPlaybackEngine } from "@/src/audio/playback/engine";
import { Midi } from "@tonejs/midi";
import { useMachine } from "@xstate/react";
import { useCallback, useEffect, useRef } from "react";
import { audioPlayerMachine } from "../context/audio-player-machine";

export function useMIDIPlayer(source: string) {
  const engineRef = useRef<AudioPlayerEngine<Midi> | null>(null);

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
