/**
 * [Timer] class is wrapper over [setTimout] and [clearTimeout] methods.
 * Takes as arguments a callback and a time in milliseconds.
 * To trigger the timer you have to call start() method.
 */
class Timer {
  private readonly ms: number;
  private readonly callback: Function;
  private handle: number | null;

  constructor(callback: Function, ms: number) {
    this.callback = callback;
    this.ms = ms;
    this.handle = null;
  }

  start() {
    this.handle = setTimeout(this.callback, this.ms);
  }

  stop() {
    if (!this.handle) return;
    clearTimeout(this.handle);
    this.handle = null;
  }

  reset() {
    this.stop();
    this.start();
  }
}

export default Timer;
