"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useMIDIPlayer } from "@/src/player/hooks/use-midi-player";

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
