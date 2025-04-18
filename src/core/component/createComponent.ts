import { useSignal } from "../reactivity";
import { hookWatchers } from "../reactivity/hookWatchers";
import { componentsContext, ComponentState } from "./componentsContext";
import {
  ComponentParams,
  hydrateElement,
  HtmlElementWithParams,
} from "./hydrateElement";

function createComponent<T extends object>(
  htmlString: string,
  setup: (params: T) => ComponentParams
) {
  const element = document.createElement("div");
  const shadowRootParent = element.attachShadow({ mode: "open" });
  shadowRootParent.innerHTML = htmlString;

  return (params: T, elements: Record<string, NodeList>) => {
    const componentState = new ComponentState();
    componentsContext.componentStateStack.push(componentState);
    let ctx: ComponentParams;
    const watchers = hookWatchers(() => {
      useSignal(
        () => {
          ctx = setup(params);
        },
        { deps: [] }
      );
    });
    const virtualDOM = shadowRootParent.childNodes[0].cloneNode(
      true
    ) as HtmlElementWithParams;
    if (virtualDOM) {
      hydrateElement(virtualDOM, ctx!, elements);
      virtualDOM.watchers.push(...watchers);
      virtualDOM.ctx = componentState;
      componentState.onHydrate.forEach((func) => func(virtualDOM));
    }
    componentsContext.componentStateStack.pop();
    return virtualDOM!;
  };
}

export { createComponent };
