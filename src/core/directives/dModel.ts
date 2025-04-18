import { evalFunc } from "../component";
import {
  getLastManipulation,
  Signal,
  toSignal,
  useSignal,
} from "../reactivity";
import { createDirective } from "./createDirective";

const dModel = createDirective("*model", (child, ctx, value) => {
  const func = evalFunc(value);
  const signal = toSignal(func(ctx) as Signal<string> | string);
  useSignal(
    () => {
      const res = signal();
      (child as HTMLInputElement).value = res;
    },
    { onAnimationFrame: true }
  );
  child.addEventListener("input", (event) => {
    signal((event.target as HTMLInputElement)?.value);
  });
  child.removeAttribute("*model");
});
export { dModel };
