import myComponent from "./component/component.ts";

document
  .querySelector<HTMLDivElement>("#app")
  ?.appendChild(myComponent({}, {})!);
