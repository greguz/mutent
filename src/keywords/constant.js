import get from 'lodash.get'

const symbol = Symbol('mutent_constants')

export function writeConstants(object, constants) {
  if (typeof object === 'object' && object !== null) {
    Object.defineProperty(object, symbol, {
      configurable: true,
      value: constants
    })
  }
  return object
}

export function readConstants(object) {
  return object[symbol] || []
}

export function pushConstant(object, path, value) {
  const constant = { path, value }
  if (Object.prototype.hasOwnProperty.call(object, symbol)) {
    object[symbol].push(constant)
  } else {
    writeConstants(object, [constant])
  }
}

export function isConstantValid({ path, value }, data) {
  return get(data, path) === value
}

function yes() {
  return true
}

export function createConstantKeyword() {
  return {
    keyword: 'constant',
    errors: false,
    metaSchema: {
      type: 'boolean'
    },
    compile(schema) {
      if (schema !== true) {
        return yes
      }

      return function validate(data, ctx) {
        pushConstant(ctx.rootData, ctx.dataPath.substring(1), data)
        return true
      }
    }
  }
}
