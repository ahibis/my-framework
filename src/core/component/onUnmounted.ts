import { componentsContext } from "./componentsContext";

function onUnmounted(func: () => void) {
  componentsContext.getCurrentComponentState().onUnmounted.push(func);
}
export { onUnmounted };
