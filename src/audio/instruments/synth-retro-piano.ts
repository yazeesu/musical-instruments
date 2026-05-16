import * as Tone from "tone";
import { InstrumentAudioEngine } from "../core";
import { convertNoteToFrequency } from "../theory";

export class SynthRetroPianoInstrument implements InstrumentAudioEngine {
  private synth: Tone.PolySynth;
  private reverb: Tone.Reverb;
  private lowpass: Tone.Filter;
  private highpass: Tone.Filter;

  constructor() {
    this.reverb = new Tone.Reverb({
      decay: 3,
      wet: 0.25,
    }).toDestination();

    this.highpass = new Tone.Filter({
      type: "highpass",
      frequency: 120,
      rolloff: -24,
      Q: 0.5,
    });

    this.lowpass = new Tone.Filter({
      type: "lowpass",
      frequency: 6000,
      rolloff: -24,
      Q: 0.5,
    });

    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: "triangle32",
      },

      envelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.5,
        release: 1.2,
      },
    });

    this.synth.chain(this.highpass, this.lowpass, this.reverb);
  }

  async playNote(options: {
    note: string;
    velocity?: number;
    duration?: number;
    time?: number;
  }): Promise<void> {
    const { note, velocity = 0.8, duration = 0.1, time = Tone.now() } = options;
    const frequency = convertNoteToFrequency(note);
    this.synth.triggerAttack(note, duration, velocity);
  }

  async muteNote(options: { note: string }): Promise<void> {
    const { note } = options;
    const frequency = convertNoteToFrequency(note);

    console.log("Muting note: ", note, " | ", frequency, "Hz");

    this.synth.triggerRelease(note);
  }

  dispose(): void {
    console.log("Disposing simple piano instrument...");
    this.synth.dispose();
    this.highpass.dispose();
    this.lowpass.dispose();
    this.reverb.dispose();
  }
}
