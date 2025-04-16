import { getLastManipulation, Signal, useSignal } from "./signal";
function evalFunc(code: string) {
  return new Function("ctx", `with(ctx){return ${code}}`);
}

function handleElement(
  element: Node,
  ctx: componentContext,
  providedElements: Record<string, NodeList>
) {
  const childrenQueue = [element];

  let lastIfResult: Signal<boolean> | undefined = undefined;
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
        ) => HTMLElement;
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
        child.replaceWith(element);
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
        // служебные директивы
        if (name.startsWith("*")) {
          if (name === "*for") {
            handleChilds = false;
            const [valueWithKey, code] = value.split(" in ");
            const [valueKey, indexKeyRaw] = valueWithKey.split(",");
            const indexKey = indexKeyRaw?.trim() || "index";
            const func = evalFunc(code);
            let isInit = true;
            let elements: HTMLElement[] = [];
            let reactiveValues: Signal<string>[] = [];
            child.removeAttribute(name);
            const prevChild = child.cloneNode(true) as HTMLElement;
            useSignal(() => {
              const res = func(ctx) as string[];
              if (isInit) {
                reactiveValues = res.map((item) => useSignal(item));
                elements = res.map((item, i) => {
                  const element = child.cloneNode(true) as HTMLElement;
                  handleElement(
                    element,
                    {
                      ...ctx,
                      [valueKey.trim()]: reactiveValues[i],
                      [indexKey.trim()]: i,
                    },
                    {}
                  );
                  return element;
                });
                child.replaceWith(...elements);
                isInit = false;
                return;
              }
              for (let i = 0; i < Math.min(res.length, elements.length); i++) {
                reactiveValues[i](res[i]);
              }
              for (let i = res.length; i < elements.length; i++) {
                elements[i].remove();
                elements.pop();
              }
              const newReactiveValues = res
                .slice(elements.length)
                .map((item) => useSignal(item));
              if (reactiveValues.length > 0) {
                reactiveValues.push(...newReactiveValues);
              }
              const newElements = res.slice(elements.length).map((item, i) => {
                const element = prevChild.cloneNode(true) as HTMLElement;
                const index = elements.length + i;
                handleElement(
                  element,
                  {
                    ...ctx,
                    [valueKey.trim()]: reactiveValues[index],
                    [indexKey.trim()]: index,
                  },
                  {}
                );
                return element;
              });
              if (newElements.length > 0) {
                elements.at(-1)?.after(...newElements);
                elements.push(...newElements);
              }
            });
            break;
          }

          if (name === "*if") {
            let prevChild: Node = document.createComment("");
            let prevState: boolean = true;
            child.removeAttribute(name);
            lastIfResult = useSignal(() => !!func(ctx));
            useSignal(() => {
              const state = !!func(ctx);
              console.log(state);
              if (prevState !== state) {
                if (!state) {
                  child.parentElement?.replaceChild(prevChild, child)!;
                } else {
                  prevChild.parentElement?.replaceChild(child, prevChild)!;
                }
                prevState = state;
              }
            });

            continue;
          }
          if (name === "*else") {
            let prevChild: Node = document.createComment("");
            let prevState: boolean = false;
            child.removeAttribute(name);
            useSignal(() => {
              if (lastIfResult === undefined) return;
              const state = !lastIfResult();
              console.log(state);
              if (prevState !== state) {
                if (!state) {
                  child.parentElement?.replaceChild(prevChild, child)!;
                } else {
                  prevChild.parentElement?.replaceChild(child, prevChild)!;
                }
                prevState = state;
              }
            });
            continue;
          }
          if (name === "*model") {
            const signal = func(ctx) as Signal<string> | string;
            if (signal instanceof Function) {
              useSignal(() => {
                const res = signal();
                child.setAttribute("value", res);
              });
              child.addEventListener("input", (event) => {
                signal((event.target as HTMLInputElement)?.value);
              });
              child.removeAttribute(name);
              continue;
            }
            const manipulation = getLastManipulation();
            if (!manipulation) continue;
            const key = manipulation[1];
            const target = manipulation[0];
            useSignal(() => {
              child.setAttribute("value", target[key] as string);
            });
            child.addEventListener("input", (event) => {
              target[key] = (event.target as HTMLInputElement)?.value;
            });
            child.removeAttribute(name);
            continue;
          }
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
          if (name === ":style") {
            useSignal(() => {
              const res = func(ctx);
              if (res instanceof Object) {
                child.setAttribute(
                  key,
                  Object.entries(res)
                    .map(([key, value]) => `${key}:${value};`)
                    .join("")
                );
                return;
              }
              child.setAttribute(key, res);
            });
            child.removeAttribute(name);
            continue;
          }
          if (name === ":class") {
            useSignal(() => {
              const res = func(ctx);
              if (res instanceof Array) {
                child.setAttribute(key, res.join(" "));
                return;
              }
              if (res instanceof Object) {
                child.setAttribute(
                  key,
                  Object.entries(res)
                    .filter(([key, value]) => value)
                    .map(([key]) => key)
                    .join(" ")
                );
                return;
              }
              child.setAttribute(key, res);
            });
            child.removeAttribute(name);
            continue;
          }
          if (name === ":bind") {
            useSignal(() => {
              const res = func(ctx) as Record<string, string>;
              Object.entries(res).forEach(([key, value]) => {
                child.setAttribute(key, value);
              });
            });
            child.removeAttribute(name);
            continue;
          }
          if (name === ":ref") {
            const res = func(ctx) as (element: HTMLElement) => void;
            res(child);

            child.removeAttribute(name);
            continue;
          }
          if (name === ":html") {
            useSignal(() => {
              const res = func(ctx) as string;
              (child as HTMLElement).innerHTML = res;
            });
            continue;
          }

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
}

type componentContext = Record<string, unknown>;

interface componentState {
  onMounted: () => void;
}
const componentStateStack: componentState[] = [];

function createComponent<T extends object>(
  htmlString: string,
  setup: (params: T) => componentContext
) {
  return (params: T, elements: Record<string, NodeList>) => {
    const componentState = { onMounted: () => {} };
    componentStateStack.push(componentState);
    const ctx = setup(params);
    const element = document.createElement("div");
    const shadowRoot = element.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = htmlString;
    const virtualDOM = shadowRoot;
    if (virtualDOM) {
      handleElement(virtualDOM, ctx, elements);
    }
    componentStateStack.pop();
    return virtualDOM!;
  };
}
function onMounted(func: () => void) {
  if (componentStateStack.length == 0) throw new Error("no component");
  componentStateStack[componentStateStack.length - 1].onMounted = func;
}
export { createComponent, onMounted };
