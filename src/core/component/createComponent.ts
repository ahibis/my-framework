import { standardDirectivesMap } from "../directives";
import { useSignal, watchFunc } from "../reactivity";
import { hookWatchers } from "../reactivity/hookWatchers";
import { replaceMount } from "./replaceMount";
function evalFunc(code: string) {
  return new Function("ctx", `with(ctx){return ${code}}`);
}

const directivesMap = standardDirectivesMap;
console.log(directivesMap);

type NodeWithContext = Node & {
  watchers?: watchFunc[];
  componentStates?: componentState[];
};

function handleElement(
  element: NodeWithContext,
  ctx: componentContext,
  providedElements: Record<string, NodeList>
) {
  const childrenQueue = [element];
  const offsetOfComponentState = componentsContext.startHookComponentState();
  const watchers = hookWatchers(() => {
    while (childrenQueue.length > 0) {
      const child = childrenQueue.shift()!;

      if (child instanceof Text) {
        const data = child.nodeValue;
        if (data == null) continue;

        const parts = data.match(/({[^}]*}|[^{]*)/g)!;
        const expRegexp = /{[^}]+}/g;

        if (parts.length > 1) parts?.pop();

        if (parts.length === 1) {
          const part = parts[0];
          if (!expRegexp.test(part)) {
            continue;
          }
          const code = part.substring(1, part.length - 1);
          const func = evalFunc(code);
          useSignal(() => {
            child.nodeValue = func(ctx);
          });
          continue;
        }
        const elements = parts.map((part) => {
          if (expRegexp.test(part)) {
            const code = part.substring(1, part.length - 1);
            const func = evalFunc(code);
            const textEl = new Text();
            useSignal(() => {
              textEl.nodeValue = func(ctx);
            });
            return textEl;
          }
          return part;
        });

        child.replaceWith(...elements);
        continue;
      }

      if (child instanceof HTMLElement) {
        if (child.localName === "slot") {
          const slotName = child.getAttribute("name");
          if (slotName == null) {
            child.replaceWith(...providedElements[""]);
            continue;
          }
          if (slotName in providedElements) {
            child.replaceWith(...providedElements[slotName]);
          }
        }
        if (
          child.localName in ctx &&
          typeof ctx[child.localName] === "function"
        ) {
          const attributes = [...child.attributes];
          const params = Object.fromEntries(
            attributes.map((attr) => {
              if (attr.name.startsWith(":")) {
                return [attr.name.substring(1), evalFunc(attr.value)(ctx)];
              }
              return [attr.name, attr.value];
            })
          );
          const elementFunc = ctx[child.localName] as (
            params: Record<string, unknown>,
            elements: Record<string, NodeList>
          ) => shadowRootWithParams;
          const childrens = [...child.childNodes];
          const elementsRecord: Record<string, NodeList> = {
            "": child.childNodes,
          };
          childrens.forEach((templateEl) => {
            if (
              !(
                templateEl instanceof HTMLElement &&
                templateEl.localName === "template" &&
                templateEl.hasAttribute("name")
              )
            )
              return;
            const name = (templateEl as HTMLElement).getAttribute("name")!;
            elementsRecord[name] = templateEl.childNodes;
            childrenQueue.push(...templateEl.childNodes);
          });
          childrenQueue.push(
            ...childrens.filter(
              (child) =>
                !(
                  child instanceof HTMLElement &&
                  child.localName === "template" &&
                  child.hasAttribute("name")
                )
            )
          );
          const element = elementFunc(params, elementsRecord);
          replaceMount(element, child);
          continue;
        }
        const attributes = [...child.attributes];
        let handleChilds = true;

        for (let i = 0; i < attributes.length; i++) {
          const attribute = attributes[i];
          const name = attribute.name;
          const key = name.substring(1, name.length);
          const value = attribute.value;

          const func = evalFunc(value);

          if (directivesMap.has(name)) {
            const directive = directivesMap.get(name)!;
            const res = directive.handleFunc(child, ctx, value);
            if (res) {
              if (res.stopHandleChildren) {
                handleChilds = false;
              }
              if (res.stopHandleAttributes) {
                break;
              }
            }
            continue;
          }
          // обработка событий
          if (name.startsWith("@")) {
            child.addEventListener(key, (event) => {
              let newCtx = {
                ...ctx,
                $event: event,
                $value: (event.target as HTMLInputElement)?.value,
              };
              const res = func(newCtx);
              if (typeof res === "function") {
                res(event);
              }
            });
            child.removeAttribute(name);
          }
          // обработка атрибутов
          if (name.startsWith(":")) {
            useSignal(() => {
              const res = func(ctx);

              child.setAttribute(key, res);
            });
            child.removeAttribute(attribute.name);
          }
        }
        if (!handleChilds) {
          continue;
        }
      }

      if (child?.childNodes.length > 0) {
        childrenQueue.push(...child.childNodes);
      }
    }
  });
  const componentStates = componentsContext.stopHookComponentState(
    offsetOfComponentState
  );
  element.watchers = watchers;
  element.componentStates = componentStates;
}

type componentContext = Record<string, unknown>;

interface componentState {
  onMounted: () => void;
  onUnmounted: () => void;
}
class ComponentsContext {
  componentStateStack: componentState[] = [];
  mountedComponentState: componentState[] = [];
  addMountedComponentState(state: componentState) {
    this.mountedComponentState.push(state);
  }
  startHookComponentState() {
    return this.mountedComponentState.length;
  }
  stopHookComponentState(offset: number) {
    return this.mountedComponentState.slice(
      offset,
      this.mountedComponentState.length
    );
  }
}
const componentsContext = new ComponentsContext();

type shadowRootWithParams = ShadowRoot & {
  watchers: watchFunc[];
  ctx: componentState;
};

function createComponent<T extends object>(
  htmlString: string,
  setup: (params: T) => componentContext
) {
  return (params: T, elements: Record<string, NodeList>) => {
    const componentState: componentState = {
      onMounted: () => {},
      onUnmounted: () => {},
    };
    componentsContext.componentStateStack.push(componentState);
    let ctx: componentContext;
    const watchers = hookWatchers(() => {
      ctx = setup(params);
    });
    const element = document.createElement("div");
    const shadowRoot = element.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = htmlString;
    const virtualDOM = shadowRoot as shadowRootWithParams;
    if (virtualDOM) {
      handleElement(virtualDOM, ctx!, elements);
      virtualDOM.watchers.push(...watchers);
      virtualDOM.ctx = componentState;
    }
    componentsContext.componentStateStack.pop();
    return virtualDOM!;
  };
}

export {
  createComponent,
  handleElement,
  componentsContext,
  type NodeWithContext,
  type shadowRootWithParams,
  type componentState,
};
