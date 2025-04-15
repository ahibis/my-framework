import component2 from "../component2/component2";
import { useComponent, useSignal } from "../core";
import text from "./component.html?raw";

const myComponent = useComponent(text, () => {
  const name = useSignal("World");
  const someValue = useSignal(45);
  const someArr = useSignal([1, 2, 3]);
  function multiply() {
    someArr((arr) => arr.map((value) => value * 2));
  }

  const fullName = useSignal(() => name() + " Вася");
  const nameWithValue = useSignal(() => name() + " " + someValue());

  function click() {
    name((value) => value + 1);
  }
  return {
    name,
    fullName,
    click,
    component2,
    someValue,
    nameWithValue,
    someArr,
    multiply,
  };
});

export default myComponent;
