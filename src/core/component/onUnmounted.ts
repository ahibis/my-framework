import { componentsContext } from "./componentsContext";

function onUnmounted(func: () => void) {
  componentsContext.getCurrentComponentState().onUnmounted = func;
}
export { onUnmounted };
