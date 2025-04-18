import { createDirective } from "./createDirective";

const dNoHydrate = createDirective("*no-hydrate", (child, ctx, value) => {
  child.removeAttribute("*no-hydrate");
  return {
    stopHandleChildren: true,
    stopHandleChild: true,
  };
});
export { dNoHydrate };
