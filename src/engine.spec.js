import test from 'ava'
import Ajv from 'ajv'

import { Engine } from './engine'
import { MutentError } from './error'

function handle(validate, data) {
  if (!validate(data)) {
    throw new MutentError('EMUT_INVALID_ENTITY', 'Invalid data', {
      errors: validate.errors
    })
  }
  return data
}

test('engine:defineConstructor', t => {
  class Tweedledum {}
  class Tweedledee {}

  const engine = Engine.create({
    constructors: { Tweedledum }
  }).defineConstructor('Tweedledee', Tweedledee)

  t.throws(() => engine.defineConstructor('nope', null))

  const validate = engine.compile({
    type: 'object',
    properties: {
      a: {
        type: 'object',
        instanceof: 'Tweedledum'
      },
      b: {
        type: 'object',
        instanceof: 'Tweedledee'
      }
    }
  })

  handle(validate, {
    a: new Tweedledum(),
    b: new Tweedledee()
  })
  t.throws(() => handle(validate, { a: {} }), {
    code: 'EMUT_INVALID_ENTITY'
  })
  t.throws(() => handle(validate, { b: {} }), {
    code: 'EMUT_INVALID_ENTITY'
  })

  t.throws(() => engine.compile({ instanceof: 'nope' }), {
    code: 'EMUT_UNKNOWN_CONSTRUCTOR'
  })
})

test('engine:defineParser', t => {
  const engine = Engine.create({
    parsers: {
      ceil: Math.ceil,
      parseInt: parseInt
    }
  }).defineParser('floor', Math.floor)

  t.throws(() => engine.defineParser('nope', null))

  const validate = engine.compile({
    type: 'object',
    properties: {
      a: {
        type: 'number',
        parse: 'ceil'
      },
      b: {
        type: 'number',
        parse: ['floor']
      },
      c: {
        type: 'string',
        parse: { parseInt: [16] }
      }
    }
  })

  t.deepEqual(handle(validate, { a: 41.5 }), { a: 42 })
  t.deepEqual(handle(validate, { b: 42.4 }), { b: 42 })
  t.deepEqual(handle(validate, { c: '2A' }), { c: 42 })

  t.throws(() => engine.compile({ parse: 'nope' }), {
    code: 'EMUT_UNKNOWN_PARSER'
  })
})

test('engine:keywordsCheck', t => {
  Engine.create()

  const a = new Ajv()
  Engine.create({ ajv: a })

  const b = new Ajv()
  b.addKeyword({ keyword: 'instanceof' })
  t.throws(() => Engine.create({ ajv: b }), { code: 'EMUT_RESERVED_KEYWORD' })

  const c = new Ajv()
  c.addKeyword({ keyword: 'parse' })
  t.throws(() => Engine.create({ ajv: c }), { code: 'EMUT_RESERVED_KEYWORD' })

  const d = new Ajv()
  d.addKeyword({ keyword: 'constant' })
  t.throws(() => Engine.create({ ajv: d }), { code: 'EMUT_RESERVED_KEYWORD' })
})

test('engine:parsingError', t => {
  const engine = Engine.create({
    parsers: {
      error() {
        throw new Error('STOP')
      }
    }
  })

  const validate = engine.compile({
    type: 'object',
    parse: 'error'
  })

  try {
    handle(validate, {})
    t.fail()
  } catch (err) {
    t.true(Array.isArray(err.info.errors))
    t.true(err.info.errors.length === 1)
    const e = err.info.errors[0]
    t.true(e.params.error instanceof Error)
    t.true(e.params.error.message === 'STOP')
  }
})
