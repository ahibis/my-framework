type watchFunc = () => void;
class AnimationFrameLoop {
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
      this.funcsToExecute.forEach((watcher) => watcher());
      this.funcsToExecute.clear();
      this.executeLoop();
    });
  }
  constructor() {
    this.executeLoop();
  }
}
const animationFrameLoop = new AnimationFrameLoop();

function useAnimationFrame(callback: watchFunc) {
  animationFrameLoop.addRecord(callback);
}

export { useAnimationFrame };
