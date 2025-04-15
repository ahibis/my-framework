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
  recordContext: Record<number, Set<number>> = {};
  recordKeys: Set<number> = new Set();
  startRecord(key: number) {
    this.recordContext[key] = new Set();
    this.recordKeys.add(key);
  }
  endRecord(key: number) {
    const keys = this.recordContext[key];
    delete this.recordContext[key];
    this.recordKeys.delete(key);
    return keys;
  }
  stopRecord(key: number) {
    this.recordKeys.delete(key);
  }
  restartRecord(key: number) {
    this.recordKeys.add(key);
  }
  addRecord(key: number) {
    for (let record of this.recordKeys) {
      this.recordContext[record].add(key);
    }
  }

  signalCount = 0;

  signalCountIncrement() {
    this.signalCount++;
    return this.signalCount;
  }
}
const signalContext = new SignalContext();

type computedFunc<T> = (recordMode: (isRecord: boolean) => void) => T;
type changeFunc<T> = (value: T) => T;
type signalReturn<T> = (value1?: T | changeFunc<T>) => T;

function useSignal<T>(value: T | computedFunc<T>): signalReturn<T> {
  const key = signalContext.signalCountIncrement();
  let $value: T;
  if (typeof value === "function") {
    const changeRecord = (isRecord: boolean) => {
      if (isRecord) {
        signalContext.restartRecord(key);
      } else {
        signalContext.stopRecord(key);
      }
    };
    const f = value as computedFunc<T>;
    signalContext.startRecord(key);
    $value = f(changeRecord);
    const keys = signalContext.endRecord(key);
    signalContext.subscribe(keys, () => {
      $value = f(changeRecord);
      signalContext.emit(key);
    });
    return () => {
      signalContext.addRecord(key);
      return $value;
    };
  }
  $value = value;
  return (value1?: T | changeFunc<T>) => {
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
}

export { useSignal, type signalReturn, signalContext };
