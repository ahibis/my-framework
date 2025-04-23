import {
  computedFunc,
  Signal,
  SignalOptions,
  useSignal,
  watchFunc,
} from "./signal";

type AsyncComputedFunc<T> = (prevValue: T) => Promise<T>;

type AsyncSignal<T> = ((value1?: Promise<T> | AsyncComputedFunc<T>) => T) & {
  subscribers: Set<watchFunc>;
};

function useAsyncSignal<T>(
  value: T | computedFunc<Promise<T>>,
  options?: SignalOptions<T>
): AsyncSignal<T> {
  if (typeof value === "function") {
    const signal = useSignal<T | undefined>(undefined);
    useSignal<Promise<T>>((prevValue) => {
      const res = (value as computedFunc<Promise<T>>)(prevValue);
      return res;
    }, options);
    return signal as AsyncSignal<T>;
  }
  const signal = useSignal(value);
  const resFunc = (value1?: Promise<T> | AsyncComputedFunc<T>) => {
    if (!value1) {
      return signal();
    }
    if (typeof value1 === "function") {
      value1(signal()).then((value) => signal(value));
      return;
    }
    value1.then((value) => signal(value));
    return;
  };
  resFunc.subscribers = signal.subscribers;
  return resFunc as AsyncSignal<T>;
}
