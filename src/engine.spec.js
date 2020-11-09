import test from 'ava'

import Ajv from 'ajv'

import { createEngine } from './engine'

test('engine:defineConstructor', t => {
  class Tweedledum {}
  class Tweedledee {}

  const engine = createEngine({
    constructors: { Tweedledum }
  }).defineConstructor('Tweedledee', Tweedledee)

  const schema = engine.compile({
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

  schema.validate({
    a: new Tweedledum(),
    b: new Tweedledee()
  })
  t.throws(() => schema.validate({ a: {} }), {
    code: 'EMUT_INVALID_DATA'
  })
  t.throws(() => schema.validate({ b: {} }), {
    code: 'EMUT_INVALID_DATA'
  })

  t.throws(() => engine.compile({ instanceof: 'nope' }), {
    code: 'EMUT_UNKNOWN_CONSTRUCTOR'
  })
})

test('engine:defineParser', t => {
  const engine = createEngine({
    parsers: {
      ceil: Math.ceil,
      parseInt: parseInt
    }
  }).defineParser('floor', Math.floor)

  const schema = engine.compile({
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

  t.deepEqual(schema.validate({ a: 41.5 }), { a: 42 })
  t.deepEqual(schema.validate({ b: 42.4 }), { b: 42 })
  t.deepEqual(schema.validate({ c: '2A' }), { c: 42 })

  t.throws(() => engine.compile({ parse: 'nope' }), {
    code: 'EMUT_UNKNOWN_PARSER'
  })
})

test('engine:keywordsCheck', t => {
  createEngine()

  const a = new Ajv()
  createEngine({ ajv: a })

  const b = new Ajv()
  b.addKeyword('instanceof', {})
  t.throws(() => createEngine({ ajv: b }), { code: 'EMUT_RESERVED_KEYWORD' })

  const c = new Ajv()
  c.addKeyword('parse', {})
  t.throws(() => createEngine({ ajv: c }), { code: 'EMUT_RESERVED_KEYWORD' })
})

test('engine:parsingError', t => {
  const engine = createEngine({
    parsers: {
      error() {
        throw new Error('STOP')
      }
    }
  })

  const schema = engine.compile({
    type: 'object',
    parse: 'error'
  })

  try {
    schema.validate({})
    t.fail()
  } catch (err) {
    t.true(Array.isArray(err.info.errors))
    t.true(err.info.errors.length === 1)
    const e = err.info.errors[0]
    t.true(e.params.error instanceof Error)
    t.true(e.params.error.message === 'STOP')
  }
})
