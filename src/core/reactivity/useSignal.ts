import { onAnimationFrame } from "../component";
import { debounce } from "../helpers/debounce";
import { throttle } from "../helpers/throttle";

type watchFunc = (() => void) & {
  deps: Set<Signal<unknown>>;
};
type computedFunc<T> = (prevValue: T) => T;
type Signal<T> = ((value1?: T | computedFunc<T>) => T) & {
  subscribers: Set<watchFunc>;
};
type SignalOptions<T> = {
  debounce?: number;
  throttle?: number;
  deps?: Signal<T>[];
  onAnimationFrame?: boolean;
};

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

  addRecord(signal: Signal<unknown>) {
    if (this.currentWatchFunc) {
      signal.subscribers.add(this.currentWatchFunc);
      this.currentWatchFunc.deps.add(signal);
    }
  }
  watcherHooksRun = 0;
  hookWatchers: watchFunc[] = [];
  addWatcherHook(watchFunc: watchFunc) {
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

function wrapToConstrains<T>(
  func: (value1: T | computedFunc<T>) => void,
  options?: SignalOptions<T>
) {
  let resFunc = func;
  if (options?.debounce) {
    resFunc = debounce(resFunc, options.debounce);
  }
  if (options?.throttle) {
    resFunc = throttle(resFunc, options.throttle);
  }
  return resFunc;
}
function executeWatchers(watchers: Set<watchFunc>) {
  watchers.forEach((watchFunc) => watchFunc());
}
function executeWatchersOnAnimationFrame(watchers: Set<watchFunc>) {
  watchers.forEach((watchFunc) => onAnimationFrame(watchFunc));
}

function useSignal<T>(
  value: T | computedFunc<T>,
  options?: SignalOptions<T>
): Signal<T> {
  let execSubscribes = options?.onAnimationFrame
    ? executeWatchersOnAnimationFrame
    : executeWatchers;

  if (typeof value === "function") {
    let $value: T;
    const func = (() => {
      signalContext.addRecord(func as Signal<unknown>);
      return $value;
    }) as Signal<T>;
    func.subscribers = new Set();

    const f = value as computedFunc<T>;
    const wrappedFunc = wrapToConstrains(() => {
      $value = f($value);
      execSubscribes(func.subscribers);
    }, options) as watchFunc;
    wrappedFunc.deps = new Set();
    signalContext.addWatcherHook(wrappedFunc);
    if (options?.deps) {
      options.deps.forEach((signal) => {
        signal.subscribers.add(wrappedFunc);
      });
      $value = f($value!);
      return func;
    }
    signalContext.startRecord(wrappedFunc);
    $value = f($value!);
    signalContext.endRecord();

    return func;
  }
  let $value: T;
  $value = value;

  const wrappedFunc = wrapToConstrains((value1: T | computedFunc<T>) => {
    if (typeof value1 === "function") {
      const f = value1 as computedFunc<T>;
      const newValue = f($value);
      if (newValue === $value && !($value instanceof Object)) return $value;
      $value = newValue;
      execSubscribes(func.subscribers);
      return;
    }
    if (value1 === $value && !($value instanceof Object)) return $value;
    $value = value1;

    execSubscribes(func.subscribers);
  }, options);

  const func = ((value1?: T | computedFunc<T>) => {
    if (value1 == undefined) {
      signalContext.addRecord(func as Signal<unknown>);
      return $value;
    }
    wrappedFunc(value1);
    return $value;
  }) as Signal<T>;
  func.subscribers = new Set();
  return func;
}
export {
  useSignal,
  signalContext,
  type Signal,
  type SignalOptions,
  type computedFunc,
  type watchFunc,
};
