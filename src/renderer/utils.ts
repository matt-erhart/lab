//@ts-ignore
// see https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore
export const brewer12 = [
  "#a6cee3",
  "grey",
  "#1f78b4",
  "#b2df8a",
  "#33a02c",
  "#fb9a99",
  "#e31a1c",
  "#fdbf6f",
  "#ff7f00",
  "#cab2d6",
  "#6a3d9a",
  "#ffff99",
  "#b15928"
];

export function roundedToFixed(_float: number, _digits: number){
  var rounder = Math.pow(10, _digits);
  return (Math.round(_float * rounder) / rounder).toFixed(_digits);
}

export const zeroPad = (aNumber: number, nDigits: number) => {
  const str = String(aNumber);
  const nZeros =  nDigits - str.length;
  if (nZeros <= 0) {
    return str;
  } else {
    return (
      Array(nZeros)
        .fill(0)
        .join("") + str
    );
  }
};


export const unique = arr => {
  const uniq = [...new Set(arr)];
  return uniq.sort();
};

export const mode = (array: (string | number)[]) => {
  if (array.length == 0) return null;
  var modeMap = {};
  var maxEl = array[0],
    maxCount = 1;
  for (var i = 0; i < array.length; i++) {
    var el = array[i];
    if (modeMap[el] == null) modeMap[el] = 1;
    else modeMap[el]++;
    if (modeMap[el] > maxCount) {
      maxEl = el;
      maxCount = modeMap[el];
    }
  }
  return maxEl;
};

export const flatten = <T>(array: any[]): T[] =>
  array.reduce((a, b) => a.concat(b), []);

const flattenDeep = <T>(array: any[]): T[] => {
  return Array.isArray(array)
    ? array.reduce((a, b) => a.concat(flattenDeep(b)), [])
    : [array];
};

export const midPoint = (x1: number, y1: number, x2: number, y2: number) => {
  return [(x1 + x2) / 2, (y1 + y2) / 2];
};

export const dist = (x1: number, y1: number, x2: number, y2: number) => {
  return Math.hypot(x2 - x1, y2 - y1);
};

export const getRectEdges = (
  x: number,
  y: number,
  width: number,
  height: number
) => {
  return {
    minX: x,
    minY: y,
    maxX: x + width,
    maxY: y + height
  };
};

export const getRectCoords = (
  x: number,
  y: number,
  width: number,
  height: number
) => {
  //l = left, r = right, t = top, b = bottom
  return {
    lt: [x, y],
    rt: [x + width, y],
    lb: [x, y + height],
    rb: [x + width, y + height]
  };
};

export const min = (arr: number[]) => {
  return arr.reduce(
    (all, val, ix) => {
      if (all.min < val) {
        return all;
      } else {
        return { min: val, index: ix };
      }
    },
    { min: Infinity, index: -1 }
  );
};

export const sortBy = (key: number | string) => {
  return (a, b) => (a[key] > b[key] ? 1 : b[key] > a[key] ? -1 : 0);
};

/**
 * from https://github.com/datorama/ts-safe-access/blob/master/src/ts-safe-access.ts
 * @param {T} obj
 * @param {(obj: T) => R} fn
 * @param {R} defaultValue
 * @param {boolean} excludeNull
 * @returns {R}
 *
const data = {its: {really: {really: {really: {nested : undefined}}}}, nested: {value: null}};
const result = get(data, data => data.its.really.really.really.nested, 'defaultValue');
 */
export function get<T, R>(
  obj: T,
  fn: (obj: T) => R,
  defaultValue?: R,
  excludeNull = false
) {
  try {
    let result = fn(obj);
    result = excludeNull ? (result === null ? defaultValue : result) : result;
    return result === undefined ? defaultValue : result;
  } catch (err) {
    return defaultValue;
  }
}
