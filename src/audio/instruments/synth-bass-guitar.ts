import * as Tone from "tone";
import { InstrumentAudioEngine } from "../core";

export class SynthBassInstrument implements InstrumentAudioEngine {
  private synth: Tone.PolySynth<Tone.MonoSynth>;
  private compressor: Tone.Compressor;
  private distortion: Tone.Distortion;
  private reverb: Tone.Reverb;

  private cleanLowpass: Tone.Filter;
  private dirtyHighpass: Tone.Filter;
  private finalCabinetFilter: Tone.Filter;

  private noise: Tone.Noise;
  private noiseFilter: Tone.Filter;
  private noiseEnvelope: Tone.AmplitudeEnvelope;
  private noiseVolume: Tone.Volume;

  constructor() {
    this.reverb = new Tone.Reverb({
      decay: 0.6,
      wet: 0.01,
    }).toDestination();

    this.compressor = new Tone.Compressor({
      threshold: -28,
      ratio: 8,
      attack: 0.015,
      release: 0.25,
      knee: 4,
    });

    this.cleanLowpass = new Tone.Filter({
      type: "lowpass",
      frequency: 160,
      rolloff: -24,
    });

    this.dirtyHighpass = new Tone.Filter({
      type: "highpass",
      frequency: 140,
      rolloff: -12,
    });

    this.finalCabinetFilter = new Tone.Filter({
      type: "lowpass",
      frequency: 1800,
      rolloff: -24,
      Q: 0.8,
    });

    this.distortion = new Tone.Distortion({
      distortion: 0,
      oversample: "4x",
    });

    this.synth = new Tone.PolySynth(Tone.MonoSynth, {
      volume: -2,
      oscillator: {
        type: "pulse",
        width: 0.38,
      },
      envelope: {
        attack: 0.002,
        decay: 4.5,
        sustain: 0.65,
        release: 0.8,
        attackCurve: "exponential",
      },
      filterEnvelope: {
        attack: 0.002,
        decay: 1.8,
        sustain: 0.1,
        release: 0.8,
        baseFrequency: 60,
        octaves: 3.5,
        exponent: 2,
      },
      filter: {
        type: "lowpass",
        rolloff: -12,
        Q: 0.2,
      },
    });

    this.noise = new Tone.Noise("white");

    this.noiseFilter = new Tone.Filter({
      type: "bandpass",
      frequency: 850,
      Q: 4.0,
    });

    this.noiseEnvelope = new Tone.AmplitudeEnvelope({
      attack: 0.001,
      decay: 0.06,
      sustain: 0.0,
      release: 0.01,
    });

    this.noiseVolume = new Tone.Volume(-28);

    this.noise.chain(this.noiseFilter, this.noiseEnvelope, this.noiseVolume);
    this.noise.start();

    this.synth.connect(this.cleanLowpass);
    this.synth.connect(this.dirtyHighpass);

    this.noiseVolume.connect(this.dirtyHighpass);

    this.cleanLowpass.connect(this.compressor);
    this.dirtyHighpass.chain(this.distortion, this.compressor);

    this.compressor.chain(this.finalCabinetFilter, this.reverb);
  }

  async playNote(options: { note: string; velocity?: number }): Promise<void> {
    const { note, velocity = 0.85 } = options;

    const randomDetune = (Math.random() - 0.5) * 15;
    this.synth.set({ detune: randomDetune });

    const randomFretResonance = 700 + Math.random() * 500;
    this.noiseFilter.frequency.setValueAtTime(randomFretResonance, Tone.now());

    this.noiseEnvelope.triggerAttackRelease("8n", Tone.now(), velocity);
    this.synth.triggerAttack(note, undefined, velocity);
  }

  async muteNote(options: { note: string }): Promise<void> {
    const { note } = options;
    this.synth.triggerRelease(note);
  }

  dispose(): void {
    this.synth.dispose();
    this.compressor.dispose();
    this.distortion.dispose();
    this.cleanLowpass.dispose();
    this.dirtyHighpass.dispose();
    this.finalCabinetFilter.dispose();
    this.reverb.dispose();
    this.noise.dispose();
    this.noiseFilter.dispose();
    this.noiseEnvelope.dispose();
    this.noiseVolume.dispose();
  }
}
