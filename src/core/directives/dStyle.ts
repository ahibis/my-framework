import { evalFunc } from "../component";
import { useSignal } from "../reactivity";
import { createDirective } from "./createDirective";

const dStyle = createDirective(":style", (child, ctx, value) => {
  const func = evalFunc(value);
  useSignal(
    () => {
      const res = func(ctx);
      if (res instanceof Object) {
        child.setAttribute(
          "style",
          Object.entries(res)
            .map(([key, value]) => `${key}:${value};`)
            .join("")
        );
        return;
      }
      child.setAttribute("style", res);
    },
    { onAnimationFrame: true }
  );
  child.removeAttribute(":style");
});
export { dStyle };
