import { getCurrentComponentState } from "./componentsContext";

function onMounted(func: () => void) {
  getCurrentComponentState().onMounted.push(func);
}
export { onMounted };
