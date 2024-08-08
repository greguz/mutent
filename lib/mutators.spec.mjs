import test from 'ava'

import { Entity } from './entity.mjs'
import {
  assign,
  ddelete,
  ensure,
  limit,
  skip,
  update
} from './mutators.mjs'

function mockFilterContext () {
  return {
    adapter: {},
    argument: undefined,
    commitMode: 'AUTO',
    handlers: [],
    hooks: {
      onFind: [],
      onFilter: [],
      onEntity: [],
      beforeCreate: [],
      beforeUpdate: [],
      beforeDelete: [],
      afterCreate: [],
      afterUpdate: [],
      afterDelete: []
    },
    intent: 'FILTER',
    multiple: true,
    mutators: [],
    opaque: undefined,
    options: {},
    writeMode: 'AUTO',
    writeSize: 16
  }
}

async function unwrap (items, mutator) {
  const iterable = mutator(
    items.map(Entity.read),
    mockFilterContext()
  )

  const results = []
  for await (const entity of iterable) {
    results.push(entity)
  }
  return results
}

test('assign', async t => {
  const out = await unwrap(
    [{ id: 0 }],
    assign({ a: true, b: 42 }, { a: undefined, c: true })
  )
  t.is(out.length, 1)
  t.true(out[0] instanceof Entity)
  t.true(out[0].updated)
  t.deepEqual(out[0].source, {
    id: 0
  })
  t.deepEqual(out[0].target, {
    id: 0,
    a: undefined,
    b: 42,
    c: true
  })
})

test('update', async t => {
  const out = await unwrap(
    [41.9],
    update((value, index) => {
      t.is(index, 0)
      return Math.round(value)
    })
  )
  t.is(out.length, 1)
  t.true(out[0] instanceof Entity)
  t.like(out[0], {
    updated: true,
    source: 41.9,
    target: 42
  })
})

test('ensure smoke test', async t => {
  const yEnsure = await unwrap([], ensure(42))
  t.is(yEnsure.length, 1)
  t.is(yEnsure[0].valueOf(), 42)

  const fEnsure = await unwrap([4, 2], ensure(-1))
  t.is(fEnsure.length, 2)
  t.is(fEnsure[0].valueOf(), 4)
  t.is(fEnsure[1].valueOf(), 2)
})

test('ensure argument type', async t => {
  t.plan(12)

  const [a] = await unwrap([], ensure('Hello World!'))
  t.true(a instanceof Entity)
  t.true(a.created)
  t.is(a.valueOf(), 'Hello World!')

  const [b] = await unwrap([], ensure(Promise.resolve('Ciao mondo!')))
  t.true(b instanceof Entity)
  t.true(b.created)
  t.is(b.valueOf(), 'Ciao mondo!')

  const [c] = await unwrap([], ensure(() => 'Hallo Welt!'))
  t.true(c instanceof Entity)
  t.true(c.created)
  t.is(c.valueOf(), 'Hallo Welt!')

  const [d] = await unwrap([], ensure(() => Promise.resolve('¡Hola Mundo!')))
  t.true(d instanceof Entity)
  t.true(d.created)
  t.is(d.valueOf(), '¡Hola Mundo!')
})

test('skip', async t => {
  t.throws(() => skip(-1))

  const entities = await unwrap(
    ['a', 'b', 'c', 'd', 'e'],
    skip(2)
  )

  t.like(entities, [
    { target: 'c' },
    { target: 'd' },
    { target: 'e' }
  ])
})

test('limit', async t => {
  t.throws(() => limit(-1))
  t.throws(() => limit(0))

  const entities = await unwrap(
    ['a', 'b', 'c', 'd', 'e'],
    limit(2)
  )

  t.like(entities, [
    { source: 'a', target: 'a' },
    { source: 'b', target: 'b' }
  ])
})

test('ddelete', async t => {
  const all = await unwrap(['a', 'b'], ddelete())
  t.like(all, [
    { deleted: true, target: 'a' },
    { deleted: true, target: 'b' }
  ])

  const group = await unwrap(
    ['c', 'd', 'e', 'f'],
    ddelete((data, index) => index % 2 === 0)
  )
  t.like(group, [
    { deleted: true, target: 'c' },
    { deleted: false, target: 'd' },
    { deleted: true, target: 'e' },
    { deleted: false, target: 'f' }
  ])
})
