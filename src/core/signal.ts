class SignalContext {
  currentWatchedSignals?: Set<Signal<unknown>>;
  watchedSignalsStack: Set<Signal<unknown>>[] = [];
  startRecord() {
    const watchedKeys: Set<Signal<unknown>> = new Set();
    this.currentWatchedSignals = watchedKeys;
    this.watchedSignalsStack.push(watchedKeys);
  }
  endRecord() {
    const watchedKeys = this.currentWatchedSignals;
    this.watchedSignalsStack.pop();
    this.currentWatchedSignals = this.watchedSignalsStack.at(-1)!;
    return watchedKeys!;
  }

  addRecord(signal: Signal<unknown>) {
    if (this.currentWatchedSignals) {
      this.currentWatchedSignals.add(signal);
    }
  }
}
const signalContext = new SignalContext();

type computedFunc<T> = () => T;
type changeFunc<T> = (value: T) => T;
type Signal<T> = ((value1?: T | changeFunc<T>) => T) & {
  subscribers: Set<computedFunc<unknown>>;
};

function useSignal<T>(value: T | computedFunc<T>): Signal<T> {
  let $value: T;
  if (typeof value === "function") {
    const f = value as computedFunc<T>;
    signalContext.startRecord();
    $value = f();
    const signals = signalContext.endRecord();
    console.log(signals);
    signals.forEach((signal) => {
      signal.subscribers.add(value as computedFunc<unknown>);
    });
    const func = (() => {
      signalContext.addRecord(func as Signal<unknown>);
      return $value;
    }) as Signal<T>;
    func.subscribers = new Set();
    return func;
  }
  $value = value;
  const func = ((value1?: T | changeFunc<T>) => {
    if (value1 == undefined) {
      signalContext.addRecord(func as Signal<unknown>);
      return $value;
    }
    if (typeof value1 === "function") {
      const f = value1 as changeFunc<T>;
      const newValue = f($value);
      if (newValue === $value && !($value instanceof Object)) return $value;
      $value = newValue;
      func.subscribers.forEach((watchFun) => {
        watchFun();
      });
      return newValue;
    }
    if (value1 === $value && !($value instanceof Object)) return $value;
    $value = value1;

    func.subscribers.forEach((signal) => {
      signal();
    });
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
  type changeFunc,
  type computedFunc,
};
