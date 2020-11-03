import Herry from 'herry'

import { parseData } from './parse-data'

export class SchemaHandler {
  constructor(ajv, parseFunctions, schema) {
    this._ajv = ajv
    this._parseFunctions = parseFunctions
    this._schema = schema

    this._validate = this._ajv.compile(schema)
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
