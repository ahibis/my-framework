import { watchFunc } from "./useSignal";

function removeWatcher(watchFunc: watchFunc) {
  watchFunc.deps.forEach((signal) => signal.subscribers.delete(watchFunc));
  watchFunc.deps.clear();
}
export { removeWatcher };
