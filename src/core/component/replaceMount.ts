import { componentsContext } from "./componentsContext";
import { HtmlElementWithParams } from "./hydrateElement";

function replaceMount(element: HtmlElementWithParams, toElement: HTMLElement) {
  toElement.replaceWith(element);
  element.ctx.onMounted.forEach((func) => func());
  componentsContext.addMountedComponentState(element.ctx);
}
export { replaceMount };
