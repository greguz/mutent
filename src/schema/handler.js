import Ajv from 'ajv'
import Herry from 'herry'

import { parseData } from './parse-data'

export class SchemaHandler {
  constructor(schema, { ajv, constructors, parseFunctions } = {}) {
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

    this._parseFunctions = parseFunctions || {}

    this._schema = schema

    this._ajv =
      ajv ||
      new Ajv({
        coerceTypes: true,
        nullable: true,
        removeAdditional: true,
        useDefaults: true
      })

    this._ajv.addKeyword('instanceof', {
      errors: false,
      metaSchema: {
        type: 'string'
      },
      validate: (schema, data) => {
        return Object.prototype.hasOwnProperty.call(this._constructors, schema)
          ? data instanceof this._constructors[schema]
          : false
      }
    })

    this._ajv.addKeyword('parse', {
      errors: false,
      validate(schema) {
        if (Array.isArray(schema)) {
          return schema.length >= 1 && typeof schema[0] === 'string'
        } else if (typeof schema === 'object' && schema !== null) {
          const keys = Object.keys(schema)
          return keys.length === 1 && Array.isArray(schema[keys[0]])
        } else {
          return typeof schema === 'function' || typeof schema === 'string'
        }
      }
    })

    this._validate = this._ajv.compile(schema)
  }

  defineConstructor(key, Constructor) {
    this._constructors[key] = Constructor
    return this
  }

  defineParser(key, parser) {
    this._parseFunctions[key] = parser
    return this
  }

  compute(data) {
    if (!this._validate(data)) {
      throw new Herry('EMUT_INVALID_DATA', 'Invalid data detected', {
        data,
        errors: this._validate.errors,
        schema: this._schema
      })
    }
    return parseData(this._ajv, data, this._schema, this._parseFunctions)
  }
}
