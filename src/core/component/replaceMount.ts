import { componentsContext } from "./componentsContext";
import { ShadowRootWithParams } from "./hydrateElement";

function replaceMount(element: ShadowRootWithParams, toElement: HTMLElement) {
  toElement.replaceWith(element);
  element.ctx.onMounted();
  componentsContext.addMountedComponentState(element.ctx);
}
export { replaceMount };
