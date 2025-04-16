class SignalContext {
  subscribers: Record<number, (() => void)[]> = {};

  subscribe(keys: Set<number>, callback: () => void) {
    keys.forEach((key) => {
      if (this.subscribers[key] == undefined) this.subscribers[key] = [];
      this.subscribers[key].push(callback);
    });
  }
  emit(key: number) {
    if (key in this.subscribers) {
      this.subscribers[key].forEach((callback) => callback());
    }
  }
  currentWatchedKeys?: Set<number>;
  watchedKeysStack: Set<number>[] = [];
  startRecord() {
    const watchedKeys: Set<number> = new Set();
    this.currentWatchedKeys = watchedKeys;
    this.watchedKeysStack.push(watchedKeys);
  }
  endRecord() {
    const watchedKeys = this.currentWatchedKeys;
    this.watchedKeysStack.pop();
    this.currentWatchedKeys = this.watchedKeysStack.at(-1)!;
    return watchedKeys!;
  }

  addRecord(key: number) {
    if (this.currentWatchedKeys) {
      this.currentWatchedKeys.add(key);
    }
  }

  signalCount = 0;

  signalCountIncrement() {
    this.signalCount++;
    return this.signalCount;
  }
}
const signalContext = new SignalContext();

type computedFunc<T> = () => T;
type changeFunc<T> = (value: T) => T;
type Signal<T> = ((value1?: T | changeFunc<T>) => T) & {
  key: number;
};

function useSignal<T>(value: T | computedFunc<T>): Signal<T> {
  const key = signalContext.signalCountIncrement();
  let $value: T;
  if (typeof value === "function") {
    const f = value as computedFunc<T>;
    signalContext.startRecord();
    $value = f();
    const keys = signalContext.endRecord();
    signalContext.subscribe(keys, () => {
      $value = f();
      signalContext.emit(key);
    });
    const func = () => {
      signalContext.addRecord(key);
      return $value;
    };
    func.key = key;
    return func;
  }
  $value = value;
  const func = (value1?: T | changeFunc<T>) => {
    if (value1 == undefined) {
      signalContext.addRecord(key);
      return $value;
    }
    if (typeof value1 === "function") {
      const f = value1 as changeFunc<T>;
      const newValue = f($value);
      if (newValue === $value && !($value instanceof Object)) return $value;
      $value = newValue;
      signalContext.emit(key);
      return newValue;
    }
    if (value1 === $value && !($value instanceof Object)) return $value;
    $value = value1;

    signalContext.emit(key);
    return $value;
  };
  func.key = key;
  return func;
}

let lastManipulation:
  | [Record<string | symbol, unknown>, string | symbol]
  | undefined;
function useReactive<T extends object>(value: T) {
  if (value instanceof Array) {
    const signalKey = signalContext.signalCountIncrement();
    return new Proxy(value, {
      set: (target, key, value) => {
        target[key as keyof T] = value;
        signalContext.emit(signalKey);
        return true;
      },
      get: (target, key) => {
        signalContext.addRecord(signalKey);
        return target[key as keyof T];
      },
    });
  }
  const paramsToSignalKey: Map<string | symbol, number> = new Map();
  const proxy = new Proxy(value, {
    set: (target, key, value) => {
      target[key as keyof T] = value;
      let signalKey = paramsToSignalKey.get(key);
      if (signalKey == undefined) {
        signalKey = signalContext.signalCountIncrement();
        paramsToSignalKey.set(key, signalKey);
      }
      signalContext.emit(signalKey);
      return true;
    },
    get(target, key) {
      let signalKey = paramsToSignalKey.get(key);
      if (signalKey == undefined) {
        signalKey = signalContext.signalCountIncrement();
        paramsToSignalKey.set(key, signalKey);
      }
      lastManipulation = [proxy as Record<string | symbol, unknown>, key];
      signalContext.addRecord(signalKey);
      return target[key as keyof T];
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
