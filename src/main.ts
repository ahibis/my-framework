import myComponent from "./component/component.ts";
import { signalContext } from "./core/signal.ts";

document
  .querySelector<HTMLDivElement>("#app")
  ?.appendChild(myComponent({}, {})!);

console.log(signalContext);
