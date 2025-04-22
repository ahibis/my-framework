import { memo } from "../helpers/memo";
import { Signal, useSignal } from "./signal";

type SignalsFromArray<T extends any[]> = {
  [K in keyof T]: Signal<T[K]>;
};

function toComputed<T extends any[], T1>(func: (...args: T) => T1) {
  const f = memo((...args1: SignalsFromArray<T>) =>
    useSignal<T1>(() => func(...(args1.map((a) => a()) as T)), {
      deps: args1,
    })
  );
  return f;
}
export { toComputed };
