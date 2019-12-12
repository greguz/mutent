import test from 'ava'

import { createStatus } from './status'
import { createWriter } from './write'

test('default writer', async t => {
  const status = await createWriter()(createStatus(42))
  t.deepEqual(status, {
    source: 42,
    target: 42,
    options: undefined
  })
})

test('sync writer', async t => {
  t.plan(3)
  function commit (source: any, target: any) {
    t.is(source, null)
    t.is(target, 42)
  }
  const status = await createWriter(commit)(createStatus(42))
  t.deepEqual(status, {
    source: 42,
    target: 42,
    options: undefined
  })
})

test('async writer', async t => {
  t.plan(3)
  async function commit (source: any, target: any) {
    t.is(source, null)
    t.is(target, 42)
  }
  const status = await createWriter(commit)(createStatus(42))
  t.deepEqual(status, {
    source: 42,
    target: 42,
    options: undefined
  })
})
