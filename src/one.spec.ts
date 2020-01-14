import test from 'ava'

import { getOne } from './one'

test('read data', async t => {
  const status = await getOne(42)
  t.deepEqual(status, 42)
})

test('read function', async t => {
  const status = await getOne(() => 42)
  t.deepEqual(status, 42)
})

test('read promise', async t => {
  const status = await getOne(() => Promise.resolve(42))
  t.deepEqual(status, 42)
})
