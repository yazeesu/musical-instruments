import { InstrumentAudioEngine } from "@/src/audio/core";
import {
  convertMIDIToFrequency,
  convertNoteToMIDI,
  KEYBOARD_MAPS,
  Notes,
} from "@/src/audio/theory";
import {
  blackKeyLeftPercent,
  blackKeyWidthPercent,
  PianoBlackKey,
  PianoLayout,
} from "@/src/piano/layout";
import React, {
  createContext,
  CSSProperties,
  RefObject,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";

type SimplePianoProps = {
  audioEngine: RefObject<InstrumentAudioEngine | null>;
  layout: PianoLayout;
  showNoteNames?: boolean;
  showNoteMidi?: boolean;
} & React.ComponentPropsWithoutRef<"div">;

type SimplePianoContextType = {
  audioEngine: RefObject<InstrumentAudioEngine | null>;
  layout: PianoLayout;
  whiteKeys: string[];
  blackKeys: PianoBlackKey[];
  whiteKeyCount: number;
  blackKeyCount: number;
  whiteKeyWidth: number;
  blackKeyWidth: number;
  showNoteNames?: boolean;
  showNoteMidi?: boolean;
};

const SimplePianoContext = createContext<SimplePianoContextType | null>(null);

function useSimplePiano() {
  const context = useContext(SimplePianoContext);
  if (!context) {
    throw new Error("useSimplePiano must be used within a SimplePiano");
  }
  return context;
}

function useSimplePianoKey(
  audioEngine: RefObject<InstrumentAudioEngine | null>,
  note: string,
) {
  const midi = useMemo(() => convertNoteToMIDI(note), [note]);
  const frequency = useMemo(() => convertMIDIToFrequency(midi), [midi]);

  const handlePlayNote = useCallback(() => {
    if (!audioEngine.current) {
      console.warn(
        "Couldn't play the note since no instrument audio engine is provided.",
      );
      return;
    }
    audioEngine.current.playNote({ note });
  }, [audioEngine, note]);

  const handleMuteNote = useCallback(() => {
    if (!audioEngine.current) {
      console.warn(
        "Couldn't mute the note since no instrument audio engine is provided.",
      );
      return;
    }
    audioEngine.current.muteNote({ note });
  }, [audioEngine.current, note]);

  return { midi, frequency, handlePlayNote, handleMuteNote };
}

function SimplePiano({
  audioEngine,
  layout,
  showNoteNames = true,
  showNoteMidi = true,
  children,
  ...props
}: SimplePianoProps) {
  const { whiteKeys, blackKeys } = layout;

  const whiteKeyCount = whiteKeys.length;
  const blackKeyCount = blackKeys.length;

  const whiteKeyWidth = 100 / whiteKeyCount;
  const blackKeyWidth = blackKeyWidthPercent(whiteKeyCount);

  return (
    <SimplePianoContext.Provider
      value={{
        audioEngine,
        layout,
        whiteKeys,
        blackKeys,
        whiteKeyCount,
        blackKeyCount,
        whiteKeyWidth,
        blackKeyWidth,
        showNoteNames,
        showNoteMidi,
      }}
    >
      <div className="relative w-full select-none" {...props}>
        {children}
      </div>
    </SimplePianoContext.Provider>
  );
}

type SimplePianoKeyboardProps = {
  renderWhiteKey: (note: string, style: CSSProperties) => React.ReactNode;
  renderBlackKey: (note: string, style: CSSProperties) => React.ReactNode;
};

SimplePiano.SimplePianoKeyboard = function SimplePianoKeyboard({
  renderWhiteKey,
  renderBlackKey,
}: SimplePianoKeyboardProps) {
  const {
    audioEngine,
    whiteKeys,
    blackKeys,
    whiteKeyCount,
    whiteKeyWidth,
    blackKeyWidth,
  } = useSimplePiano();

  useEffect(() => {
    const pressed = new Set<string>();
    const currentOctave = 4;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.target instanceof HTMLInputElement) return;

      let note = null;
      if (e.key === "ı") {
        note = `${Notes.C}${currentOctave + 1}`;
      } else {
        note = KEYBOARD_MAPS[e.key.toLowerCase()];
      }

      if (!note) return;
      const noteWithOctave = `${note}${currentOctave}`;
      if (pressed.has(noteWithOctave)) return;

      pressed.add(noteWithOctave);
      void audioEngine.current?.playNote({ note: noteWithOctave });
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.target instanceof HTMLInputElement) return;

      const note = KEYBOARD_MAPS[e.key.toLowerCase()];
      if (!note) return;

      const noteWithOctave = `${note}${currentOctave}`;
      if (!pressed.has(noteWithOctave)) return;

      pressed.delete(noteWithOctave);
      void audioEngine.current?.muteNote({ note: noteWithOctave });
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [audioEngine]);

  return (
    <React.Fragment>
      <div className="flex flex-row gap-px rounded-b-lg overflow-hidden shadow-lg">
        {whiteKeys.map((note) => (
          <React.Fragment key={note}>
            {renderWhiteKey(note, { width: `${whiteKeyWidth}%` })}
          </React.Fragment>
        ))}
      </div>

      {blackKeys.map(({ note, afterWhiteIndex }) => (
        <React.Fragment key={note}>
          {renderBlackKey(note, {
            left: `${blackKeyLeftPercent(afterWhiteIndex, whiteKeyCount)}%`,
            width: `${blackKeyWidth}%`,
          })}
        </React.Fragment>
      ))}
    </React.Fragment>
  );
};

type StandartPianoKeyProps = {
  note: string;
  style?: CSSProperties;
};

SimplePiano.StandardWhiteKey = function StandardWhiteKey({
  note,
  style,
}: StandartPianoKeyProps) {
  const { audioEngine, showNoteNames, showNoteMidi } = useSimplePiano();
  const { midi, handlePlayNote, handleMuteNote } = useSimplePianoKey(
    audioEngine,
    note,
  );

  return (
    <button
      type="button"
      className="relative z-0 flex-1 h-44 border border-neutral-200 bg-linear-to-b from-white to-[#e8e4f0] flex flex-col items-center justify-end pb-3 rounded-b-sm hover:from-[#f8f6fc] hover:to-[#ddd8ea] active:from-[#ebe6f4] active:to-[#cfc9dc] transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-violet-400 hover:cursor-pointer"
      style={style}
      onMouseDown={handlePlayNote}
      onMouseUp={handleMuteNote}
      onMouseLeave={handleMuteNote}
    >
      {showNoteNames && !!note && (
        <span className="text-xs font-medium text-neutral-500">{note}</span>
      )}
      {showNoteMidi && !!midi && (
        <span className="text-[10px] text-neutral-400 tabular-nums">
          {midi}
        </span>
      )}
    </button>
  );
};

SimplePiano.StandardBlackKey = function StandardBlackKey({
  note,
  style,
}: StandartPianoKeyProps) {
  const { audioEngine, showNoteNames, showNoteMidi } = useSimplePiano();
  const { midi, handlePlayNote, handleMuteNote } = useSimplePianoKey(
    audioEngine,
    note,
  );

  return (
    <button
      type="button"
      className="absolute top-0 z-10 h-[60%] -translate-x-1/2 rounded-b-md border border-neutral-800 bg-linear-to-b from-neutral-700 to-neutral-950 shadow-md flex flex-col items-center justify-end pb-2 hover:from-neutral-600 hover:to-neutral-900 active:from-neutral-800 active:to-black transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 hover:cursor-pointer"
      style={style}
      onMouseDown={handlePlayNote}
      onMouseUp={handleMuteNote}
      onMouseLeave={handleMuteNote}
    >
      {showNoteNames && !!note && (
        <span className="text-[10px] font-medium text-neutral-400">{note}</span>
      )}
      {showNoteMidi && !!midi && (
        <span className="text-[9px] text-neutral-500 tabular-nums">{midi}</span>
      )}
    </button>
  );
};

export default SimplePiano;
