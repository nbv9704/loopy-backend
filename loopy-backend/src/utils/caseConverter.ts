/**
 * Utility to convert between camelCase and snake_case
 */

export const toCamel = (str: string): string => {
  return str.replace(/([-_][a-z])/ig, ($1) => {
    return $1.toUpperCase()
      .replace('-', '')
      .replace('_', '')
  })
}

export const toSnake = (str: string): string => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}

export const keysToCamel = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => keysToCamel(v))
  } else if (obj && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [toCamel(key)]: keysToCamel(obj[key]),
      }),
      {},
    )
  }
  return obj
}

export const keysToSnake = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => keysToSnake(v))
  } else if (obj && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [toSnake(key)]: keysToSnake(obj[key]),
      }),
      {},
    )
  }
  return obj
}
