/**
 * @param {*} value
 * @returns {boolean}
 */
const isPrimitive = (value) => {
  const type = typeof value;
  return value === null || ['undefined', 'string', 'number', 'boolean', 'symbol', 'bigint'].includes(type);
};

/**
 * @param {*} obj
 * @param {string} keySearched
 * @param {string} currentPath
 * @returns {*}
 */
const deepSearchForKey = (obj, keySearched, currentPath = '') => {
  if (keySearched in obj) {
    console.log(`Key found at ${currentPath}`);
    return obj[keySearched];
  }
  const keys = Array.isArray(obj) ? obj.keys() : Object.keys(obj);
  for (const key of keys) {
    if (!isPrimitive(obj[key])) {
      const path = currentPath === '' ? key : `${currentPath}.${key}`;
      const pointer = deepSearchForKey(obj[key], keySearched, path);
      if (pointer) {
        return pointer;
      }
    }
  }
  return null;
};

module.exports = {
  isPrimitive,
  deepSearchForKey,
};
