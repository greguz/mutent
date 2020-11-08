import Ajv from 'ajv'
import Herry from 'herry'

function describeParser(value) {
  if (typeof value === 'string') {
    return {
      key: value,
      args: []
    }
  } else if (Array.isArray(value)) {
    return {
      key: value[0],
      args: value.slice(1)
    }
  } else {
    const key = Object.keys(value)[0]
    return {
      key,
      args: value[key]
    }
  }
}

function defaultAjv() {
  return new Ajv({
    coerceTypes: true,
    nullable: true,
    removeAdditional: true,
    useDefaults: true
  })
}

function setAjvKeyword(ajv, keyword, definition) {
  if (ajv.getKeyword(keyword)) {
    throw new Herry(
      'EMUT_RESERVED_KEYWORD',
      'This custom keyword definition is reserved',
      { ajv, keyword }
    )
  }
  ajv.addKeyword(keyword, definition)
}

function hasOwnProperty(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key)
}

class Schema {
  constructor(schema, validate) {
    this._schema = schema
    this._validate = validate
  }

  validate(
    data,
    code = 'EMUT_INVALID_DATA',
    message = 'Invalid data detected'
  ) {
    if (!this._validate(data)) {
      throw new Herry(code, message, {
        data,
        errors: this._validate.errors,
        schema: this._schema
      })
    }
  }

  parse(data, code, message) {
    this.validate(data, code, message)
    return data
  }
}

class Engine {
  constructor({ ajv, constructors, parsers } = {}) {
    this._constructors = {
      Array,
      Buffer,
      Date,
      Function,
      Number,
      Object,
      Promise,
      RegExp,
      String,
      ...constructors
    }

    this._parsers = { ...parsers }

    this._ajv = ajv || defaultAjv()

    setAjvKeyword(this._ajv, 'instanceof', {
      errors: false,
      metaSchema: {
        type: 'string'
      },
      validate: (schema, data) => {
        return hasOwnProperty(this._constructors, schema)
          ? data instanceof this._constructors[schema]
          : false
      }
    })

    setAjvKeyword(this._ajv, 'parse', {
      errors: false,
      modifying: true,
      metaSchema: {
        type: ['array', 'string', 'object'],
        items: [{ type: 'string' }],
        minItems: 1,
        additionalItems: true,
        additionalProperties: { type: 'array' },
        minProperties: 1,
        maxProperties: 1
      },
      compile: schema => {
        return (data, path, parentData, property) => {
          const { key, args } = describeParser(schema)
          const fn = this._parsers[key]
          const ok = typeof fn === 'function'
          if (ok) {
            parentData[property] = fn(data, ...args)
          }
          return ok
        }
      }
    })
  }

  compile(schema) {
    return new Schema(schema, this._ajv.compile(schema))
  }

  defineConstructor(key, fn) {
    this._constructors[key] = fn
    return this
  }

  defineParser(key, fn) {
    this._parsers[key] = fn
    return this
  }
}

export function createEngine(settings) {
  return new Engine(settings)
}
