import { createComponent, onMounted, useReactive } from "../core";
import html from "./component2.html?raw";

export default createComponent<{ test: string }>(html, ({ test }) => {
  const obj = useReactive({ test: "test", test1: "test1" });

  onMounted(() => {
    console.log("отрисовался элемент 2");
  });
  return { test, obj };
});
