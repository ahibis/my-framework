import { componentsContext } from "./createComponent";

function onUnmounted(func: () => void) {
  componentsContext.getCurrentComponentState().onUnmounted = func;
}
export { onUnmounted };
