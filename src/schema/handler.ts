import Ajv from 'ajv'
import Herry from 'herry'

import { MutentSchema } from './definition-type'
import { parseData } from './parse-data'
import { ParseFunction, ParseFunctions } from './parse-value'

export interface Constructors {
  [key: string]: Function
}

export interface SchemaHandlerSettings {
  ajv?: Ajv. Ajv
  constructors?: Constructors
  parseFunctions?: ParseFunctions
}

export class SchemaHandler {
  private _ajv: Ajv.Ajv
  private _constructors: Constructors
  private _parseFunctions: ParseFunctions
  private _permitConstructors: boolean
  private _schema: MutentSchema
  private _validate: Ajv.ValidateFunction

  constructor (
    schema: MutentSchema,
    { ajv, constructors, parseFunctions }: SchemaHandlerSettings
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

    this._ajv = ajv || new Ajv({
      coerceTypes: true,
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
          return Object.prototype.hasOwnProperty.call(this._constructors, schema)
            ? data instanceof this._constructors[schema]
            : false
        }
      })
    }

    this._ajv.addKeyword('parse', {
      errors: false,
      validate (schema: any) {
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

  public defineConstructor (key: string, Constructor: Function): this {
    if (!this._permitConstructors) {
      throw new Herry(
        'EMUT_CONSTRUCTORS_DISABLED',
        'Custom constructors definition disabled'
      )
    }
    if (Object.prototype.hasOwnProperty.call(this._constructors, key)) {
      throw new Herry(
        'EMUT_CONSTRUCTOR_EXISTS',
        'This constructor is already defined',
        { key }
      )
    }
    this._constructors[key] = Constructor
    return this
  }

  public defineParser (key: string, parser: ParseFunction): this {
    if (Object.prototype.hasOwnProperty.call(this._parseFunctions, key)) {
      throw new Herry(
        'EMUT_PARSER_EXISTS',
        'This parser is already defined',
        { key }
      )
    }
    this._parseFunctions[key] = parser
    return this
  }

  public compute (data: any) {
    if (!this._validate(data)) {
      throw new Herry(
        'EMUT_INVALID_DATA',
        'Invalid data detected',
        { errors: this._validate.errors }
      )
    }
    return parseData(data, this._schema, this._parseFunctions)
  }
}
