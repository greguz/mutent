import Herry from 'herry'

function resolveKey(functions, key) {
  const fn = functions[key]
  if (!fn) {
    throw new Herry('EMUT_EXPECTED_PARSER', 'Expected parse function', { key })
  }
  return fn
}

function describeParser(parse) {
  if (typeof parse === 'string') {
    return {
      key: parse,
      args: []
    }
  } else if (Array.isArray(parse)) {
    return {
      key: parse[0],
      args: parse.slice(1)
    }
  } else {
    const key = Object.keys(parse)[0]
    return {
      key,
      args: parse[key]
    }
  }
}

export function parseValue(value, parse, functions = {}) {
  const { key, args } = describeParser(parse)
  const fn = resolveKey(functions, key)
  return fn(value, ...args)
}
