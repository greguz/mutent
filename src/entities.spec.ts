import test, { ExecutionContext } from 'ava'

import { createMany, readMany } from './entities'

interface CommitMode {
  create: boolean;
  update: boolean;
  delete: boolean;
}

function bind (t: ExecutionContext, mode: Partial<CommitMode> = {}) {
  return async (source: any, target: any, options: any) => {
    if (
      (source === null && target === null) ||
      source === undefined ||
      target === undefined
    ) {
      t.fail()
    } else if (source === null) {
      if (mode.create === true) {
        t.pass()
      } else {
        t.fail()
      }
    } else if (target === null) {
      if (mode.delete === true) {
        t.pass()
      } else {
        t.fail()
      }
    } else {
      if (mode.update === true) {
        t.pass()
      } else {
        t.fail()
      }
    }
    t.deepEqual(options, { db: 'test' })
  }
}

interface Item {
  value: number
}

function getItems (count: number = 16) {
  const items: Item[] = []
  for (let i = 0; i < count; i++) {
    items.push({ value: i * 2 })
  }
  return items
}

test('lock', async t => {
  t.throws(() => {
    const entities = createMany([])
    entities.update(data => data)
    entities.update(data => data)
  })
  t.throws(() => {
    const entities = createMany([])
    entities.assign({})
    entities.assign({})
  })
  t.throws(() => {
    const entities = createMany([])
    entities.delete()
    entities.delete()
  })
  t.throws(() => {
    const entities = createMany([])
    entities.commit()
    entities.commit()
  })
  await t.throwsAsync(async () => {
    const entities = createMany([])
    await entities.unwrap()
    await entities.unwrap()
  })
})

test('create', async t => {
  t.plan(35)
  const results = await createMany(getItems(), bind(t, { create: true }))
    .commit()
    .unwrap({ db: 'test' })
  t.is(results.length, 16)
  t.is(results[0].value, 0)
  t.is(results[15].value, 30)
})

test('update', async t => {
  t.plan(35)
  const results = await readMany(getItems(), bind(t, { update: true }))
    .update(data => ({ value: data.value / 2 }))
    .commit()
    .unwrap({ db: 'test' })
  t.is(results.length, 16)
  t.is(results[0].value, 0)
  t.is(results[15].value, 15)
})

test('delete', async t => {
  t.plan(35)
  const results = await readMany(getItems(), bind(t, { delete: true }))
    .delete()
    .commit()
    .unwrap({ db: 'test' })
  t.is(results.length, 16)
  t.is(results[0], null)
  t.is(results[15], null)
})
