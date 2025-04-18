import { componentsContext } from "./componentsContext";
import { ShadowRootWithParams } from "./hydrateElement";

function mount(element: ShadowRootWithParams, toElement: HTMLElement) {
  toElement.appendChild(element);
  element.ctx.onMounted();
  componentsContext.addMountedComponentState(element.ctx);
}
export { mount };
