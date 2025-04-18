import { Signal, useSignal } from "./useSignal";

let lastManipulation:
  | [Record<string | symbol, unknown>, string | symbol]
  | undefined;

type EmbeddedSignals<T> = Map<string | symbol, Signal<T[keyof T]>>;

function handleObject<T extends object>(value: T, prevValue: ProxyObject<T>) {
  const target = prevValue.__target__;
  if (value === target) {
    return prevValue;
  }
  const signals = prevValue.__signals__;
  const cache = prevValue.__cache__;
  const newCache = new Map<keyof T, T[keyof T]>();
  for (let key in signals) {
    signals.get(key)!(value[key as keyof T]);
  }
  for (let key in cache) {
    const childValue = value[key as keyof T]!;
    if (childValue) {
      newCache.set(
        key as keyof T,
        handleObject(
          childValue,
          cache.get(key as keyof T)! as ProxyObject<NonNullable<T[keyof T]>>
        ) as ProxyObject<NonNullable<T[keyof T]>>
      );
    }
  }
  return useReactive(value, signals, newCache);
}

type ProxyObject<T> = T & {
  __signals__: EmbeddedSignals<T>;
  __cache__: Map<keyof T, T[keyof T]>;
  __target__: T;
};
function useReactive<T extends object>(
  value: T,
  embeddedSignals: EmbeddedSignals<T> = new Map(),
  cachedValue: Map<keyof T, T[keyof T]> = new Map()
) {
  const proxy = new Proxy<T>(value, {
    get(target, p) {
      if (p === "__signals__") return embeddedSignals;
      if (p === "__cache__") return cachedValue;
      if (p === "__target__") return target;
      if (typeof p === "symbol") {
        parentSignal();
        return target[p as keyof T];
      }
      if (p === "length") {
        parentSignal();
      }
      const value = target[p as keyof T];
      if (value instanceof Function) {
        return value;
      }
      if (value instanceof Object) {
        if (cachedValue.has(p as keyof T)) {
          return cachedValue.get(p as keyof T);
        }
        const newValue = useReactive(value, new Map());
        cachedValue.set(p as keyof T, newValue);
        return newValue;
      }

      let signal = embeddedSignals.get(p);
      if (signal == undefined) {
        signal = useSignal(value);
        embeddedSignals.set(p, signal);
      }
      useSignal(() => {
        target[p as keyof T] = signal();
      });
      signal();
      return target[p as keyof T];
    },
    set(target, p, value) {
      const $value: T[keyof T] = value;
      target[p as keyof T] = $value;
      if ($value instanceof Object) {
        if (cachedValue.has(p as keyof T)) {
          cachedValue.set(
            p as keyof T,
            handleObject(
              $value,
              cachedValue.get(p as keyof T) as ProxyObject<
                NonNullable<T[keyof T]>
              >
            )
          );
          return true;
        }
        cachedValue.set(
          p as keyof T,
          useReactive($value, new Map(), new Map())
        );
        return true;
      }
      if (embeddedSignals.has(p)) {
        embeddedSignals.get(p)!(value);
      }

      return true;
    },
    deleteProperty(target, p) {
      parentSignal(target);
      return true;
    },
    has(target, p) {
      parentSignal();
      return true;
    },
    ownKeys(target) {
      console.log("ownKeys");
      parentSignal();
      return Reflect.ownKeys(target) as any;
    },
  });
  const parentSignal = useSignal(proxy);
  return proxy as ProxyObject<T>;
}

function getLastManipulation() {
  return lastManipulation;
}
export { useReactive, getLastManipulation };
