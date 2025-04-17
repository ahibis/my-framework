import { handleElement } from "../component";
import { Signal, useSignal } from "../reactivity";
import { createDirective, evalFunc } from "./createDirective";

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
    },
    { onAnimationFrame: true }
  );
  return {
    stopHandleChildren: true,
    stopHandleAttributes: true,
  };
});
export { dFor };
