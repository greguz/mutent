import test from 'ava'

import { assign, iif, update } from './mutators'
import { createStatus, readStatus } from './status'

async function unwrap ({ context = {}, iterable, mutator, options = {} }) {
  const results = []
  for await (const status of mutator.call(context, iterable, options)) {
    results.push(status)
  }
  return results
}

export function create (...values) {
  return values.map(createStatus)
}

function read (...values) {
  return values.map(readStatus)
}

test('mutator:assign', async t => {
  const out = await unwrap({
    iterable: read({ id: 0 }),
    mutator: assign({ a: true, b: 42 }, { a: undefined, c: true })
  })
  t.deepEqual(out, [
    {
      created: false,
      updated: true,
      deleted: false,
      source: {
        id: 0
      },
      target: {
        id: 0,
        a: undefined,
        b: 42,
        c: true
      }
    }
  ])
})

test('mutator:update', async t => {
  const out = await unwrap({
    iterable: read(41.9),
    mutator: update((value, index) => {
      t.is(index, 0)
      return Math.round(value)
    })
  })
  t.deepEqual(out, [
    {
      created: false,
      updated: true,
      deleted: false,
      source: 41.9,
      target: 42
    }
  ])
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
  t.deepEqual(out, [
    {
      created: false,
      updated: true,
      deleted: false,
      source: 42,
      target: 21
    },
    {
      created: false,
      updated: true,
      deleted: false,
      source: 13,
      target: 26
    }
  ])
})
