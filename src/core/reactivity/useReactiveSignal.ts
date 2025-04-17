import { useReactive } from "./useReactive";
import { useSignal } from "./useSignal";

function useReactiveSignal<T extends object>(value: T) {
  return useSignal(useReactive(value));
}
export { useReactiveSignal };
