import { useAnimationFrame } from "../reactivity";
import { componentsContext } from "./componentsContext";
import { HtmlElementWithParams } from "./hydrateElement";

function mount(element: HtmlElementWithParams, toElement: HTMLElement) {
  useAnimationFrame(() => {
    toElement.appendChild(element);
  });
  element.ctx.onMounted.forEach((func) => func());
  componentsContext.addMountedComponentState(element.ctx);
}
export { mount };
