/** Evaluated before student code. Only a bounded string ever crosses from isolate to host. */
export const resultSerializerSource = `(() => {
  const stringify = JSON.stringify, keys = Object.keys, array = Array.isArray;
  const prototype = Object.getPrototypeOf, plain = Object.prototype, same = Object.is;
  const seen = new WeakSet(), has = seen.has.bind(seen), add = seen.add.bind(seen), remove = seen.delete.bind(seen);
  let nodes = 0;
  const limit = text => { if (text.length > 65536) throw new Error('Result limit exceeded'); return text; };
  const encode = (value, depth) => {
    if (++nodes > 10000 || depth > 100) throw new Error('Result limit exceeded');
    if (value === null) return '["null"]';
    const type = typeof value;
    if (type === 'undefined') return '["undefined"]';
    if (type === 'number') return '["number",' + stringify(same(value, -0) ? '-0' : '' + value) + ']';
    if (type === 'bigint') return '["bigint",' + stringify('' + value) + ']';
    if (type === 'boolean') return '["boolean",' + value + ']';
    if (type === 'string') return limit('["string",' + stringify(value) + ']');
    if (type !== 'object' || has(value)) throw new Error('Result cannot be serialized');
    const isArray = array(value);
    if (!isArray && prototype(value) !== plain && prototype(value) !== null) throw new Error('Result cannot be serialized');
    add(value);
    const names = isArray ? null : keys(value);
    const length = isArray ? value.length : names.length;
    if (length > 10000) throw new Error('Result limit exceeded');
    let text = isArray ? '["array",[' : '["object",[';
    for (let i = 0; i < length; ++i) {
      if (i) text += ',';
      text += isArray ? encode(value[i], depth + 1) : '[' + stringify(names[i]) + ',' + encode(value[names[i]], depth + 1) + ']';
      limit(text);
    }
    remove(value);
    return limit(text + ']]');
  };
  return value => encode(value, 0);
})()`

type Encoded = [string, any?]
export function decodeIsolateValue(encoded: string): unknown {
  const decode = ([kind, value]: Encoded): unknown => {
    switch (kind) {
      case 'null':
        return null
      case 'undefined':
        return undefined
      case 'number':
        return Number(value)
      case 'bigint':
        return BigInt(value)
      case 'boolean':
      case 'string':
        return value
      case 'array':
        return (value as Encoded[]).map(decode)
      case 'object':
        return Object.fromEntries(
          (value as Array<[string, Encoded]>).map(([key, child]) => [key, decode(child)])
        )
      default:
        throw new Error('Invalid serialized result')
    }
  }
  return decode(JSON.parse(encoded))
}
