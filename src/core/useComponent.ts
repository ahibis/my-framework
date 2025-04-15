"str";
import { signalContext, signalReturn, useSignal } from "./signal";

type componentContext = Record<string, unknown>;

function evalFunc(code: string) {
  return new Function("ctx", `with(ctx){return ${code}}`);
}

function handleElement(element: ChildNode, ctx: componentContext) {
  const childs = [element];
  while (childs.length > 0) {
    const child = childs.shift()!;

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
          params: Record<string, unknown>
        ) => HTMLElement;
        const element = elementFunc(params);
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

        if (name.startsWith("@")) {
          if (name === "@for") {
            handleChilds = false;
            const [valueWithKey, code] = value.split(" in ");
            const [valueKey, indexKeyRaw] = valueWithKey.split(",");
            const indexKey = indexKeyRaw?.trim() || "index";
            const func = evalFunc(code);
            let isInit = true;
            let elements: HTMLElement[] = [];
            let reactiveValues: signalReturn<string>[] = [];
            child.removeAttribute(name);
            const prevChild = child.cloneNode(true) as HTMLElement;
            useSignal((changeObserveMode) => {
              const res = func(ctx) as string[];
              changeObserveMode(false);
              if (isInit) {
                reactiveValues = res.map((item) => useSignal(item));
                elements = res.map((item, i) => {
                  const element = child.cloneNode(true) as HTMLElement;
                  handleElement(element, {
                    ...ctx,
                    [valueKey.trim()]: reactiveValues[i],
                    [indexKey.trim()]: i,
                  });
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
                handleElement(element, {
                  ...ctx,
                  [valueKey.trim()]: reactiveValues[index],
                  [indexKey.trim()]: index,
                });
                return element;
              });
              if (newElements.length > 0) {
                elements.at(-1)?.after(...newElements);
                elements.push(...newElements);
              }
            });
            break;
          }

          if (name === "@if") {
            let prevChild: Node = document.createComment("");
            let prevState: boolean = true;
            child.removeAttribute(name);
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
      childs.push(...child.childNodes);
    }
  }
}

function useComponent<T extends object>(
  htmlString: string,
  setup: (params: T) => componentContext
) {
  return (params?: T) => {
    const ctx = setup(params || ({} as T));
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");
    const virtualDOM = doc.body.firstChild;
    if (virtualDOM) {
      handleElement(virtualDOM, ctx);
    }
    return virtualDOM!;
  };
}
export { useComponent };
