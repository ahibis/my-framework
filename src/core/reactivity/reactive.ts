import { getLastRegisteredWatcher } from "./SignalsContext";
import { removeWatcher, Signal, useSignal, watchFunc } from "./signal";

type EmbeddedSignals<T> = Map<
  keyof T,
  {
    s: Signal<T[keyof T]>;
    w: watchFunc;
  }
>;

function handleObject<
  T extends object,
  T1 extends object | undefined = undefined
>(value: T, prevValue: Reactive<T, T1>) {
  const target = prevValue.__target__;
  if (value === target) {
    return prevValue;
  }
  const signals = prevValue.__signals__;
  const cache = prevValue.__cache__;
  const parent = prevValue.__parent__;
  const newCache = new Map<keyof T, T[keyof T]>();
  for (let key in signals) {
    const signalCtx = signals.get(key as keyof T)!;
    if (!(key in value)) {
      removeWatcher(signalCtx.w);
      signals.delete(key as keyof T);
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
    signals.set(key as keyof T, { s, w: newWatcher });
    s(value[key as keyof T]);
  }
  for (let key in cache) {
    const childValue = value[key as keyof T]!;
    if (childValue) {
      newCache.set(
        key as keyof T,
        handleObject(
          childValue,
          cache.get(key as keyof T)! as Reactive<NonNullable<T[keyof T]>>
        ) as Reactive<NonNullable<T[keyof T]>>
      );
    }
  }
  return useReactive(value, {
    embeddedSignals: signals,
    cachedValue: newCache,
    parent,
  });
}

type Reactive<T, T1 extends object | undefined = undefined> = T & {
  __signals__: EmbeddedSignals<T>;
  __cache__: Map<keyof T, T[keyof T]>;
  __target__: T;
  __parent__: Reactive<T1>;
  __signal__?: Signal<Reactive<T1>>;
};
type ReactiveOptions<T, T1 extends object | undefined = undefined> = {
  embeddedSignals: EmbeddedSignals<T>;
  cachedValue: Map<keyof T, T[keyof T]>;
  parent?: Reactive<T1>;
  key?: keyof T1;
};

function useReactive<
  T extends object,
  T1 extends object | undefined = undefined
>(value: T, reactiveOptions?: ReactiveOptions<T, T1>) {
  const { embeddedSignals, cachedValue, parent, key } = reactiveOptions || {
    embeddedSignals: new Map(),
    cachedValue: new Map(),
  };
  const proxy = new Proxy<T>(value, {
    get(target, p1, receiver) {
      const p = p1 as keyof T;
      if (p === "__signals__") return embeddedSignals;
      if (p === "__cache__") return cachedValue;
      if (p === "__target__") return target;
      if (p === "__parent__") return reactiveOptions?.parent;
      const value = Reflect.get(target, p, receiver) as T[keyof T];
      if (p === "__signal__") {
        if (reactiveOptions?.parent && key) {
          const signal = parent?.__signals__.get(key);
          if (signal) {
            return signal.s;
          }
          const s = useSignal(proxy) as Signal<T1[keyof T1]>;
          useSignal(() => {});
          const w = getLastRegisteredWatcher()!;
          // embeddedSignals.set(p, { s, w });
          parent?.__signals__.set(key, { s, w });
        }
        return undefined;
      }
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
        const newValue = useReactive(value);
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
    set(target, p1, value) {
      const $value: T[keyof T] = value;
      const p = p1 as keyof T;
      target[p as keyof T] = $value;
      if ($value instanceof Object) {
        if (cachedValue.has(p as keyof T)) {
          cachedValue.set(
            p as keyof T,
            handleObject(
              $value,
              cachedValue.get(p as keyof T) as Reactive<NonNullable<T[keyof T]>>
            )
          );
          return true;
        }
        cachedValue.set(p as keyof T, useReactive($value));
        return true;
      }
      if (embeddedSignals.has(p)) {
        embeddedSignals.get(p)!.s(value);
      }

      return true;
    },
    deleteProperty(target, p) {
      if (embeddedSignals.has(p as keyof T)) {
        removeWatcher(embeddedSignals.get(p as keyof T)!.w);
        embeddedSignals.delete(p as keyof T);
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
  } as ProxyHandler<T>);
  const parentSignal = useSignal(proxy);
  return proxy as Reactive<T>;
}

function compareReactive<T, T1>(a: Reactive<T>, b: Reactive<T1>) {
  return (a.__signals__ as unknown) === (b.__signals__ as unknown);
}
function fromReactive<T>(value: Reactive<T>): T {
  return value.__target__;
}
function isReactive<T extends object>(value: T): value is Reactive<T> {
  return (value as T & { __target__?: unknown }).__target__ !== undefined;
}
function useReactiveSignal<T extends object>(value: T) {
  return useSignal(useReactive(value));
}

export {
  useReactive,
  compareReactive,
  isReactive,
  fromReactive,
  useReactiveSignal,
  type Reactive,
  type EmbeddedSignals,
};
