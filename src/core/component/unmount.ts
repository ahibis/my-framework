import { removeWatcher, watchFunc } from "../reactivity";
import { ComponentState } from "./componentsContext";

type HTMLElementWithContext = HTMLElement & {
  watchers?: watchFunc[];
  componentStates?: ComponentState[];
};
function unmount(element: HTMLElementWithContext) {
  if (element.watchers) {
    element.watchers.forEach((watchFunc) => removeWatcher(watchFunc));
  }
  if (element.componentStates)
    element.componentStates.forEach((componentState) =>
      componentState.onUnmounted.forEach((func) => func())
    );
  element.remove();
}
export { unmount };
