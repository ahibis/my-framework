import {
  createComponent,
  onMounted,
  useReactive,
  onUnmounted,
  onHydrated,
  toSignal,
  useSignal,
} from "../core";

import html from "./component2.html?raw";

export default createComponent<{ test: string }>(html, ({ test }) => {
  const obj = useReactive({
    test: "test",
    test1: "test1",
    test2: {
      test3: "test3",
    },
  });

  obj.test2 = {
    test3: "test6",
  };
  useSignal(() => {
    // console.log("obj.test2.test3", obj.test2.test3);
    // console.log(obj.test2);
  });
  onMounted(() => {
    console.log("отрисовался элемент 2");
  });
  onUnmounted(() => {
    console.log("удалился элемент 2");
  });
  return { test, obj };
});
