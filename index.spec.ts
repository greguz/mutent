import test from 'ava'

import { create, read } from './index'

interface CommitMode {
  create: boolean;
  update: boolean;
  delete: boolean;
}

function bind (t: any, mode: Partial<CommitMode> = {}) {
  return async (source: any, target: any) => {
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
  }
}

test('undefined', t => {
  t.throws(() => create(undefined))
  t.throws(() => create({}).update(() => undefined))
  t.throws(() => read(undefined))
  t.throws(() => read({}).update(() => undefined))
})

test('lock', async t => {
  t.throws(() => {
    const entity = create({})
    entity.delete()
    entity.delete()
  })
  t.throws(() => {
    const entity = create({})
    entity.update(data => data)
    entity.update(data => data)
  })
  await t.throwsAsync(async () => {
    const entity = create({})
    await entity.commit()
    await entity.commit()
  })
  t.throws(() => {
    const entity = create({})
    entity.toJSON()
    entity.toJSON()
  })
})

test('create', async t => {
  t.plan(2)
  const entity = await create({ v: 1 }, bind(t, { create: true }))
    .update(data => ({ ...data, v: 2 }))
    .commit()
  t.deepEqual(entity.toJSON(), { v: 2 })
})

test('update', async t => {
  t.plan(2)
  const entity = await read({ v: 1 }, bind(t, { update: true }))
    .update(data => ({ ...data, v: 2 }))
    .commit()
  t.deepEqual(entity.toJSON(), { v: 2 })
})

test('delete', async t => {
  t.plan(2)
  const entity = await read({ v: 1 }, bind(t, { delete: true }))
    .update(data => ({ ...data, v: 2 }))
    .delete()
    .commit()
  t.deepEqual(entity.toJSON(), null)
})

test('void', async t => {
  t.plan(1)
  const entity = await create({ v: 1 }, bind(t))
    .update(data => ({ ...data, v: 2 }))
    .delete()
    .commit()
  t.is(entity.toJSON(), null)
})
