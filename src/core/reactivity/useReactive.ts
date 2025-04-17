import { Signal, useSignal } from "./useSignal";

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
function getLastManipulation() {
  return lastManipulation;
}
export { useReactive, getLastManipulation };
