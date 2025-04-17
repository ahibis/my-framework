function throttle<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T {
  let lastCallTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;
    const remainingDelay = delay - timeSinceLastCall;

    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    if (timeSinceLastCall >= delay) {
      func(...args);
      lastCallTime = now;
    } else {
      timeoutId = setTimeout(() => {
        func(...args);
        lastCallTime = Date.now();
        timeoutId = null;
      }, remainingDelay);
    }
  } as T;
}
export { throttle };
