import { evalFunc } from "../component";
import { getLastManipulation, Signal, useSignal } from "../reactivity";
import { createDirective } from "./createDirective";

const dModel = createDirective("*model", (child, ctx, value) => {
  const func = evalFunc(value);
  const signal = func(ctx) as Signal<string> | string;
  if (signal instanceof Function) {
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
    return;
  }
  const manipulation = getLastManipulation();
  if (!manipulation) return;
  const key = manipulation[1];
  const target = manipulation[0];
  useSignal(() => {
    (child as HTMLInputElement).value = target[key] as string;
  });
  child.addEventListener("input", (event) => {
    target[key] = (event.target as HTMLInputElement)?.value;
  });
  child.removeAttribute("*model");
});
export { dModel };
