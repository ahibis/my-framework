type watchFunc<T> = () => T;
type computedFunc<T> = (prevValue: T) => T;

class SignalContext {
  currentWatchFunc?: watchFunc<unknown>;
  watchFuncStack: watchFunc<unknown>[] = [];
  startRecord(watchFunc: watchFunc<unknown>) {
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
    }
  }
  watchersToExecute: Set<watchFunc<unknown>> = new Set();
  executeWatchers(watchers: Set<watchFunc<unknown>>) {
    const watchersToExecute = this.watchersToExecute;
    watchers.forEach((watcher) => watchersToExecute.add(watcher));
  }
  executeLoop() {
    requestAnimationFrame(() => {
      if (this.watchersToExecute.size == 0) {
        this.executeLoop();
        return;
      }
      this.watchersToExecute.forEach((watcher) => watcher());
      this.watchersToExecute.clear();
      this.executeLoop();
    });
  }
  constructor() {
    this.executeLoop();
  }
}
const signalContext = new SignalContext();

function throttle<T extends () => void>(func: T, delay: number): () => void {
  let lastCallTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function () {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;
    const remainingDelay = delay - timeSinceLastCall;

    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    if (timeSinceLastCall >= delay) {
      func();
      lastCallTime = now;
    } else {
      timeoutId = setTimeout(() => {
        func();
        lastCallTime = Date.now();
        timeoutId = null;
      }, remainingDelay);
    }
  };
}

type Signal<T> = ((value1?: T | computedFunc<T>) => T) & {
  subscribers: Set<watchFunc<unknown>>;
};

function useSignal<T>(value: T | computedFunc<T>): Signal<T> {
  if (typeof value === "function") {
    let $value: T;
    const func = (() => {
      signalContext.addRecord(func as Signal<unknown>);
      return $value;
    }) as Signal<T>;
    func.subscribers = new Set();

    const f = value as computedFunc<T>;
    signalContext.startRecord(() => {
      $value = f($value);
      signalContext.executeWatchers(func.subscribers);
    });
    $value = f($value!);
    signalContext.endRecord();

    return func;
  }
  let $value: T;
  $value = value;
  const func = ((value1?: T | computedFunc<T>) => {
    if (value1 == undefined) {
      signalContext.addRecord(func as Signal<unknown>);
      return $value;
    }
    if (typeof value1 === "function") {
      const f = value1 as computedFunc<T>;
      const newValue = f($value);
      if (newValue === $value && !($value instanceof Object)) return $value;
      $value = newValue;
      signalContext.executeWatchers(func.subscribers);
      return newValue;
    }
    if (value1 === $value && !($value instanceof Object)) return $value;
    $value = value1;

    signalContext.executeWatchers(func.subscribers);
    return $value;
  }) as Signal<T>;
  func.subscribers = new Set();
  return func;
}

let lastManipulation:
  | [Record<string | symbol, unknown>, string | symbol]
  | undefined;
function useReactive<T extends object>(value: T) {
  if (value instanceof Array) {
    const signal = useSignal(value);
    return new Proxy(value, {
      set: (target, key, value) => {
        target[key as keyof T] = value;
        signal(target);
        return true;
      },
      get: (target, key) => {
        signal();
        return target[key as keyof T];
      },
    });
  }
  const paramsToSignal: Map<string | symbol, Signal<unknown>> = new Map();
  const proxy = new Proxy(value, {
    set: (target, key, value) => {
      target[key as keyof T] = value;
      let signal = paramsToSignal.get(key);
      if (signal == undefined) {
        signal = useSignal(value);
        paramsToSignal.set(key, signal);
      }
      signal(value);
      return true;
    },
    get(target, key) {
      let signal = paramsToSignal.get(key);
      const value = target[key as keyof T];
      if (signal == undefined) {
        signal = useSignal(value as unknown);
        paramsToSignal.set(key, signal);
      }
      lastManipulation = [proxy as Record<string | symbol, unknown>, key];
      signal();
      return value;
    },
  });
  return proxy;
}
function useReactiveSignal<T extends object>(value: T) {
  return useSignal(useReactive(value));
}
function getLastManipulation() {
  return lastManipulation;
}

export {
  useSignal,
  useReactive,
  useReactiveSignal,
  getLastManipulation,
  signalContext,
  type Signal,
  type computedFunc,
  type watchFunc,
};
