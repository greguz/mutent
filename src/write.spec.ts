import test from 'ava'

import { createStatus } from './status'
import { createWriter } from './write'

test('default writer', async t => {
  const status = await createWriter()(createStatus(42))
  t.deepEqual(status, {
    source: 42,
    target: 42
  })
})

test('sync writer', async t => {
  t.plan(4)
  function commit (source: any, target: any, options: any) {
    t.is(source, null)
    t.is(target, 42)
    t.deepEqual(options, { db: 'test' })
  }
  const status = await createWriter(commit)(createStatus(42), { db: 'test' })
  t.deepEqual(status, {
    source: 42,
    target: 42
  })
})

test('async writer', async t => {
  t.plan(4)
  async function commit (source: any, target: any, options: any) {
    t.is(source, null)
    t.is(target, 42)
    t.deepEqual(options, { db: 'test' })
  }
  const status = await createWriter(commit)(createStatus(42), { db: 'test' })
  t.deepEqual(status, {
    source: 42,
    target: 42
  })
})
