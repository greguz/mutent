import Ajv from 'ajv'

import { MutentError } from './error'

import { createConstantKeyword } from './keywords/constant'
import { createInstanceofKeyword } from './keywords/instanceof'
import { createParseKeyword } from './keywords/parse'

function ensureFunction(value) {
  if (typeof value !== 'function') {
    throw new Error('Not a function')
  }
  return value
}

function defaultAjv(options) {
  return new Ajv({
    coerceTypes: true,
    removeAdditional: true,
    useDefaults: true,
    ...options
  })
}

function setAjvKeyword(ajv, definition) {
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

class Engine {
  constructor({ ajv, ajvOptions, constructors, parsers } = {}) {
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
    this._ajv = ajv || defaultAjv(ajvOptions)

    setAjvKeyword(this._ajv, createConstantKeyword())
    setAjvKeyword(this._ajv, createInstanceofKeyword(this._constructors))
    setAjvKeyword(this._ajv, createParseKeyword(this._parsers))
  }

  compile(schema) {
    return this._ajv.compile(schema)
  }

  defineConstructor(key, fn) {
    this._constructors[key] = ensureFunction(fn)
    return this
  }

  defineParser(key, fn) {
    this._parsers[key] = ensureFunction(fn)
    return this
  }
}

export function createEngine(settings) {
  return new Engine(settings)
}
