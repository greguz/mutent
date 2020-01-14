import test from 'ava'

import { getOne } from './one'

test('read value', async t => {
  const value = await getOne(42)
  t.deepEqual(value, 42)
})

test('read promised value', async t => {
  const value = await getOne(Promise.resolve(42))
  t.deepEqual(value, 42)
})

test('extract value', async t => {
  const value = await getOne(() => 42)
  t.deepEqual(value, 42)
})

test('extract promised value', async t => {
  const value = await getOne(() => Promise.resolve(42))
  t.deepEqual(value, 42)
})
