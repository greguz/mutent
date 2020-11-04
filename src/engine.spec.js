import test from 'ava'

import { createEngine } from './engine'

test('engine:defineConstructor', t => {
  class Teapot {}

  const engine = createEngine().defineConstructor('Teapot', Teapot)

  const schema = engine.compile({
    type: 'object',
    properties: {
      a: {
        type: 'object',
        instanceof: 'Date'
      },
      b: {
        type: 'object',
        instanceof: 'Teapot'
      }
    }
  })

  schema.validate({})
  schema.validate({
    a: new Date(),
    b: new Teapot()
  })
  t.throws(() => schema.validate({ a: 'nope' }), {
    code: 'EMUT_INVALID_DATA'
  })
  t.throws(() => schema.validate({ b: 'nope' }), {
    code: 'EMUT_INVALID_DATA'
  })
})

test('engine:defineParser', t => {
  const engine = createEngine().defineParser('round', value =>
    Math.round(value)
  )

  const schema = engine.compile({
    type: 'object',
    properties: {
      value: {
        type: 'number',
        parse: 'round'
      }
    }
  })

  t.deepEqual(schema.parse({ value: 42.4 }), { value: 42 })
  t.deepEqual(schema.parse({ value: 41.5 }), { value: 42 })
  t.throws(() => schema.parse({ value: 'nope' }), {
    code: 'EMUT_INVALID_DATA'
  })
})
