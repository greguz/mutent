import test from 'ava'

import { createReader } from './one'

test('read data', async t => {
  const status = await createReader(42)()
  t.deepEqual(status, {
    source: null,
    target: 42
  })
})

test('read function', async t => {
  const status = await createReader(() => 42)()
  t.deepEqual(status, {
    source: null,
    target: 42
  })
})

test('read promise', async t => {
  const status = await createReader(() => Promise.resolve(42))()
  t.deepEqual(status, {
    source: null,
    target: 42
  })
})
