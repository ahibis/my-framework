import { signalContext } from "./SignalsContext";

function hookWatchers(func: () => void) {
  const offset = signalContext.startWatchersHook();
  func();
  return signalContext.endWatchersHook(offset);
}
export { hookWatchers };
