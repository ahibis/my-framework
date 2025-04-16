import { Signal, useSignal } from "../signal";

function use<T>(
  value: Promise<T>,
  defaultValue: T,
  onError?: (error: unknown, signal: Signal<T>) => void
) {
  const signal = useSignal(defaultValue);
  value
    .then((value) => signal(value))
    .catch((error) => onError && onError(error, signal));
  return signal;
}

export { use };
