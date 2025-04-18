import { Signal, signalContext } from "./useSignal";

function toSignal<T>(value: T | Signal<T>): Signal<T> {
  if (value instanceof Function) return value;
  if (value instanceof Object) {
    (value as T & { [Symbol.iterator]: unknown })[Symbol.iterator];
  }

  return signalContext.lastCalledSignal as Signal<T>;
}
export { toSignal };
