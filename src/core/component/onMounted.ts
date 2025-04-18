import { componentsContext } from "./createComponent";

function onMounted(func: () => void) {
  componentsContext.getCurrentComponentState().onMounted = func;
}
export { onMounted };
