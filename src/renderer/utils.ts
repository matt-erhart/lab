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

/**
 *
 * @param {T} obj
 * @param {(o: T) => R} getFn
 * @returns {any}
 */
export function has<T, R>(obj: T, getFn: (o: T) => R) {
  try {
    let result = getFn(obj);
    return result !== undefined;
  } catch (err) {
    return false;
  }
}
export const inFirstNotSecondArray = (twoArrays: any[][]) =>
  twoArrays.reduce(function(a, b) {
    return a.filter(function(value) {
      return !b.includes(value);
    });
  });

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

export type Box = {
  left: number;
  top: number;
  width: number;
  height: number;
  offsetX?: number;
  offsetY?: number;
};

export type BoxEdges = {
  minX: number; // left
  minY: number; // top
  maxX: number; // right
  maxY: number; // bottom
};

export const getBoxEdges = (box: Box): BoxEdges => {
  const { left, top, width, height } = box;
  return {
    minX: left,
    minY: top,
    maxX: left + width,
    maxY: top + height
  };
};

export const isBoxInBox = (bigBox: BoxEdges) => (smallBox: BoxEdges) => {
  const minXOk = smallBox.minX >= bigBox.minX;
  const maxXOk = smallBox.maxX <= bigBox.maxX;
  const minYOk = smallBox.minY >= bigBox.minY;
  const maxYOk = smallBox.maxY <= bigBox.maxY;
  return minXOk && maxXOk && minYOk && maxYOk;
};

export const isBoxPartlyInBox = (bigBox: BoxEdges) => (smallBox: BoxEdges) => {
  const minXOk = smallBox.minX <= bigBox.maxX && smallBox.minX >= bigBox.minX;
  const maxXOk = smallBox.maxX >= bigBox.minX && smallBox.maxX <= bigBox.maxX;

  const minYOk = smallBox.minY <= bigBox.maxY && smallBox.minY >= bigBox.minY;
  const maxYOk = smallBox.maxY >= bigBox.minY && smallBox.maxY <= bigBox.maxY;

  return (minXOk || maxXOk) && (minYOk || maxYOk);
};

// type BoxEdgesDiffs = { label: string; dist: number; diff: number }[];

export const getEdgeDiffs = (box1: BoxEdges) => (box2: BoxEdges): BoxEdges => {
  // box1 - box 2
  const diffs = Object.entries(box1).reduce(
    (all, edge) => {
      const [key, val] = edge;
      all = { ...all, [key]: val - box2[key]};
      return all;
    },
    {} as BoxEdges
  );
  return diffs;
};

export const moreSpaceIs = (edgeDiffs: BoxEdges) => {
  return {
    down: Math.abs(edgeDiffs.minY) < edgeDiffs.maxY,
    right: Math.abs(edgeDiffs.minX) < edgeDiffs.maxX
  }
}

export const getElementBox = (el): Box => {
  // e.g. from mouse event:   event.currentTarget
  const { left, top, width, height } = el.getBoundingClientRect();
  return {
    left,
    top,
    width,
    height
  };
};

export const getClientBox = () => {
  // entire area to render things. doesn't include scroll bars.
  const { clientHeight, clientWidth } = document.documentElement;
  return { left: 0, top: 0, height: clientHeight, width: clientWidth };
};

// export const getSpaceAround = (outerBox: BoxEdges) => (innerBox: BoxEdges) => {
//   // box1 - box2
//   const keys = ["minX", "maxX", "minY", "maxY"];
//   const renameKeys = ["spaceLeft", "spaceRight", "spaceUp", "spaceDown"];
//   const spaceAround = keys.reduce(
//     (all, key, ix) => {
//       const diff = outerBox[key] - innerBox[key];
//       let validInner;
//       if (["minX", "minY"].includes(key)) {
//         validInner = diff < 0;
//       } else {
//         validInner = diff > 0;
//       }
//       all = {
//         ...all,
//         [renameKeys[ix]]: { dist: Math.abs(diff), diff, validInner },
//         validInner: all.validInner && validInner
//       };

//       return all;
//     },
//     { validInner: true, spaceLeft: number, spaceRight: }
//   );

//   return spaceAround;

//   // let differences = keys.map((key, ix) => {
//   //   const diff = outerBox[key] - innerBox[key];
//   //   return {
//   //     label: renameKeys[ix],
//   //     dist: Math.abs(diff),
//   //     diff: diff
//   //   };
//   // });
//   // differences = differences.sort((a, b) => {
//   //   return b.dist - a.dist;
//   // });

//   // const asProperties = differences.reduce((all, )

//   // return {sortedByDist: differences, moreSpaceup:};
// };

const constrainBox = (stayInside: BoxEdges) => {};

// todo: refactor pagesvg to use box equivilents
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
