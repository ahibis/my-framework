import myComponent from "./component/component.ts";
import { componentsContext, mount } from "./core/index.ts";
mount(myComponent({}, {})!, document.querySelector("#app")!);
console.log(componentsContext);
