import { Signal } from "./useSignal";

function removeSignal<T>(signal: Signal<T>) {
  signal.subscribers.forEach((watchFunc) =>
    watchFunc.deps.delete(signal as Signal<unknown>)
  );
  signal.subscribers.clear();
}
export { removeSignal };
