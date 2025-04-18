import { componentsContext } from "./componentsContext";
import { ShadowRootWithParams } from "./hydrateElement";

function mount(element: ShadowRootWithParams, toElement: HTMLElement) {
  toElement.appendChild(element);
  element.ctx.onMounted.forEach((func) => func());
  componentsContext.addMountedComponentState(element.ctx);
}
export { mount };
