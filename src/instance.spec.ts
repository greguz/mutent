import test from 'ava'
import { collect, subscribe } from 'fluido'

import { createEntities, createEntity, readEntities, readEntity } from './instance'

interface Item {
  id: number,
  value?: string
}

test('createEntity#unwrap', async t => {
  const out = await createEntity<Item>({ id: 0, value: 'UNWRAP' }).unwrap()
  t.deepEqual(out, { id: 0, value: 'UNWRAP' })
})

test('createEntity#stream', async t => {
  const out = await subscribe<Item[]>(
    createEntity<Item>({ id: 0, value: 'STREAM' }).stream(),
    collect()
  )
  t.deepEqual(out, [{ id: 0, value: 'STREAM' }])
})

test('readEntity#unwrap', async t => {
  const out = await readEntity<Item>({ id: 0, value: 'UNWRAP' }).unwrap()
  t.deepEqual(out, { id: 0, value: 'UNWRAP' })
})

test('readEntity#stream', async t => {
  const out = await subscribe<Item[]>(
    readEntity<Item>({ id: 0, value: 'STREAM' }).stream(),
    collect()
  )
  t.deepEqual(out, [{ id: 0, value: 'STREAM' }])
})

test('createEntities#unwrap', async t => {
  const out = await createEntities<Item>([{ id: 0, value: 'UNWRAP' }]).unwrap()
  t.deepEqual(out, [{ id: 0, value: 'UNWRAP' }])
})

test('createEntities#stream', async t => {
  const out = await subscribe<Item[]>(
    createEntities<Item>([{ id: 0, value: 'STREAM' }]).stream(),
    collect()
  )
  t.deepEqual(out, [{ id: 0, value: 'STREAM' }])
})

test('readEntities#unwrap', async t => {
  const out = await readEntities<Item>([{ id: 0, value: 'UNWRAP' }]).unwrap()
  t.deepEqual(out, [{ id: 0, value: 'UNWRAP' }])
})

test('readEntities#stream', async t => {
  const out = await subscribe<Item[]>(
    readEntities<Item>([{ id: 0, value: 'STREAM' }]).stream(),
    collect()
  )
  t.deepEqual(out, [{ id: 0, value: 'STREAM' }])
})

test('instance#conditional-mutation', async t => {
  const entity = readEntity<Item>({ id: 0 })

  const mDelete = entity.createMutation().assign({ value: 'DELETE' })
  const mUpdate = entity.createMutation().assign({ value: 'UPDATE' })

  const a = await entity
    .if(true, mDelete)
    .unless(true, mUpdate)
    .unwrap()
  t.deepEqual(a, { id: 0, value: 'DELETE' })

  const b = await entity
    .unless(() => false, mUpdate)
    .if(() => false, mDelete)
    .unwrap()
  t.deepEqual(b, { id: 0, value: 'UPDATE' })
})

test('instance#mutate', async t => {
  const entity = readEntity<Item>({ id: 0 })
  const mutation = entity.createMutation().assign({ value: 'UPDATE' })
  const out = await entity.mutate(mutation).unwrap()
  t.deepEqual(out, { id: 0, value: 'UPDATE' })
})
