import myComponent from "./component/component.ts";
import { mount } from "./core/index.ts";
mount(myComponent({}, {})!, document.querySelector("#app")!);
