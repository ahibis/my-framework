import { shadowRootWithParams } from "./createComponent";

function mount(element: shadowRootWithParams, toElement: HTMLElement) {
  toElement.appendChild(element);
  element.ctx.onMounted();
}
export { mount };
