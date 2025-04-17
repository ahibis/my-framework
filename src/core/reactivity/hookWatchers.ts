import { signalContext } from "./useSignal";

function hookWatchers(func: () => void) {
  const offset = signalContext.startWatchersHook();
  func();
  return signalContext.endWatchersHook(offset);
}
export { hookWatchers };
