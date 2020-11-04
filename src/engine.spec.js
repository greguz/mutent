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
      },
      c: {
        type: 'object',
        instanceof: 'Alice'
      }
    }
  })

  schema.validate({})
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
  t.throws(() => schema.validate({ c: {} }), {
    code: 'EMUT_INVALID_DATA'
  })
})

test('engine:defineParser', t => {
  const engine = createEngine({
    parsers: { ceil: Math.ceil }
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
        parse: 'floor'
      },
      c: {
        type: 'number',
        parse: 'round'
      }
    }
  })

  schema.parse({})
  t.deepEqual(schema.parse({ a: 41.5 }), { a: 42 })
  t.deepEqual(schema.parse({ b: 42.4 }), { b: 42 })
  t.throws(() => schema.parse({ a: 'nope' }), {
    code: 'EMUT_INVALID_DATA'
  })
  t.throws(() => schema.parse({ b: 'nope' }), {
    code: 'EMUT_INVALID_DATA'
  })
  t.throws(() => schema.parse({ c: 42.1 }), {
    code: 'EMUT_EXPECTED_PARSER'
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
