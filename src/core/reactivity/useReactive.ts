import { use } from "../hooks";
import { removeWatcher } from "./removeWatcher";
import { getLastRegisteredWatcher } from "./SignalsContext";
import { Signal, useSignal, watchFunc } from "./useSignal";

let lastManipulation:
  | [Record<string | symbol, unknown>, string | symbol]
  | undefined;

type EmbeddedSignals<T> = Map<
  string | symbol,
  {
    s: Signal<T[keyof T]>;
    w: watchFunc;
  }
>;

function handleObject<T extends object>(value: T, prevValue: ProxyObject<T>) {
  const target = prevValue.__target__;
  if (value === target) {
    return prevValue;
  }
  const signals = prevValue.__signals__;
  const cache = prevValue.__cache__;
  const newCache = new Map<keyof T, T[keyof T]>();
  for (let key in signals) {
    const signalCtx = signals.get(key)!;
    if (!(key in value)) {
      removeWatcher(signalCtx.w);
      signals.delete(key);
      continue;
    }

    const s = signalCtx.s;
    const w = signalCtx.w;
    s.subscribers.delete(w);
    useSignal(
      () => {
        value[key as keyof T] = s();
      },
      { deps: [...w.deps, s] }
    );
    const newWatcher = getLastRegisteredWatcher()!;
    signals.set(key, { s, w: newWatcher });
    s(value[key as keyof T]);
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
    get(target, p, receiver) {
      if (p === "__signals__") return embeddedSignals;
      if (p === "__cache__") return cachedValue;
      if (p === "__target__") return target;
      const value = Reflect.get(target, p, receiver) as T[keyof T];
      // console.log("get", target, p, value);
      if (typeof p === "symbol") {
        parentSignal();
        return value;
      }
      if (p === "length") {
        parentSignal();
      }

      if (value instanceof Function) {
        parentSignal();
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

      let embeddedSignal = embeddedSignals.get(p);
      if (embeddedSignal == undefined) {
        const signal = useSignal(value);
        useSignal(() => {
          target[p as keyof T] = signal();
        });
        const watcher = getLastRegisteredWatcher()!;
        embeddedSignal = { s: signal, w: watcher };
        embeddedSignals.set(p, embeddedSignal);
      }
      embeddedSignal.s();
      return value;
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
        embeddedSignals.get(p)!.s(value);
      }

      return true;
    },
    deleteProperty(target, p) {
      if (embeddedSignals.has(p)) {
        removeWatcher(embeddedSignals.get(p)!.w);
        embeddedSignals.delete(p);
      }
      parentSignal(target);
      return Reflect.deleteProperty(target, p);
    },
    has(target, p) {
      parentSignal();
      return Reflect.has(target, p);
    },
    ownKeys(target) {
      console.log("ownKeys");
      parentSignal();
      return Reflect.ownKeys(target);
    },
  });
  const parentSignal = useSignal(proxy);
  return proxy as ProxyObject<T>;
}

function getLastManipulation() {
  return lastManipulation;
}
export { useReactive, getLastManipulation };
