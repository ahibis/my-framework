import { Signal, watchFunc } from "./useSignal";

class SignalContext {
  currentWatchFunc?: watchFunc;
  watchFuncStack: watchFunc[] = [];
  startRecord(watchFunc: watchFunc) {
    this.currentWatchFunc = watchFunc;
    this.watchFuncStack.push(watchFunc);
  }
  endRecord() {
    this.watchFuncStack.pop();
    this.currentWatchFunc =
      this.watchFuncStack[this.watchFuncStack.length - 1]!;
  }
  lastCalledSignal: Signal<unknown> | undefined;
  addRecord(signal: Signal<unknown>) {
    this.lastCalledSignal = signal;
    if (this.currentWatchFunc) {
      signal.subscribers.add(this.currentWatchFunc);
      this.currentWatchFunc.deps.add(signal);
    }
  }
  watcherHooksRun = 0;
  hookWatchers: watchFunc[] = [];
  lastRegisteredWatcher: watchFunc | undefined;
  registerWatcher(watchFunc: watchFunc) {
    this.lastRegisteredWatcher = watchFunc;
    this.hookWatchers.push(watchFunc);
  }
  startWatchersHook() {
    this.watcherHooksRun += 1;
    return this.hookWatchers.length;
  }
  endWatchersHook(offset: number) {
    this.watcherHooksRun -= 1;
    const watchers = this.hookWatchers.slice(offset, this.hookWatchers.length);
    if (this.watcherHooksRun == 0) this.hookWatchers = [];
    return watchers;
  }
}
const signalContext = new SignalContext();
function getLastRegisteredWatcher() {
  return signalContext.lastRegisteredWatcher;
}
export { signalContext, getLastRegisteredWatcher };
