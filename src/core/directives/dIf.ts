import { Signal, useSignal } from "../signal";
import { createDirective, evalFunc } from "./createDirective";

let lastIfResult: Signal<boolean> | undefined = undefined;
const dIf = createDirective("*if", (child, ctx, value) => {
  const func = evalFunc(value);
  let prevChild: Node = document.createComment("");
  let prevState: boolean = true;
  child.removeAttribute("*if");
  lastIfResult = useSignal(() => !!func(ctx));
  useSignal(() => {
    const state = !!func(ctx);
    if (prevState !== state) {
      if (!state) {
        child.parentElement?.replaceChild(prevChild, child)!;
      } else {
        prevChild.parentElement?.replaceChild(child, prevChild)!;
      }
      prevState = state;
    }
  });
  return;
});
const dElse = createDirective("*else", (child) => {
  let prevChild: Node = document.createComment("");
  let prevState: boolean = false;
  child.removeAttribute("*else");
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
  return;
});
export { dIf, dElse };
