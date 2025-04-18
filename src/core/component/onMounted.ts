import { componentsContext } from "./componentsContext";

function onMounted(func: () => void) {
  componentsContext.getCurrentComponentState().onMounted.push(func);
}
export { onMounted };
