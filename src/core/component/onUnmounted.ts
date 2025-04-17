import { componentsContext } from "./createComponent";

const { componentStateStack } = componentsContext;
function onUnmounted(func: () => void) {
  if (componentStateStack.length == 0) throw new Error("no component");
  componentStateStack[componentStateStack.length - 1].onUnmounted = func;
}
export { onUnmounted };
