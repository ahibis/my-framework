import { componentsContext, shadowRootWithParams } from "./createComponent";

function replaceMount(element: shadowRootWithParams, toElement: HTMLElement) {
  toElement.replaceWith(element);
  element.ctx.onMounted();
  componentsContext.addMountedComponentState(element.ctx);
}
export { replaceMount };
