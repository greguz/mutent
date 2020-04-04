import test, { ExecutionContext } from 'ava'

import { create, read } from './entity'
import { Driver } from './handler'

interface CommitMode {
  create?: boolean
  update?: boolean
  delete?: boolean
}

function bind (t: ExecutionContext, mode: Partial<CommitMode> = {}): Driver<any> {
  return {
    async create (target, options) {
      if (mode.create === true) {
        t.pass()
      } else {
        t.fail()
      }
      t.deepEqual(options, { db: 'test' })
    },
    async update (source, target, options) {
      if (mode.update === true) {
        t.pass()
      } else {
        t.fail()
      }
      t.deepEqual(options, { db: 'test' })
    },
    async delete (source, options) {
      if (mode.delete === true) {
        t.pass()
      } else {
        t.fail()
      }
      t.deepEqual(options, { db: 'test' })
    }
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
  t.plan(4)
  const result = await read({ a: 1 }, bind(t, { delete: true }))
    .update(data => ({ ...data, b: 2 }))
    .delete()
    .commit()
    .unwrap({ db: 'test' })
  t.is(result.a, 1)
  t.is(result.b, 2)
})

test('void', async t => {
  t.plan(2)
  const result = await create({ a: 1 }, bind(t))
    .update(data => ({ ...data, b: 2 }))
    .delete()
    .commit()
    .unwrap()
  t.is(result.a, 1)
  t.is(result.b, 2)
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

test('commit and update', async t => {
  t.plan(6)
  const driver: Driver<any> = {
    async create (target, options) {
      t.pass()
      return {
        ...target,
        createdAt: 'now'
      }
    },
    async update (source, target, options) {
      t.pass()
      return {
        ...target,
        updatedAt: 'now'
      }
    },
    async delete (source, options) {
      t.pass()
      return {
        ...source,
        deletedAt: 'now'
      }
    }
  }

  const ctest = await create({ id: 0 }, driver)
    .commit()
    .unwrap()
  t.deepEqual(ctest, {
    id: 0,
    createdAt: 'now'
  })

  const utest = await read({ id: 1 }, driver)
    .update(data => ({ ...data }))
    .commit()
    .unwrap()
  t.deepEqual(utest, {
    id: 1,
    updatedAt: 'now'
  })

  const dtest = await read({ id: 2 }, driver)
    .delete()
    .commit()
    .unwrap()
  t.deepEqual(dtest, {
    id: 2,
    deletedAt: 'now'
  })
})

test('undo entity', async t => {
  const a = await read(42)
    .update(value => value * 2)
    .update(value => value * 2)
    .update(value => value * 2)
    .undo(2)
    .unwrap()
  t.is(a, 84)

  const b = await read(42)
    .update(value => value * 2)
    .update(value => value * 2)
    .update(value => value * 2)
    .undo(Infinity)
    .unwrap()
  t.is(b, 42)

  const c = await read(42)
    .update(value => value * 2)
    .update(value => value * 2)
    .update(value => value * 2)
    .undo(-1)
    .unwrap()
  t.is(c, 336)
})

test('redo entity', async t => {
  const result = await read(21)
    .update(value => value * 2)
    .update(value => value * 2)
    .undo()
    .undo()
    .redo()
    .unwrap()
  t.is(result, 42)
})
