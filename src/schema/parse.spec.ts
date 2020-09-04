import test from 'ava'

import { MutentSchema } from './definition-type'
import { parseValues } from './parse'

test('parseObject: primitive values without schema', t => {
  t.deepEqual(
    parseValues('foo'),
    'foo'
  )
  t.deepEqual(
    parseValues(5),
    5
  )
  t.deepEqual(
    parseValues(undefined),
    undefined
  )
  t.deepEqual(
    parseValues(true),
    true
  )
  t.deepEqual(
    parseValues(null),
    null
  )
})

test('parseObject: primitive values with schema', t => {
  t.deepEqual(
    parseValues('foo', { type: 'string' }),
    'foo'
  )
  t.deepEqual(
    parseValues(5, { type: 'number' }),
    5
  )
  t.deepEqual(
    parseValues(true, { type: 'boolean' }),
    true
  )
  t.deepEqual(
    parseValues(null, { type: 'null' }),
    null
  )
})

test('parseObject: object without schema', t => {
  t.deepEqual(
    parseValues({ foo: 'bar' }),
    { foo: 'bar' }
  )
})

test('parseObject: object with schema', t => {
  const schema: MutentSchema = {
    type: 'object'
  }
  t.deepEqual(
    parseValues({ foo: 'bar' }, schema),
    { foo: 'bar' }
  )

  const schema2: MutentSchema = {
    type: 'object',
    additionalProperties: true
  }
  t.deepEqual(
    parseValues({ foo: 'bar' }, schema2),
    { foo: 'bar' }
  )

  const schema3: MutentSchema = {
    type: 'object',
    properties: {
      foo: {
        type: 'string'
      }
    }
  }
  t.deepEqual(
    parseValues({ foo: 'bar' }, schema3),
    { foo: 'bar' }
  )
})

test('parseObject: object with schema and custom parse', t => {
  const schema: MutentSchema = {
    type: 'object',
    properties: {
      foo: {
        type: 'string',
        parse: Number
      },
      bar: {
        type: 'object',
        properties: {
          deepBar: {
            type: 'string',
            parse: (value) => `##${value}##`
          }
        }
      }
    }
  }
  t.deepEqual(
    parseValues({ foo: '5', bar: { deepBar: 'foo' }, notPassing: true }, schema),
    { foo: 5, bar: { deepBar: '##foo##' }, notPassing: true }
  )
})

test('parseObject: array without schema', t => {
  t.deepEqual(
    parseValues(['foo']),
    ['foo']
  )
})

test('parseObject: array with schema', t => {
  const schema: MutentSchema = {
    type: 'array'
  }
  t.deepEqual(
    parseValues(['foo'], schema),
    ['foo']
  )

  const schema3: MutentSchema = {
    type: 'array',
    items: {
      type: 'string'
    }
  }
  t.deepEqual(
    parseValues(['foo'], schema3),
    ['foo']
  )

  const schema4: MutentSchema = {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        foo: {
          type: 'string'
        },
        bar: {
          type: 'number',
          parse: (value) => value.toString()
        }
      }
    }
  }
  t.deepEqual(
    parseValues<{ foo: string, bar: string }[]>([{ foo: 'bar', bar: 4 }], schema4),
    [{ foo: 'bar', bar: '4' }]
  )
  const now = new Date().toISOString()
  const schema5: MutentSchema = {
    type: 'array',
    items: [{
      type: 'object',
      properties: {
        now: {
          type: 'string',
          format: 'date-time',
          parse: (value) => new Date(value)
        }
      }
    }]
  }
  t.deepEqual(
    parseValues([{ foo: 'bar', now }], schema5),
    [{ foo: 'bar', now: new Date(now) }]
  )
})
