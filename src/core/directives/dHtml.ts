import { evalFunc } from "../component";
import { useSignal } from "../reactivity";
import { createDirective } from "./createDirective";

const dHtml = createDirective(":html", (child, ctx, value) => {
  const func = evalFunc(value);
  useSignal(
    () => {
      const res = func(ctx) as string;
      (child as HTMLElement).innerHTML = res;
    },
    { onAnimationFrame: true }
  );
  child.removeAttribute(":html");
});
export { dHtml };
