import test from 'ava'

import { applyCommit } from './commit'
import { createStatus } from './status'

test('default writer', async t => {
  const status = await applyCommit(createStatus(42))
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
  const status = await applyCommit(createStatus(42), commit, { db: 'test' })
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
  const status = await applyCommit(createStatus(42), commit, { db: 'test' })
  t.deepEqual(status, {
    source: 42,
    target: 42
  })
})
