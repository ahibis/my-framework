import { componentStateStack } from "./createComponent";

function onMounted(func: () => void) {
  if (componentStateStack.length == 0) throw new Error("no component");
  componentStateStack[componentStateStack.length - 1].onMounted = func;
}
export { onMounted };
