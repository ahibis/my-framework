import { shadowRootWithParams } from "./createComponent";

function replaceMount(element: shadowRootWithParams, toElement: HTMLElement) {
  toElement.replaceWith(element);
  element.ctx.onMounted();
}
export { replaceMount };
