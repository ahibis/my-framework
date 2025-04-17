type directiveFunc = (
  child: HTMLElement,
  ctx: Record<string, unknown>,
  value: string
) => directiveResult | void;
interface directiveResult {
  childCtx?: Record<string, unknown>;
  stopHandleChild?: boolean;
  stopHandleAttributes?: boolean;
  stopHandleChildren?: boolean;
}
function evalFunc(code: string) {
  return new Function("ctx", `with(ctx){return ${code}}`);
}

type Directive = {
  name: string;
  handleFunc: directiveFunc;
};

function createDirective(name: string, handleFunc: directiveFunc) {
  const directive = {
    name,
    handleFunc,
  };
  return directive;
}
function getDirectivesMap(directives: Directive[]) {
  return new Map(directives.map((directive) => [directive.name, directive]));
}

export { dBind } from "./dBind";
export {
  createDirective,
  evalFunc,
  getDirectivesMap,
  type directiveFunc,
  type Directive,
};
