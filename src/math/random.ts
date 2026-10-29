export type RandomFn = () => number;

export function mulberry32(seed: number): RandomFn {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let result = Math.imul(t ^ (t >>> 15), 1 | t);
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

export function sequenceRandom(values: readonly number[]): RandomFn {
  let index = 0;
  return () => {
    const value = values[index % values.length] ?? 0;
    index += 1;
    return value;
  };
}
