import { toSignal } from "./toSignal";
import { Signal, signalContext } from "./useSignal";

function toSafeSignal<T>(check: () => T | Signal<T>) {
  const signalBefore = signalContext.lastCalledSignal;
  const value = toSignal(check());

  if (signalBefore == value) return undefined;
  return value;
}
export { toSafeSignal };
