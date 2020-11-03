import test from 'ava'
import Ajv from 'ajv'

import { parseData } from './parse-data'

const ajv = new Ajv()

function parse(data, schema, functions) {
  return parseData(ajv, data, schema, {
    toDate: value => new Date(value),
    toString: value => value.toString(),
    ...functions
  })
}

test('parseObject: primitive values without schema', t => {
  t.deepEqual(parse('foo'), 'foo')
  t.deepEqual(parse(5), 5)
  t.deepEqual(parse(undefined), undefined)
  t.deepEqual(parse(true), true)
  t.deepEqual(parse(null), null)
})

test('parseObject: primitive values with schema', t => {
  t.deepEqual(parse('foo', { type: 'string' }), 'foo')
  t.deepEqual(parse(5, { type: 'number' }), 5)
  t.deepEqual(parse(true, { type: 'boolean' }), true)
  t.deepEqual(parse(null, { type: 'null' }), null)
})

test('parseObject: object without schema', t => {
  t.deepEqual(parse({ foo: 'bar' }), { foo: 'bar' })
})

test('parseObject: object with schema', t => {
  const schema = {
    type: 'object'
  }
  t.deepEqual(parse({ foo: 'bar' }, schema), { foo: 'bar' })

  const schema2 = {
    type: 'object',
    additionalProperties: true
  }
  t.deepEqual(parse({ foo: 'bar' }, schema2), { foo: 'bar' })

  const schema3 = {
    type: 'object',
    properties: {
      foo: {
        type: 'string'
      }
    }
  }
  t.deepEqual(parse({ foo: 'bar' }, schema3), { foo: 'bar' })
})

test('parseObject: object with schema and custom parse', t => {
  const schema = {
    type: 'object',
    properties: {
      foo: {
        type: 'string',
        parse: 'toNumber'
      },
      bar: {
        type: 'object',
        properties: {
          deepBar: {
            type: 'string',
            parse: 'custom'
          }
        }
      }
    }
  }
  t.deepEqual(
    parse(
      {
        foo: '5',
        bar: {
          deepBar: 'foo'
        },
        notPassing: true
      },
      schema,
      {
        toNumber: Number,
        custom: value => `##${value}##`
      }
    ),
    {
      foo: 5,
      bar: {
        deepBar: '##foo##'
      },
      notPassing: true
    }
  )
})

test('parseObject: array without schema', t => {
  t.deepEqual(parse(['foo']), ['foo'])
})

test('parseObject: array with schema', t => {
  const schema = {
    type: 'array'
  }
  t.deepEqual(parse(['foo'], schema), ['foo'])

  const schema3 = {
    type: 'array',
    items: {
      type: 'string'
    }
  }
  t.deepEqual(parse(['foo'], schema3), ['foo'])

  const schema4 = {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        foo: {
          type: 'string'
        },
        bar: {
          type: 'number',
          parse: 'toString'
        }
      }
    }
  }
  t.deepEqual(parse([{ foo: 'bar', bar: 4 }], schema4), [
    { foo: 'bar', bar: '4' }
  ])
  const now = new Date().toISOString()
  const schema5 = {
    type: 'array',
    items: [
      {
        type: 'object',
        properties: {
          now: {
            type: 'string',
            format: 'date-time',
            parse: 'toDate'
          }
        }
      }
    ]
  }
  t.deepEqual(parse([{ foo: 'bar', now }], schema5), [
    { foo: 'bar', now: new Date(now) }
  ])
})

test('parseData:patternProperties', t => {
  const data = parse(
    {
      aDate: '2020-09-16T10:07:09.517Z',
      bDate: '2020-07-16T10:07:09.517Z',
      aValue: true,
      bValue: true
    },
    {
      type: 'object',
      patternProperties: {
        Date$: {
          type: 'string',
          format: 'date-time',
          parse: 'toDate'
        }
      }
    }
  )
  t.true(data.aDate instanceof Date)
  t.true(data.bDate instanceof Date)
})

test('parseData:oneOf', t => {
  const schema = {
    type: 'object',
    properties: {
      value: {
        oneOf: [
          {
            type: 'object',
            instanceof: 'Date'
          },
          {
            type: 'string',
            format: 'date-time',
            parse: 'toDate'
          }
        ]
      }
    }
  }

  const a = parse(
    {
      value: '2020-09-16T10:07:09.517Z'
    },
    schema
  )
  t.true(a.value instanceof Date)

  const b = parse(
    {
      value: new Date()
    },
    schema
  )
  t.true(b.value instanceof Date)
})
