function autoReturn<T extends (...args: any) => void>(
  f: T,
  ...args: Parameters<T>
) {
  const code = f.toString();
  const params = code
    .match(/(const|let|var)\s+\w+/g)!
    .map((a) => a.split(/\s+/)[1])
    .toString();
  const newCode = code + `\nreturn {${params}};\n}`;
  return new Function(newCode, ...args) as (
    ...args: Parameters<T>
  ) => Record<string, unknown>;
}
export { autoReturn };
