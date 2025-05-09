import { HtmlElementWithParams } from "./hydrateElement";

class ComponentState {
  onMounted: (() => void)[] = [];
  onUnmounted: (() => void)[] = [];
  onHydrate: ((element: HtmlElementWithParams) => void)[] = [];
}

class ComponentsContext {
  componentStateStack: ComponentState[] = [];
  getCurrentComponentState() {
    if (this.componentStateStack.length == 0) throw new Error("no component");
    return this.componentStateStack[this.componentStateStack.length - 1];
  }

  mountedComponentState: ComponentState[] = [];
  addMountedComponentState(state: ComponentState) {
    this.mountedComponentState.push(state);
  }
  startHookComponentState() {
    return this.mountedComponentState.length;
  }
  stopHookComponentState(offset: number) {
    return this.mountedComponentState.slice(
      offset,
      this.mountedComponentState.length
    );
  }
}
const componentsContext = new ComponentsContext();

function getCurrentComponentState() {
  return componentsContext.getCurrentComponentState();
}

export {
  ComponentsContext,
  componentsContext,
  ComponentState,
  getCurrentComponentState,
};
