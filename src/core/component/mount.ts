import { componentsContext, shadowRootWithParams } from "./createComponent";

function mount(element: shadowRootWithParams, toElement: HTMLElement) {
  toElement.appendChild(element);
  element.ctx.onMounted();
  componentsContext.addMountedComponentState(element.ctx);
}
export { mount };
