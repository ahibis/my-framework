import { SignalOptions } from "./useSignal";

type Hooks<T> = {
  onUpdate: (value: Record<keyof T, T[keyof T]>) => void;
  onDelete: (value: T[keyof T][]) => void;
  onAdd: (value: Record<keyof T, T[keyof T]>) => void;
};

function useReactiveObjectHook<T>(
  watcherHook: () => T,
  hooks: Hooks<T>,
  signalOptions: SignalOptions<T>
) {}
