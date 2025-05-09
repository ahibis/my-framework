import { standardDirectivesMap } from "../directives";
import { onAnimationFrame } from "../helpers";
import { useSignal, watchFunc } from "../reactivity";
import { hookWatchers } from "../reactivity";
import { componentsContext, ComponentState } from "./componentsContext";
import { replaceMount } from "./replaceMount";

function evalFunc(code: string) {
  return new Function("ctx", `with(ctx){return ${code}}`);
}

const directivesMap = standardDirectivesMap;

type ComponentParams = Record<string, unknown>;
type NodeWithContext = Node & {
  watchers?: watchFunc[];
  componentStates?: ComponentState[];
};
type HtmlElementWithParams = HTMLElement & {
  watchers: watchFunc[];
  ctx: ComponentState;
};

function hydrateElement(
  element: NodeWithContext,
  ctx: ComponentParams,
  providedElements: Record<string, NodeList>
) {
  const childrenQueue = [element];
  const offsetOfComponentState = componentsContext.startHookComponentState();
  const watchers = hookWatchers(() => {
    while (childrenQueue.length > 0) {
      const child = childrenQueue.shift()!;
      // отрисовка {}
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
          useSignal(
            () => {
              child.nodeValue = func(ctx);
            },
            { onAnimationFrame: true }
          );
          continue;
        }
        const elements = parts.map((part) => {
          if (expRegexp.test(part)) {
            const code = part.substring(1, part.length - 1);
            const func = evalFunc(code);
            const textEl = new Text();
            useSignal(
              () => {
                textEl.nodeValue = func(ctx);
              },
              { onAnimationFrame: true }
            );
            return textEl;
          }
          return part;
        });

        child.replaceWith(...elements);
        continue;
      }

      if (child instanceof HTMLElement) {
        // отрисовка <slot/>
        if (child.localName === "slot") {
          const slotName = child.getAttribute("name");
          if (slotName == null) {
            onAnimationFrame(() => {
              child.replaceWith(...providedElements[""]);
            });

            continue;
          }
          if (slotName in providedElements) {
            onAnimationFrame(() => {
              child.replaceWith(...providedElements[slotName]);
            });
          }
        }
        // отрисовка компонентов
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
          ) => HtmlElementWithParams;
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
          onAnimationFrame(() => {
            replaceMount(element, child);
          });
          continue;
        }
        const attributes = [...child.attributes];
        let handleChilds = true;

        // обработка кастомных атрибутов
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
            useSignal(
              () => {
                const res = func(ctx);

                child.setAttribute(key, res);
              },
              { onAnimationFrame: true }
            );
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
export {
  hydrateElement,
  evalFunc,
  type NodeWithContext,
  type HtmlElementWithParams,
  type ComponentParams,
};
