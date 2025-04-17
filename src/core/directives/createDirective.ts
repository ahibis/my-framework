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

function createDirective(name: string, handleFunc: directiveFunc) {
  return {
    name,
    handleFunc,
  };
}

function getDirectivesMap(directives: ReturnType<typeof createDirective>[]) {
  return new Map(directives.map((directive) => [directive.name, directive]));
}

export { createDirective, evalFunc, getDirectivesMap };
