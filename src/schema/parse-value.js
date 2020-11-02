import Herry from 'herry'

function bindFunction(fn, ...args) {
  return args.length > 0 ? value => fn(value, ...args) : fn
}

function resolveKey(functions, key) {
  const fn = functions[key]
  if (!fn) {
    throw new Herry('EMUT_EXPECTED_PARSER', 'Expected parse function', { key })
  }
  return fn
}

function handleArray(functions, parse) {
  return bindFunction(resolveKey(functions, parse[0]), parse.slice(1))
}

function handleObject(functions, parse) {
  const key = Object.keys(parse)[0]
  return bindFunction(resolveKey(functions, key), parse[key])
}

function getParseFunction(functions, parse) {
  if (typeof parse === 'function') {
    return parse
  } else if (typeof parse === 'string') {
    return resolveKey(functions, parse)
  } else if (Array.isArray(parse)) {
    return handleArray(functions, parse)
  } else {
    return handleObject(functions, parse)
  }
}

export function parseValue(value, parse, functions = {}) {
  return getParseFunction(functions, parse)(value)
}
