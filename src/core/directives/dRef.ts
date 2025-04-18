import { createDirective, evalFunc } from "./createDirective";

const dRef = createDirective("@ref", (child, ctx, value) => {
  const func = evalFunc(value);
  const res = func(ctx) as (element: HTMLElement) => void;
  res(child);
  child.removeAttribute("@ref");
});
export { dRef };
