import test from 'ava'

import { SchemaHandler } from './handler'

test('SchemaHandler:defineConstructor', t => {
  class Teapot {}

  const schema = new SchemaHandler({
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

  schema.defineConstructor('Teapot', Teapot)
  t.throws(() => schema.defineConstructor('Teapot', RegExp), {
    code: 'EMUT_CONSTRUCTOR_EXISTS'
  })

  schema.compute({
    a: new Date(),
    b: new Teapot()
  })
  t.throws(() => schema.compute({ a: 'nope' }), {
    code: 'EMUT_INVALID_DATA'
  })
})

test('SchemaHandler:defineParser', t => {
  const schema = new SchemaHandler({
    type: 'object',
    properties: {
      value: {
        type: 'number',
        parse: 'round'
      }
    }
  })

  schema.defineParser('round', value => Math.round(value))
  t.throws(() => schema.defineParser('round', value => value), {
    code: 'EMUT_PARSER_EXISTS'
  })

  t.deepEqual(schema.compute({ value: 42.4 }), { value: 42 })
  t.deepEqual(schema.compute({ value: 41.5 }), { value: 42 })
  t.throws(() => schema.compute({ value: 'nope' }), {
    code: 'EMUT_INVALID_DATA'
  })
})
