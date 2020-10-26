import Ajv from 'ajv'
import Herry from 'herry'

import { JSONSchema7Definition } from './definition-type'
import { parseData } from './parse-data'
import { ParseFunction, ParseFunctions } from './parse-value'
import { createPartialSchema } from './partial'

export interface Constructors {
  [key: string]: Function
}

export interface SchemaHandlerSettings {
  ajv?: Ajv.Ajv
  constructors?: Constructors
  parseFunctions?: ParseFunctions
}

export interface SchemaHandlerOptions {
  isPartial?: boolean
}

export class SchemaHandler {
  private _ajv: Ajv.Ajv
  private _constructors: Constructors
  private _parseFunctions: ParseFunctions
  private _schema: JSONSchema7Definition
  private _validatePartial: Ajv.ValidateFunction
  private _validateRequired: Ajv.ValidateFunction

  constructor(
    schema: JSONSchema7Definition,
    { ajv, constructors, parseFunctions }: SchemaHandlerSettings = {}
  ) {
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
      validate: (schema: string, data: any) => {
        return this._constructors.hasOwnProperty(schema)
          ? data instanceof this._constructors[schema]
          : false
      }
    })

    this._ajv.addKeyword('parse', {
      errors: false,
      validate(schema: any) {
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

    this._validatePartial = this._ajv.compile(createPartialSchema(schema))
    this._validateRequired = this._ajv.compile(schema)
  }

  public defineConstructor(key: string, Constructor: Function): this {
    this._constructors[key] = Constructor
    return this
  }

  public defineParser(key: string, parser: ParseFunction): this {
    this._parseFunctions[key] = parser
    return this
  }

  public compute(data: any, { isPartial }: SchemaHandlerOptions = {}): any {
    if (isPartial) {
      if (!this._validatePartial(data)) {
        throw new Herry('EMUT_INVALID_DATA', 'Invalid data detected', {
          data,
          partial: true,
          errors: this._validatePartial.errors,
          schema: this._schema
        })
      }
    } else {
      if (!this._validateRequired(data)) {
        throw new Herry('EMUT_INVALID_DATA', 'Invalid data detected', {
          data,
          partial: false,
          errors: this._validateRequired.errors,
          schema: this._schema
        })
      }
    }

    return parseData(this._ajv, data, this._schema, this._parseFunctions)
  }
}
