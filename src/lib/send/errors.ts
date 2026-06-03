// Thrown by a channel sender when its provider credentials are not configured,
// so the dispatcher can report "channel_not_configured" rather than a hard error.
export class ChannelNotConfiguredError extends Error {
  constructor(public channel: string) {
    super(`${channel} channel is not configured`);
    this.name = "ChannelNotConfiguredError";
  }
}
