import test, { ExecutionContext } from 'ava'

import { createEntity as create, readEntity as read } from './entity'

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

test('lock', async t => {
  t.throws(() => {
    const entity = create({})
    entity.update(data => data)
    entity.update(data => data)
  })
  t.throws(() => {
    const entity = create({})
    entity.assign({})
    entity.assign({})
  })
  t.throws(() => {
    const entity = create({})
    entity.delete()
    entity.delete()
  })
  t.throws(() => {
    const entity = create({})
    entity.commit()
    entity.commit()
  })
  await t.throwsAsync(async () => {
    const entity = create({})
    await entity.unwrap()
    await entity.unwrap()
  })
})

test('create', async t => {
  t.plan(3)
  const result = await create({ a: 1 }, bind(t, { create: true }))
    .update(data => ({ ...data, b: 2 }))
    .commit()
    .unwrap({ db: 'test' })
  t.deepEqual(result, { a: 1, b: 2 })
})

test('update', async t => {
  t.plan(3)
  const result = await read({ a: 1 }, bind(t, { update: true }))
    .update(data => ({ ...data, b: 2 }))
    .commit()
    .unwrap({ db: 'test' })
  t.deepEqual(result, { a: 1, b: 2 })
})

test('delete', async t => {
  t.plan(3)
  const result = await read({ a: 1 }, bind(t, { delete: true }))
    .update(data => ({ ...data, b: 2 }))
    .delete()
    .commit()
    .unwrap({ db: 'test' })
  t.deepEqual(result, null)
})

test('void', async t => {
  t.plan(1)
  const result = await create({ a: 1 }, bind(t))
    .update(data => ({ ...data, b: 2 }))
    .delete()
    .commit()
    .unwrap()
  t.is(result, null)
})

test('read sync', async t => {
  t.plan(3)
  const fetch = () => ({ a: 1 })
  const result = await read(fetch, bind(t, { update: true }))
    .update(data => ({ ...data, b: 2 }))
    .commit()
    .unwrap({ db: 'test' })
  t.deepEqual(result, { a: 1, b: 2 })
})

test('read async', async t => {
  t.plan(3)
  const fetch = async () => ({ a: 1 })
  const result = await read(fetch, bind(t, { update: true }))
    .update(data => ({ ...data, b: 2 }))
    .commit()
    .unwrap({ db: 'test' })
  t.deepEqual(result, { a: 1, b: 2 })
})

test('mutator', async t => {
  t.plan(3)
  const result = await read({ a: 1 }, bind(t, { update: true }))
    .update((data, b: number) => ({ ...data, b }), 2)
    .commit()
    .unwrap({ db: 'test' })
  t.deepEqual(result, { a: 1, b: 2 })
})

test('assign', async t => {
  t.plan(3)
  const result = await read({ a: 1 }, bind(t, { update: true }))
    .assign({ b: 2 })
    .commit()
    .unwrap({ db: 'test' })
  t.deepEqual(result, { a: 1, b: 2 })
})
