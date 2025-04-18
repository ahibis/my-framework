import { getCurrentComponentState } from "./componentsContext";

function onUnmounted(func: () => void) {
  getCurrentComponentState().onUnmounted.push(func);
}
export { onUnmounted };
