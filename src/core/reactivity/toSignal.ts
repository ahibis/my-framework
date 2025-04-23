import { signalContext } from "./SignalsContext";
import { Signal, useSignal } from "./signal";

function toSignal<T>(value: T | Signal<T>): Signal<T> {
  if (value instanceof Function) return value;
  type TReactive = T & { __signal__?: Signal<T> };
  if (value instanceof Object) {
    if ((value as TReactive).__signal__)
      return (value as TReactive).__signal__!;
    return useSignal(value as T);
  }

  return signalContext.lastCalledSignal as Signal<T>;
}

export { toSignal };
