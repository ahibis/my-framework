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
  getDirectivesMap,
  type directiveFunc,
  type Directive,
};
