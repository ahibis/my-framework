import { getLastRegisteredWatcher } from "./SignalsContext";
import { removeWatcher, Signal, useSignal, watchFunc } from "./signal";

type EmbeddedSignals<T> = Map<
  keyof T,
  {
    s: Signal<T[keyof T]>;
    w: watchFunc;
  }
>;
type Reactive<T extends Object, T1 extends Object | undefined = undefined> = T & {
  __signals__: EmbeddedSignals<T>;
  __cache__: Map<keyof T, Reactive<T[keyof T] & Object>>;
  __target__: T;
  __parent__: Reactive<T1 & Object> | undefined;
  __signal__: Reactive<T1 & Object> | undefined;
  __changeSignal__: Signal<Partial<T>>;
  __depsReactive__: Set<Reactive<T>>
};
type ReactiveOptions<T extends Object, T1 extends Object | undefined = undefined> = {
  embeddedSignals: EmbeddedSignals<T>;
  cachedValue: Map<keyof T, Reactive<T[keyof T] & Object>>;
  parent: Reactive<T1 & Object> | undefined;
  key?: keyof T1;
  changeSignal: Signal<Partial<T>>
};


function handleObject<
  T extends Object,
  T1 extends Object | undefined = undefined
>(value: T, prevValue: Reactive<T, T1>) {
  const target = prevValue.__target__;
  if (value === target) {
    return prevValue;
  }

  const signals = prevValue.__signals__;
  const cache = prevValue.__cache__;
  const parent = prevValue.__parent__;
  const changeSignal = prevValue.__changeSignal__;
  const newCache = new Map<keyof T, Reactive<T[keyof T] & Object>>();

  for (let key in signals) {
    const signalCtx = signals.get(key as keyof T)!;
    //если в новой версии нет ключа, удаляем сигнал
    if (!(key in value)) {
      removeWatcher(signalCtx.w);
      signals.delete(key as keyof T);
      continue;
    }

    // привязываем к сигналу новый watcher, следящий за изменением объекта
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
    // установка нового кеша, уже с объектами связанными 
    if (childValue) {
      newCache.set(
        key as keyof T,
        handleObject(
          childValue,
          cache.get(key as keyof T)!
        )
      );
    }
  }

  // вызов сигнала изменения
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

  // удаление предыдущего прокси из depsReactive из предыдущего сигнала
  if (isReactive(target)) {
    target.__depsReactive__.delete(prevValue as Reactive<T>);
  }

  // создание нового объекта
  const resultReactive = useReactive(value, {
    embeddedSignals: signals,
    cachedValue: newCache,
    parent,
    changeSignal
  });
  // добавление новой depsReactive
  if (isReactive(value)) {
    value.__depsReactive__.add(resultReactive)
  }

  return resultReactive
}



function useReactive<
  T extends Object,
  T1 extends Object | undefined = undefined
>(value: T, reactiveOptions?: ReactiveOptions<T, T1>) {
  const { embeddedSignals, cachedValue, parent, key, changeSignal } = reactiveOptions || {
    embeddedSignals: new Map(),
    cachedValue: new Map(),
    changeSignal: useSignal<Partial<T>>(value)
  };
  let depsReactive: Set<Reactive<T>> = new Set();

  const proxy = new Proxy<T>(value, {
    get(target, p1, receiver) {
      const p = p1 as keyof T;
      if (p === "__signals__") return embeddedSignals;
      if (p === "__cache__") return cachedValue;
      if (p === "__target__") return target;
      if (p === "__parent__") return reactiveOptions?.parent;
      if (p === "__changeSignal__") return changeSignal;
      if (p1 === "__depsReactive__") {
        return depsReactive
      }
      let value: T[keyof T];
      // Если значение реактивно, то не стоит подписываться на ключ
      if (isReactive(target)) {
        value = Reflect.get(target.__target__, p, receiver) as T[keyof T];
      } else {
        value = Reflect.get(target, p, receiver) as T[keyof T];
      }
      // если требуется получить сигнал привязанный к изменению объекта в конкретном классе
      if (p === "__signal__") {
        if (parent != undefined) {
          const signal = parent.__signals__.get(key as keyof T1);
          if (signal) {
            return signal.s;
          }
          const s = useSignal(proxy) as Signal<(T1 & Object)[keyof T1 | keyof Object]>;
          useSignal(() => {
            (parent.__target__ as NonNullable<T1>)[key as keyof T1] =
              s() as NonNullable<T1>[keyof T1];
          });
          const w = getLastRegisteredWatcher()!;
          parent.__signals__.set(key as keyof T1, { s, w });
        }
        return undefined;
      }
      // если символ
      if (typeof p === "symbol") {
        changeSignal();
        return value;
      }
      // если получение длины, то подписаться к изменению объекта
      if (p === "length") {
        changeSignal();
      }
      // если функция вернуть функцию
      if (value instanceof Function) {
        return value;
      }
      // если объект, вернуть реактивный объект
      if (value instanceof Object) {
        if (cachedValue.has(p as keyof T)) {
          return cachedValue.get(p as keyof T);
        }
        const newValue = useReactive<T[keyof T] & Object, T>(value, {
          cachedValue: new Map(),
          embeddedSignals: new Map(),
          parent: proxy as Reactive<T & Object>,
          changeSignal: useSignal<Partial<T[keyof T] & Object>>(value)
        });
        cachedValue.set(p as keyof T, newValue);
        return newValue;
      }
      // если примитивное значение, проверить нет привязанных сигналов, иначе вызвать для обнаружения
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
      // установка связанных сигналов
      if (p1 === "__depsReactive__") {
        depsReactive = value as Set<Reactive<T>>;
      }
      const p = p1 as keyof T;
      // если значения нет в объекте, вызвать сигнал об изменении объекта
      if (!(p in target)) {
        changeSignal({ [p as keyof T]: $value } as Partial<T>);
      }
      // установить новое значение
      target[p as keyof T] = $value;
      if ($value instanceof Object) {
        if (cachedValue.has(p as keyof T)) {
          cachedValue.set(
            p as keyof T,
            handleObject(
              $value,
              cachedValue.get(p as keyof T)
            )
          );
          return true;
        }
        cachedValue.set(
          p as keyof T,
          useReactive($value as T[keyof T] & Object)
        );
        return true;
      }

      if (embeddedSignals.has(p)) {
        embeddedSignals.get(p)!.s(value);
      }
      // вызов связанного сигнала родительского объекта
      depsReactive.forEach(depReactive => {
        const signals = depReactive.__signals__
        if (signals.has(p)) {
          signals.get(p)?.s(value);
        }
      })

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
  } as ProxyHandler<T>) as Reactive<T>;


  return proxy;
}

function compareReactive<T extends Object, T1 extends Object>(a: Reactive<T>, b: Reactive<T1>) {
  return (a.__signals__ as unknown) === (b.__signals__ as unknown);
}

function fromReactive<T extends Object>(value: Reactive<T>): T {
  return value.__target__;
}

function isReactive<T extends Object>(value: T): value is Reactive<T> {
  return (value as T & { __target__?: unknown }).__target__ !== undefined;
}

function useReactiveSignal<T extends Object>(value: T) {
  return useSignal(useReactive(value));
}

function toMutatedSignal<T extends Object>(value: Reactive<T>) {
  1 in value;
  return value.__changeSignal__;
}

export {
  useReactive,
  compareReactive,
  isReactive,
  fromReactive,
  useReactiveSignal,
  toMutatedSignal,
  type Reactive,
  type EmbeddedSignals,
};
