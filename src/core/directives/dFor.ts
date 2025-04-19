import { evalFunc, hydrateElement, unmount } from "../component";
import { use } from "../hooks";
import { isReactive, Signal, toSignal, useSignal } from "../reactivity";
import { createDirective } from "./createDirective";

const dFor = createDirective("*for", (child, ctx, value) => {
  const [valueWithKey, code] = value.split(" in ");
  const [valueKey, indexKeyRaw] = valueWithKey.split(",");
  const indexKey = indexKeyRaw?.trim() || "index";
  const func = evalFunc(code);
  let isInit = true;
  let elements: HTMLElement[] = [];
  let reactiveValues: Signal<string>[] = [];
  child.removeAttribute("*for");
  const prevChild = child.cloneNode(true) as HTMLElement;
  useSignal(
    () => {
      const res = func(ctx) as string[];
      const resIsReactive = isReactive(res);
      res.length;
      if (isInit) {
        if (resIsReactive) {
          useSignal(
            () => {
              reactiveValues = res.map((item) => toSignal(item));
            },
            { deps: [] }
          );
        } else {
          reactiveValues = res.map((item) => useSignal(item));
        }
        useSignal(
          () => {
            elements = res.map((item, i) => {
              const element = child.cloneNode(true) as HTMLElement;
              hydrateElement(
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
          },
          { deps: [] }
        );
        child.replaceWith(...elements);
        isInit = false;
        return;
      }
      if (!resIsReactive) {
        for (let i = 0; i < Math.min(res.length, elements.length); i++) {
          reactiveValues[i](res[i]);
        }
      }

      for (let i = res.length; i < elements.length; i++) {
        unmount(elements[i]);
        reactiveValues.pop();
        elements.pop();
      }
      const newReactiveValues = res
        .slice(elements.length)
        .map((item) => (resIsReactive ? toSignal(item) : useSignal(item)));
      if (newReactiveValues.length > 0) {
        reactiveValues.push(...newReactiveValues);
      }
      const newElements = res.slice(elements.length).map((item, i) => {
        const element = prevChild.cloneNode(true) as HTMLElement;
        const index = elements.length + i;
        hydrateElement(
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
    },
    { onAnimationFrame: true }
  );
  return {
    stopHandleChildren: true,
    stopHandleAttributes: true,
  };
});
export { dFor };
