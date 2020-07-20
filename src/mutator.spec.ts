import test from 'ava'

import {
  applyCondition,
  applyMutator,
  createMutator,
  negateCondition,
  renderMutators
} from './mutator'
import { Status, readStatus, updateStatus } from './status'

interface Item {
  id: number
  value?: any
}

function readItem (id: number): Status<Item> {
  return readStatus<Item>({ id })
}

function next (item: Item): Item {
  return { ...item, id: item.id + 1 }
}

test('applyMutator', async t => {
  t.plan(4)

  const a = await applyMutator(
    readItem(0),
    (status, options) => {
      t.deepEqual(options, { type: 'SYNC' })
      return updateStatus(status, {
        ...status.target,
        value: 'UPDATED'
      })
    },
    { type: 'SYNC' }
  )
  t.deepEqual(a, { id: 0, value: 'UPDATED' })

  const b = await applyMutator(
    readItem(0),
    async (status, options) => {
      t.deepEqual(options, { type: 'ASYNC' })
      return updateStatus(status, {
        ...status.target,
        value: 'UPDATED'
      })
    },
    { type: 'ASYNC' }
  )
  t.deepEqual(b, { id: 0, value: 'UPDATED' })
})

test('renderMutators', async t => {
  const out = await applyMutator(
    readItem(0),
    renderMutators([
      createMutator(next),
      createMutator(next),
      createMutator(next)
    ]),
    {}
  )
  t.deepEqual(out, { id: 3 })
})

test('applyCondition', async t => {
  const isZero = (item: Item) => item.id === 0

  const setValue = (item: Item) => ({ ...item, value: 'UPDATED' })

  const mutator = createMutator(setValue)

  const a = await applyMutator(
    readItem(0),
    applyCondition(mutator, isZero),
    {}
  )
  t.deepEqual(a, { id: 0, value: 'UPDATED' })

  const b = await applyMutator(
    readItem(1),
    applyCondition(mutator, isZero),
    {}
  )
  t.deepEqual(b, { id: 1 })
})

test('negateCondition', async t => {
  const isZero = (item: Item) => item.id === 0

  const setValue = (item: Item) => ({ ...item, value: 'UPDATED' })

  const mutator = createMutator(setValue)

  const a = await applyMutator(
    readItem(0),
    applyCondition(mutator, negateCondition(isZero)),
    {}
  )
  t.deepEqual(a, { id: 0 })

  const b = await applyMutator(
    readItem(1),
    applyCondition(mutator, negateCondition(isZero)),
    {}
  )
  t.deepEqual(b, { id: 1, value: 'UPDATED' })
})
