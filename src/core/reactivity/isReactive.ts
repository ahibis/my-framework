function isReactive<T extends object>(value: T) {
  return (value as T & { __target__?: unknown }).__target__ !== undefined;
}
export { isReactive };
