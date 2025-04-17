import { useSignal } from "../signal";
import { createDirective, evalFunc } from "./createDirective";

const dBind = createDirective(":bind", (child, ctx, value) => {
  const func = evalFunc(value);
  useSignal(() => {
    const res = func(ctx) as Record<string, string>;
    Object.entries(res).forEach(([key, value]) => {
      child.setAttribute(key, value);
    });
  });
  child.removeAttribute(":bind");
});
export { dBind };
