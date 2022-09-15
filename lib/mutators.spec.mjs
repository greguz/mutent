import test from 'ava'

import { Entity } from './entity.mjs'
import { assign, ensure, iif, update } from './mutators.mjs'

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

async function unwrap ({ iterable, mutator, options = {} }) {
  const results = []
  for await (const entity of mutator.call(context, iterable, options)) {
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

test('mutator:iif', async t => {
  t.throws(() => iif(null))
  const out = await unwrap({
    iterable: read(42, 13),
    mutator: iif(
      value => value % 2 === 0,
      update(value => value / 2),
      update(value => value * 2)
    )
  })

  t.is(out.length, 2)

  t.true(out[0] instanceof Entity)
  t.is(out[0].source, 42)
  t.is(out[0].target, 21)

  t.true(out[1] instanceof Entity)
  t.is(out[1].source, 13)
  t.is(out[1].target, 26)
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
