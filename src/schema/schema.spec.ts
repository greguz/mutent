import test from 'ava'

import { parseObject, MutentSchema } from '.'

test('parseObject: primitive values without schema', t => {
  t.deepEqual(
    parseObject('foo'),
    'foo'
  )
  t.deepEqual(
    parseObject(5),
    5
  )
  t.deepEqual(
    parseObject(undefined),
    undefined
  )
  t.deepEqual(
    parseObject(true),
    true
  )
  t.deepEqual(
    parseObject(null),
    null
  )
})

test('parseObject: primitive values with schema', t => {
  t.deepEqual(
    parseObject('foo', { type: 'string' }),
    'foo'
  )
  t.deepEqual(
    parseObject(5, { type: 'number' }),
    5
  )
  t.deepEqual(
    parseObject(true, { type: 'boolean' }),
    true
  )
  t.deepEqual(
    parseObject(null, { type: 'null' }),
    null
  )
})

test('parseObject: object without schema', t => {
  t.deepEqual(
    parseObject({ foo: 'bar' }),
    { foo: 'bar' }
  )
})

test('parseObject: object with schema', t => {
  const schema: MutentSchema = {
    type: 'object'
  }
  t.deepEqual(
    parseObject({ foo: 'bar' }, schema),
    {}
  )

  const schema2: MutentSchema = {
    type: 'object',
    additionalProperties: true
  }
  t.deepEqual(
    parseObject({ foo: 'bar' }, schema2),
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
    parseObject({ foo: 'bar' }, schema3),
    { foo: 'bar' }
  )
})

test('parseObject: object with schema and custom parse', t => {
  interface R {
    foo: number,
    bar: {
      deepBar: string
    }
  }
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
    parseObject<R>({ foo: '5', bar: { deepBar: 'foo' }, notPassing: true }, schema),
    { foo: 5, bar: { deepBar: '##foo##' } }
  )
  t.notDeepEqual(
    parseObject({ foo: '5', bar: { deepBar: 'foo' }, notPassing: true }, schema),
    { foo: '5', bar: { deepBar: 'foo' } })
})

test('parseObject: array without schema', t => {
  t.deepEqual(
    parseObject(['foo']),
    ['foo']
  )
})

test('parseObject: array with schema', t => {
  const schema: MutentSchema = {
    type: 'array'
  }
  t.deepEqual(
    parseObject(['foo'], schema),
    ['foo']
  )

  const schema2: MutentSchema = {
    type: 'array',
    items: {
      type: 'object'
    }
  }
  t.notDeepEqual(
    parseObject(['foo'], schema2),
    ['foo']
  )

  const schema3: MutentSchema = {
    type: 'array',
    items: {
      type: 'string'
    }
  }
  t.deepEqual(
    parseObject(['foo'], schema3),
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
    parseObject<{ foo: string, bar: string }[]>([{ foo: 'bar', bar: 4 }], schema4),
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
    parseObject<[{ now: Date }]>([{ foo: 'bar', now }], schema5),
    [{ now: new Date(now) }]
  )
})
