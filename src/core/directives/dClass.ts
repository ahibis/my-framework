import { useSignal } from "../signal";
import { createDirective, evalFunc } from "./createDirective";

const dClass = createDirective(":class", (child, ctx, value) => {
  const func = evalFunc(value);
  useSignal(() => {
    const res = func(ctx);
    if (res instanceof Array) {
      child.setAttribute("class", res.join(" "));
      return;
    }
    if (res instanceof Object) {
      child.setAttribute(
        "class",
        Object.entries(res)
          .filter(([key, value]) => value)
          .map(([key]) => key)
          .join(" ")
      );
      return;
    }
    child.setAttribute("class", res);
  });
  child.removeAttribute(":class");
});
export { dClass };
