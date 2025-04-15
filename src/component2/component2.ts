import { useComponent } from "../core";
import html from "./component2.html?raw";

export default useComponent<{ test: string }>(html, ({ test }) => {
  return { test };
});
