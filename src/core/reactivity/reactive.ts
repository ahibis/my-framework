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
  const changeSignal = prevValue.__changeSignal__;
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

  const changeSignalData = {} as Partial<T>;
  for (let key in value) {
    const childValue = value[key as keyof T]!;
    if (!((childValue as keyof T) in target)) {
      changeSignalData[key as keyof T] = childValue;
    }
  }
  for (let key in target) {
    const childValue = target[key as keyof T]!;
    if (!((childValue as keyof T) in value)) {
      changeSignalData[key as keyof T] = undefined;
    }
  }
  changeSignal(changeSignalData);

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
  __changeSignal__: Signal<Partial<T>>;
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
      if (p === "__changeSignal__") return changeSignal;
      const value = Reflect.get(target, p, receiver) as T[keyof T];
      if (p === "__signal__") {
        if (parent != undefined && key) {
          const signal = parent.__signals__.get(key);
          if (signal) {
            return signal.s;
          }
          const s = useSignal(proxy) as Signal<T1[keyof T1]>;
          useSignal(() => {
            (parent.__target__ as NonNullable<T1>)[key as keyof T1] =
              s() as NonNullable<T1>[keyof T1];
          });
          const w = getLastRegisteredWatcher()!;
          parent.__signals__.set(key, { s, w });
        }
        return undefined;
      }
      // console.log("get", target, p, value);
      if (typeof p === "symbol") {
        changeSignal();
        return value;
      }
      if (p === "length") {
        changeSignal();
      }

      if (value instanceof Function) {
        return value;
      }
      if (value instanceof Object) {
        if (cachedValue.has(p as keyof T)) {
          return cachedValue.get(p as keyof T);
        }
        const newValue = useReactive<T[keyof T] & object, T>(value, {
          cachedValue: new Map(),
          embeddedSignals: new Map(),
          parent: proxy as Reactive<T>,
        });
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
      let $value: T[keyof T] = value;
      const p = p1 as keyof T;
      if (!(p in target)) {
        changeSignal({ [p as keyof T]: $value } as Partial<T>);
      }
      target[p as keyof T] = $value;
      if ($value instanceof Object) {
        if (($value as Reactive<T[keyof T]>).__target__) {
          $value = ($value as Reactive<T[keyof T]>).__target__ as T[keyof T] &
            object;
        }

        if (cachedValue.has(p as keyof T)) {
          cachedValue.set(
            p as keyof T,
            handleObject(
              $value as T[keyof T] & object,
              cachedValue.get(p as keyof T) as Reactive<NonNullable<T[keyof T]>>
            )
          );
          return true;
        }
        cachedValue.set(
          p as keyof T,
          useReactive($value as T[keyof T] & object)
        );
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
      changeSignal({ [p as keyof T]: undefined } as Partial<T>);
      return Reflect.deleteProperty(target, p);
    },
    has(target, p) {
      changeSignal();
      return Reflect.has(target, p);
    },
    ownKeys(target) {
      console.log("ownKeys");
      changeSignal();
      return Reflect.ownKeys(target);
    },
  } as ProxyHandler<T>);

  const changeSignal = useSignal<Partial<T>>(proxy);

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
