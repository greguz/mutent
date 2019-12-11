import test from 'ava'

import { createReader } from './read'

test('read data', async t => {
  const status = await createReader(42)()
  t.deepEqual(status, {
    source: null,
    target: 42,
    options: undefined
  })
})

test('read function', async t => {
  const status = await createReader(() => 42)()
  t.deepEqual(status, {
    source: null,
    target: 42,
    options: undefined
  })
})

test('read promise', async t => {
  const status = await createReader(() => Promise.resolve(42))()
  t.deepEqual(status, {
    source: null,
    target: 42,
    options: undefined
  })
})
