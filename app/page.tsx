"use client";

import { InstrumentAudioEngine } from "@/src/audio/core";
import { SynthBassInstrument } from "@/src/audio/instruments/synth-bass-guitar";
import SimplePiano from "@/src/instruments/simple-piano/simple-piano";
import { createPianoLayout } from "@/src/piano/layout";
import { useEffect, useRef } from "react";

const PIANO_LAYOUT = createPianoLayout(1, 3);

export default function Home() {
  const instrumentAudioEngineRef = useRef<InstrumentAudioEngine | null>(null);

  useEffect(() => {
    instrumentAudioEngineRef.current = new SynthBassInstrument();

    return () => {
      instrumentAudioEngineRef.current?.dispose();
    };
  }, []);

  return (
    <div className="relative w-screen min-h-screen">
      <div className="absolute bottom-8 w-full px-16">
        <SimplePiano
          audioEngine={instrumentAudioEngineRef}
          layout={PIANO_LAYOUT}
        >
          <SimplePiano.SimplePianoKeyboard
            renderWhiteKey={(note, style) => (
              <SimplePiano.StandardWhiteKey note={note} style={style} />
            )}
            renderBlackKey={(note, style) => (
              <SimplePiano.StandardBlackKey note={note} style={style} />
            )}
          />
        </SimplePiano>
      </div>
    </div>
  );
}
