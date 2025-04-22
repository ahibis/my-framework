function memo<T1 extends unknown[], T2>(func: (...args2: T1) => T2) {
  const CacheArgs = new Map<unknown, string>();
  const Cache = new Map<string, T2>();
  return (...args: T1) => {
    let keyArgs = "";
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (CacheArgs.has(arg)) {
        keyArgs += CacheArgs.get(arg)! + ";";
      } else {
        const key = CacheArgs.size.toString();
        CacheArgs.set(arg, key);
        keyArgs += key + ";";
      }
    }
    if (Cache.has(keyArgs)) {
      return Cache.get(keyArgs)!;
    } else {
      const res = func(...args);
      Cache.set(keyArgs, res);
      return res;
    }
  };
}
export { memo };
