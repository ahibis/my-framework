import { useSignal } from "../reactivity";
import { createDirective, evalFunc } from "./createDirective";

const dStyle = createDirective(":style", (child, ctx, value) => {
  const func = evalFunc(value);
  useSignal(() => {
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
  });
  child.removeAttribute(":style");
});
export { dStyle };
