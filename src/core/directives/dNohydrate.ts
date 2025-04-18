import { createDirective } from "./createDirective";

const dNoHydrate = createDirective("*no-hydrate", (child) => {
  child.removeAttribute("*no-hydrate");
  return {
    stopHandleChildren: true,
    stopHandleChild: true,
  };
});
export { dNoHydrate };
