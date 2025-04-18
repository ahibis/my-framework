import { componentsContext } from "./componentsContext";

function onMounted(func: () => void) {
  componentsContext.getCurrentComponentState().onMounted = func;
}
export { onMounted };
