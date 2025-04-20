import { signalContext } from "./SignalsContext";
import { toSignal } from "./toSignal";
import { Signal } from "./useSignal";

function toSafeSignal<T>(check: () => T | Signal<T>) {
  const signalBefore = signalContext.lastCalledSignal;
  const value = toSignal(check());

  if (signalBefore == value) return undefined;
  return value;
}
export { toSafeSignal };
