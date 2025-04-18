import { hookWatchers } from "../reactivity/hookWatchers";
import { componentsContext, ComponentState } from "./componentsContext";
import {
  ComponentContext,
  hydrateElement,
  ShadowRootWithParams,
} from "./hydrateElement";

function createComponent<T extends object>(
  htmlString: string,
  setup: (params: T) => ComponentContext
) {
  const element = document.createElement("div");
  const shadowRootParent = element.attachShadow({ mode: "open" });
  shadowRootParent.innerHTML = htmlString;

  return (params: T, elements: Record<string, NodeList>) => {
    const componentState: ComponentState = {
      onMounted: () => {},
      onUnmounted: () => {},
    };
    componentsContext.componentStateStack.push(componentState);
    let ctx: ComponentContext;
    const watchers = hookWatchers(() => {
      ctx = setup(params);
    });
    const virtualDOM = shadowRootParent.childNodes[0].cloneNode(
      true
    ) as ShadowRootWithParams;
    if (virtualDOM) {
      hydrateElement(virtualDOM, ctx!, elements);
      virtualDOM.watchers.push(...watchers);
      virtualDOM.ctx = componentState;
    }
    componentsContext.componentStateStack.pop();
    return virtualDOM!;
  };
}

export { createComponent };
