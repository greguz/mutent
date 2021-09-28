import Ajv from 'ajv'

import { MutentError } from './error'

import { createConstantKeyword } from './keywords/constant'
import { createInstanceofKeyword } from './keywords/instanceof'
import { createParseKeyword } from './keywords/parse'

function ensureFunction (value) {
  if (typeof value !== 'function') {
    throw new Error('Not a function')
  }
  return value
}

function defaultAjv (options) {
  return new Ajv({
    coerceTypes: true,
    removeAdditional: true,
    useDefaults: true,
    ...options
  })
}

function setAjvKeyword (ajv, definition) {
  const { keyword } = definition
  if (ajv.getKeyword(keyword) !== false) {
    throw new MutentError(
      'EMUT_RESERVED_KEYWORD',
      'This custom keyword definition is reserved',
      { ajv, keyword }
    )
  }
  ajv.addKeyword(definition)
}

export class Engine {
  static create (options) {
    return new Engine(options)
  }

  constructor ({ ajv, ajvOptions, constructors, parsers } = {}) {
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

    this.ajv = ajv || defaultAjv(ajvOptions)

    setAjvKeyword(this.ajv, createConstantKeyword())
    setAjvKeyword(this.ajv, createInstanceofKeyword(this._constructors))
    setAjvKeyword(this.ajv, createParseKeyword(this._parsers))
  }

  compile (schema) {
    return this.ajv.compile(schema.valueOf())
  }

  defineConstructor (key, fn) {
    this._constructors[key] = ensureFunction(fn)
    return this
  }

  defineParser (key, fn) {
    this._parsers[key] = ensureFunction(fn)
    return this
  }
}
