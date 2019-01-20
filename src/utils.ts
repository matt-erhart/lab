export const flatten = <T>(array: any[]): T[]  =>
  array.reduce((a, b) => a.concat(b), []);

const flattenDeep = <T>(array: any[]): T[] => {
    return Array.isArray(array)
    ? array.reduce((a, b) => a.concat(flattenDeep(b)), [])
    : [array]
}
  
