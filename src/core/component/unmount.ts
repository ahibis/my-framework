import { removeWatcher, watchFunc } from "../reactivity";
import { componentState } from "./createComponent";

type HTMLElementWithContext = HTMLElement & {
  watchers?: watchFunc[];
  componentStates?: componentState[];
};
function unmount(element: HTMLElementWithContext) {
  if (element.watchers) {
    element.watchers.forEach((watchFunc) => removeWatcher(watchFunc));
  }
  if (element.componentStates)
    element.componentStates.forEach((componentState) =>
      componentState.onUnmounted()
    );
  element.remove();
}
export { unmount };
