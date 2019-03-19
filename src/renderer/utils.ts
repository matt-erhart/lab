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

export const logPropChanges = (prevProps, props) => {
  Object.keys(props).forEach(key => {
    if (props[key] !== prevProps[key]) {
      console.log(key, "changed from", prevProps[key], "to", props[key]);
    }
  });
};

export function getRegexIndexes(str: string, regex: RegExp): number[] {
  var re = regex;
  let match;
  let results = [];
  do {
    match = re.exec(str);
    if (match) {
      results.push(match.index);
    }
  } while (match);
  return results;
}

export const getSelectionRange = () => {
  const selection = window.getSelection();
  const range = selection.anchorNode
    ? selection.getRangeAt(0).cloneRange() //clone or ref won't update
    : undefined;
  return { selection, range };
};

export type NestedPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer R>
    ? Array<NestedPartial<R>>
    : NestedPartial<T[K]>
};

import uuidv1 = require("uuid/v1");
import { RegExpLiteral } from "estree";

export const mergeDefaults = <T>(defaults: T, data = {} as Partial<T>) => {
  return {
    ...defaults,
    id: uuidv1(),
    ...data
  } as T;
};

export const makeGridOfBoxes = (nRows, nCols, width, height, gap) => {
  const rows = [...Array(nRows).keys()];
  const cols = [...Array(nCols).keys()];
  let x = 0;
  let y = 0;
  let boxes = [];
  let id = 0;
  for (let rowNum of rows) {
    if (rowNum > 0) x += width + gap;
    y = 0;
    for (let colNum of cols) {
      if (colNum > 0) y += height + gap;
      boxes.push({ id: rowNum + "" + colNum + "" + id++, x, y, width, height });
    }
  }
  return boxes;
};

export const withUid = (prefix = "", obj = {}) => {
  return { id: prefix + "-" + uuidv1(), ...obj };
};

export function roundedToFixed(_float: number, _digits: number) {
  var rounder = Math.pow(10, _digits);
  return (Math.round(_float * rounder) / rounder).toFixed(_digits);
}

export const zeroPad = (aNumber: number, nDigits: number) => {
  const str = String(aNumber);
  const nZeros = nDigits - str.length;
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

export const getBoxEdges = (
  left: number,
  top: number,
  width: number,
  height: number
) => {
  return {
    minX: left,
    minY: top,
    maxX: left + width,
    maxY: top + height
  };
};

export const isBoxInBox = (bigBox: ReturnType<typeof getBoxEdges>) => (
  smallBox: ReturnType<typeof getBoxEdges>
) => {
  const minXOk = smallBox.minX >= bigBox.minX;
  const maxXOk = smallBox.maxX <= bigBox.maxX;
  const minYOk = smallBox.minY >= bigBox.minY;
  const maxYOk = smallBox.maxY <= bigBox.maxY;
  return minXOk && maxXOk && minYOk && maxYOk;
};

export const isBoxPartlyInBox = (bigBox: ReturnType<typeof getBoxEdges>) => (
  smallBox: ReturnType<typeof getBoxEdges>
) => {
  const minXOk = smallBox.minX <= bigBox.maxX && smallBox.minX >= bigBox.minX;
  const maxXOk = smallBox.maxX >= bigBox.minX && smallBox.maxX <= bigBox.maxX;

  const minYOk = smallBox.minY <= bigBox.maxY && smallBox.minY >= bigBox.minY;
  const maxYOk = smallBox.maxY >= bigBox.minY && smallBox.maxY <= bigBox.maxY;

  return (minXOk || maxXOk) && (minYOk || maxYOk)
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
