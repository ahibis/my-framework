import component2 from "../component2/component2";
import { createComponent, useSignal, onMounted, useReactive } from "../core";
import text from "./component.html?raw";

const myComponent = createComponent(text, () => {
  const name = useSignal("World");
  const someValue = useSignal(45);
  const someArr = useSignal([1, 2, 3]);
  function multiply() {
    someArr((arr) => arr.map((value) => value * 2));
  }

  const fullName = useSignal(() => {
    console.log("fullName");
    return name() + " Вася";
  });

  function click() {
    name((value) => value + 1);
  }
  onMounted(() => {
    console.log("отрисовался");
  });

  const arr = useReactive([1, 2, 3]);
  useSignal(() => {
    console.log(arr);
    console.log(arr.length);
    console.log("эм");
  });
  arr.push(4);
  arr.push(4);

  return {
    name,
    fullName,
    click,
    component2,
    someValue,
    someArr,
    multiply,
  };
});

export default myComponent;
