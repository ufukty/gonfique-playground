type callable = (...args: unknown[]) => void;

export function aFrame<T extends callable>(f: T) {
  let argsForNext: unknown[] | undefined;

  const handler = () => {
    if (argsForNext) {
      const args = argsForNext;
      argsForNext = undefined;
      f(...args);
    }
  };

  return (...args: Parameters<T>) => {
    const unset = argsForNext === undefined;
    argsForNext = args;
    if (unset) requestAnimationFrame(handler);
  };
}
