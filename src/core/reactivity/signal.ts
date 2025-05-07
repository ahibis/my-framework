import { onAnimationFrame } from "../helpers";
import { debounce } from "../helpers/debounce";
import { throttle } from "../helpers/throttle";
import { signalContext } from "./SignalsContext";

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
  deps?: Signal<any>[];
  onAnimationFrame?: boolean;
};

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
  if (options?.onAnimationFrame) {
    resFunc = (value: T | computedFunc<T>) =>
      onAnimationFrame(() => func(value));
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
    signalContext.registerWatcher(wrappedFunc);
    if (options?.deps) {
      signalContext.startRecord(undefined);
      $value = f($value!);
      signalContext.endRecord();
      options.deps.forEach((signal) => {
        signal.subscribers.add(wrappedFunc);
      });

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

function removeSignal<T>(signal: Signal<T>) {
  signal.subscribers.forEach((watchFunc) =>
    watchFunc.deps.delete(signal as Signal<unknown>)
  );
  signal.subscribers.clear();
}

function removeWatcher(watchFunc: watchFunc) {
  watchFunc.deps.forEach((signal) => signal.subscribers.delete(watchFunc));
  watchFunc.deps.clear();
}

export {
  useSignal,
  removeSignal,
  removeWatcher,
  type Signal,
  type SignalOptions,
  type computedFunc,
  type watchFunc,
};
