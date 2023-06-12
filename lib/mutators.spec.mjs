import test from 'ava'

import { Entity } from './entity.mjs'
import { assign, ensure, update } from './mutators.mjs'

function read (...values) {
  return values.map(Entity.read)
}

const context = {
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
  }
}

async function unwrap ({ iterable = [], mutator }) {
  const results = []
  for await (const entity of mutator(iterable, context)) {
    results.push(entity)
  }
  return results
}

test('mutator:assign', async t => {
  const out = await unwrap({
    iterable: read({ id: 0 }),
    mutator: assign({ a: true, b: 42 }, { a: undefined, c: true })
  })
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

test('mutator:update', async t => {
  const out = await unwrap({
    iterable: read(41.9),
    mutator: update((value, index) => {
      t.is(index, 0)
      return Math.round(value)
    })
  })
  t.is(out.length, 1)
  t.true(out[0] instanceof Entity)
  t.true(out[0].updated)
  t.is(out[0].source, 41.9)
  t.is(out[0].target, 42)
})

test('mutator:ensure', async t => {
  const yEnsure = await unwrap({
    iterable: [],
    mutator: ensure(42)
  })
  t.is(yEnsure.length, 1)
  t.is(yEnsure[0].valueOf(), 42)

  const fEnsure = await unwrap({
    iterable: [4, 2],
    mutator: ensure(-1)
  })
  t.is(fEnsure.length, 2)
  t.is(fEnsure[0].valueOf(), 4)
  t.is(fEnsure[1].valueOf(), 2)
})

test('mutator:ensure-argument', async t => {
  t.plan(12)

  const [a] = await unwrap({
    mutator: ensure('Hello World!')
  })
  t.true(a instanceof Entity)
  t.true(a.created)
  t.is(a.valueOf(), 'Hello World!')

  const [b] = await unwrap({
    mutator: ensure(Promise.resolve('Ciao mondo!'))
  })
  t.true(b instanceof Entity)
  t.true(b.created)
  t.is(b.valueOf(), 'Ciao mondo!')

  const [c] = await unwrap({
    mutator: ensure(() => 'Hallo Welt!')
  })
  t.true(c instanceof Entity)
  t.true(c.created)
  t.is(c.valueOf(), 'Hallo Welt!')

  const [d] = await unwrap({
    mutator: ensure(() => Promise.resolve('¡Hola Mundo!'))
  })
  t.true(d instanceof Entity)
  t.true(d.created)
  t.is(d.valueOf(), '¡Hola Mundo!')
})
