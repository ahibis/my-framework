type watchFunc = () => void;
class AnimationFrameLoop {
  domUpdateResolvers: (() => void)[] = [];
  addDomUpdatePromise(promise: () => void) {
    this.domUpdateResolvers.push(promise);
  }
  funcsToExecute: Set<watchFunc> = new Set();
  addRecord(func: watchFunc) {
    this.funcsToExecute.add(func);
  }
  addRecords(funcs: watchFunc[]) {
    funcs.forEach((func) => this.funcsToExecute.add(func));
  }
  executeLoop() {
    requestAnimationFrame(() => {
      if (this.funcsToExecute.size == 0) {
        this.executeLoop();
        return;
      }
      console.time("frame update");
      this.funcsToExecute.forEach((watcher) => watcher());
      this.funcsToExecute.clear();
      this.domUpdateResolvers.forEach((resolver) => resolver());
      this.domUpdateResolvers = [];
      console.timeEnd("frame update");
      this.executeLoop();
    });
  }
  constructor() {
    this.executeLoop();
  }
}
const animationFrameLoop = new AnimationFrameLoop();

function onAnimationFrame(callback: watchFunc) {
  animationFrameLoop.addRecord(callback);
}
function awaitDOMUpdate() {
  return new Promise<void>((resolve) =>
    animationFrameLoop.addDomUpdatePromise(resolve)
  );
}

export { onAnimationFrame, awaitDOMUpdate, animationFrameLoop };
