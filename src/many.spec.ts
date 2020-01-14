import test from 'ava'
import { Readable } from 'stream'

import { getMany } from './many'

test('read array', async t => {
  const value = await getMany(['test'])
  t.is(value instanceof Readable, true)
})

// test('read promised array', async t => {
//   const value = await getMany(Promise.resolve(['test']))
//   t.is(value[0], 'test')
// })

test('extract array', async t => {
  const value = await getMany(() => ['test'])
  t.is(value instanceof Readable, true)
})

test('extract promised array', async t => {
  const value = await getMany(() => Promise.resolve(['test']))
  t.is(value instanceof Readable, true)
})
