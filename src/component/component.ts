import component2 from "../component2/component2";
import {
  createComponent,
  useSignal,
  onMounted,
  useReactive,
  animationFrameLoop,
} from "../core";
import text from "./component.html?raw";

const myComponent = createComponent(text, () => {
  const name = useSignal("World");
  const someValue = useSignal(45);
  const someArr = useReactive([1, 2, 3]);
  function multiply() {
    someArr.forEach((value, index) => {
      someArr[index] = value * 2;
    });
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
