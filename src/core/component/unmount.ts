import { removeWatcher, watchFunc } from "../reactivity";

type HTMLElementWithContext = HTMLElement & {
  watchers?: watchFunc[];
};
function unmount(element: HTMLElementWithContext) {
  if (element.watchers) {
    element.watchers.forEach((watchFunc) => removeWatcher(watchFunc));
  }
  element.remove();
}
export { unmount };
