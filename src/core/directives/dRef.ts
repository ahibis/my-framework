import { evalFunc } from "../component";
import { toSignal } from "../reactivity";
import { createDirective } from "./createDirective";

const dRef = createDirective("@ref", (child, ctx, value) => {
  const func = evalFunc(value);
  const res = toSignal(func(ctx)) as (element: HTMLElement) => void;
  res(child);
  child.removeAttribute("@ref");
});
export { dRef };
