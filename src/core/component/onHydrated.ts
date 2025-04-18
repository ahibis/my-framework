import { getCurrentComponentState } from "./componentsContext";
import { HtmlElementWithParams } from "./hydrateElement";

function onHydrated(func: (element: HtmlElementWithParams) => void) {
  getCurrentComponentState().onHydrate.push(func);
}
export { onHydrated };
