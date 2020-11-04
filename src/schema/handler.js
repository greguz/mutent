import Herry from 'herry'

import { parseData } from './parse-data'

export class SchemaHandler {
  constructor(ajv, parsers, schema) {
    this._ajv = ajv
    this._parsers = parsers
    this._schema = schema

    this._validate = this._ajv.compile(schema)
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
    return parseData(this._ajv, data, this._schema, this._parsers)
  }
}
