export const deepFlattenToObject = (obj: any, prefix = '') => {
  return Object.keys(obj).reduce((acc: any, k) => {
    const pre: string = prefix.length ? prefix + '_' : '';
    if (typeof obj[k] === 'object' && obj[k] !== null) {
      Object.assign(acc, deepFlattenToObject(obj[k], pre + k));
    } else {
      acc[pre + k] = obj[k];
    }
    return acc;
  }, {});
};
