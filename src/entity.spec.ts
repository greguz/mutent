import test from 'ava'

import { Driver } from './driver'
import { createEntity, isEntity, readEntity } from './entity'

interface Item {
  id: number
  value?: any
}

function next (item: Item): Item {
  return {
    ...item,
    id: item.id + 1
  }
}

test('lock', async t => {
  t.throws(() => {
    const entity = createEntity({})
    entity.update(data => data)
    entity.update(data => data)
  })
  t.throws(() => {
    const entity = createEntity({})
    entity.assign({})
    entity.assign({})
  })
  t.throws(() => {
    const entity = createEntity({})
    entity.delete()
    entity.delete()
  })
  t.throws(() => {
    const entity = createEntity({})
    entity.commit()
    entity.commit()
  })
  await t.throwsAsync(async () => {
    const entity = createEntity({})
    await entity.unwrap()
    await entity.unwrap()
  })
  t.throws(() => {
    const entity = createEntity({})
    entity.redo()
    entity.redo()
  })
  t.throws(() => {
    const entity = createEntity({})
    entity.undo()
    entity.undo()
  })
})

test('create', async t => {
  t.plan(3)

  const driver: Driver<Item> = {
    async create (target, options) {
      t.deepEqual(target, {
        id: 1,
        value: 'CREATE'
      })
      t.deepEqual(options, {
        hello: 'world'
      })
    },
    async update () {
      t.fail()
    },
    async delete () {
      t.fail()
    }
  }

  const item = await createEntity({ id: 0 }, { driver })
    .assign({ value: 'CREATE' })
    .update(next)
    .commit()
    .unwrap({ hello: 'world' })

  t.deepEqual(item, {
    id: 1,
    value: 'CREATE'
  })
})

test('update', async t => {
  t.plan(4)

  const driver: Driver<Item> = {
    async create () {
      t.fail()
    },
    async update (source, target, options) {
      t.deepEqual(source, {
        id: 0
      })
      t.deepEqual(target, {
        id: 1,
        value: 'UPDATE'
      })
      t.deepEqual(options, {
        hello: 'world'
      })
    },
    async delete () {
      t.fail()
    }
  }

  const item = await readEntity({ id: 0 }, { driver })
    .assign({ value: 'UPDATE' })
    .update(next)
    .commit()
    .unwrap({ hello: 'world' })

  t.deepEqual(item, {
    id: 1,
    value: 'UPDATE'
  })
})

test('delete', async t => {
  t.plan(3)

  const driver: Driver<Item> = {
    async create () {
      t.fail()
    },
    async update () {
      t.fail()
    },
    async delete (source, options) {
      t.deepEqual(source, {
        id: 0
      })
      t.deepEqual(options, {
        hello: 'world'
      })
    }
  }

  const item = await readEntity({ id: 0 }, { driver })
    .delete()
    .commit()
    .unwrap({ hello: 'world' })

  t.deepEqual(item, {
    id: 0
  })
})

test('undo entity', async t => {
  const a = await readEntity(2)
    .update(value => value * -1)
    .update(value => value * 2)
    .update(value => value * 10)
    .undo(2)
    .unwrap()
  t.is(a, -2)

  const b = await readEntity(2)
    .update(value => value * -1)
    .update(value => value * 2)
    .update(value => value * 10)
    .undo(Infinity)
    .unwrap()
  t.is(b, 2)

  const c = await readEntity(2)
    .update(value => value * -1)
    .update(value => value * 2)
    .update(value => value * 10)
    .undo(-1)
    .unwrap()
  t.is(c, -40)
})

test('redo entity', async t => {
  const result = await readEntity(2)
    .update(value => value * -1)
    .update(value => value * 2)
    .update(value => value * 10)
    .undo(2)
    .redo()
    .unwrap()
  t.is(result, -4)
})

test('skip nulls', async t => {
  const result = await readEntity<number | null>(null)
    .update(value => value * -1)
    .update(value => value * 2)
    .update(value => value * 10)
    .unwrap()
  t.is(result, null)
})

test('isEntity', t => {
  t.false(isEntity(undefined))
  t.false(isEntity(null))
  t.false(isEntity({}))
  t.false(isEntity([]))
  t.true(isEntity(createEntity({})))
})

test('classy entity', async t => {
  const entity = createEntity<Item>(
    { id: 0 },
    { classy: true }
  )
  entity.update(next)
  entity.update(next)
  entity.update(next)
  const result = await entity.unwrap()
  t.deepEqual(result, { id: 3 })
  t.throws(entity.unwrap)
})

test('safe create', async t => {
  t.plan(6)

  const driver: Driver<Item> = {
    create () {
      t.pass()
    }
  }

  function entity (safe: boolean | 'auto') {
    return createEntity<Item>(
      { id: 0 },
      { driver, safe }
    )
  }

  await t.throwsAsync(() => entity(true).unwrap())
  await entity('auto').unwrap()
  await entity(false).unwrap()

  await entity(true).unwrap({ safe: false })
  await entity(true).unwrap({ safe: 'auto' })
  await t.throwsAsync(() => entity('auto').unwrap({ safe: true }))
  await entity('auto').unwrap({ safe: false })
  await t.throwsAsync(() => entity(false).unwrap({ safe: true }))
  await entity(false).unwrap({ safe: 'auto' })
})

test('safe update', async t => {
  t.plan(6)

  const driver: Driver<Item> = {
    update () {
      t.pass()
    }
  }

  function entity (safe: boolean | 'auto') {
    return readEntity<Item>(
      { id: 0 },
      { driver, safe }
    ).update(next)
  }

  await t.throwsAsync(() => entity(true).unwrap())
  await entity('auto').unwrap()
  await entity(false).unwrap()

  await entity(true).unwrap({ safe: false })
  await entity(true).unwrap({ safe: 'auto' })
  await t.throwsAsync(() => entity('auto').unwrap({ safe: true }))
  await entity('auto').unwrap({ safe: false })
  await t.throwsAsync(() => entity(false).unwrap({ safe: true }))
  await entity(false).unwrap({ safe: 'auto' })
})

test('safe delete', async t => {
  t.plan(6)

  const driver: Driver<Item> = {
    delete () {
      t.pass()
    }
  }

  function entity (safe: boolean | 'auto') {
    return readEntity<Item>(
      { id: 0 },
      { driver, safe }
    ).delete()
  }

  await t.throwsAsync(() => entity(true).unwrap())
  await entity('auto').unwrap()
  await entity(false).unwrap()

  await entity(true).unwrap({ safe: false })
  await entity(true).unwrap({ safe: 'auto' })
  await t.throwsAsync(() => entity('auto').unwrap({ safe: true }))
  await entity('auto').unwrap({ safe: false })
  await t.throwsAsync(() => entity(false).unwrap({ safe: true }))
  await entity(false).unwrap({ safe: 'auto' })
})
