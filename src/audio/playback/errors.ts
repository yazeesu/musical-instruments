export class MIDISourceError extends Error {
  constructor(
    message: string,
    public readonly reason: string,
  ) {
    super(message);
    console.error(this.name, this.message);
  }
}

export class MIDIPlaybackError extends Error {
  constructor(
    message: string,
    public readonly reason: string,
  ) {
    super(message);
    console.error(this.name, this.message);
  }
}
