import Ajv from 'ajv'
import Herry from 'herry'

import { JSONSchema7Definition } from './definition-type'
import { parseData } from './parse-data'
import { ParseFunction, ParseFunctions } from './parse-value'

export interface Constructors {
  [key: string]: Function
}

export interface SchemaHandlerSettings {
  ajv?: Ajv.Ajv
  constructors?: Constructors
  parseFunctions?: ParseFunctions
}

export class SchemaHandler {
  private _ajv: Ajv.Ajv
  private _constructors: Constructors
  private _parseFunctions: ParseFunctions
  private _permitConstructors: boolean
  private _schema: JSONSchema7Definition
  private _validate: Ajv.ValidateFunction

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

    this._permitConstructors = !this._ajv.getKeyword('instanceof')
    if (this._permitConstructors) {
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
    }

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

    this._validate = this._ajv.compile(schema)
  }

  public defineConstructor(key: string, Constructor: Function): this {
    if (!this._permitConstructors) {
      throw new Herry(
        'EMUT_CONSTRUCTORS_DISABLED',
        'Custom constructors definition disabled'
      )
    }
    this._constructors[key] = Constructor
    return this
  }

  public defineParser(key: string, parser: ParseFunction): this {
    this._parseFunctions[key] = parser
    return this
  }

  public compute(data: any): any {
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
