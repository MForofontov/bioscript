export function integer(text: string, name: string, minimum = 0): number {
  const value = Number(text);
  if (!/^[+-]?\d+$/.test(text) || !Number.isSafeInteger(value) || value < minimum)
    throw new Error(`Invalid ${name}: expected an integer >= ${minimum}`);
  return value;
}

export function numeric(text: string, name: string): number {
  const value = Number(text);
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(text) || !Number.isFinite(value))
    throw new Error(`Invalid ${name}: expected a finite number`);
  return value;
}
