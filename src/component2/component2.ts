import { createComponent, onMounted } from "../core";
import html from "./component2.html?raw";

export default createComponent<{ test: string }>(html, ({ test }) => {
  onMounted(() => {
    console.log("отрисовался элемент 2");
  });
  return { test };
});
