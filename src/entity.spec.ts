import test from 'ava'

import { createEntity, isEntity, readEntity } from './entity'
import { Writer } from './writer'

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

  const writer: Writer<Item> = {
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

  const item = await createEntity({ id: 0 }, { writer })
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

  const writer: Writer<Item> = {
    async create () {
      t.fail()
    },
    async update (target, options, source) {
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

  const item = await readEntity({ id: 0 }, { writer })
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

  const writer: Writer<Item> = {
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

  const item = await readEntity({ id: 0 }, { writer })
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

test('entity autoCommit override', async t => {
  t.plan(1)
  function entity (autoCommit: boolean) {
    return createEntity<Item>(
      { id: 0 },
      {
        autoCommit,
        safe: false,
        writer: {
          create () {
            t.pass()
          },
          update () {
            t.fail()
          },
          delete () {
            t.fail()
          }
        }
      }
    )
  }
  await entity(true).unwrap({ autoCommit: false })
  await entity(false).unwrap({ autoCommit: true })
})

test('entity safe override', async t => {
  t.plan(1)
  function entity (safe: boolean) {
    return createEntity<Item>(
      { id: 0 },
      {
        autoCommit: false,
        safe,
        writer: {
          create () {
            t.pass()
          },
          update () {
            t.pass()
          },
          delete () {
            t.pass()
          }
        }
      }
    )
  }
  await entity(true).unwrap({ safe: false })
  await t.throwsAsync(
    entity(false).unwrap({ safe: true }),
    { code: 'EMUT_NOCOM' }
  )
})

test('safe create', async t => {
  t.plan(4)

  const writer: Writer<Item> = {
    create () {
      t.pass()
    }
  }

  function entity (autoCommit?: boolean, safe?: boolean) {
    return createEntity<Item>(
      { id: 0 },
      { autoCommit, writer, safe }
    )
  }

  await entity().unwrap()
  await entity(true, true).unwrap()
  await entity(true, false).unwrap()
  await t.throwsAsync(entity(false, true).unwrap())
  await entity(false, false).unwrap()
})

test('safe update', async t => {
  t.plan(4)

  const writer: Writer<Item> = {
    update () {
      t.pass()
    }
  }

  function entity (autoCommit?: boolean, safe?: boolean) {
    return readEntity<Item>(
      { id: 0 },
      { autoCommit, writer, safe }
    ).update(next)
  }

  await entity().unwrap()
  await entity(true, true).unwrap()
  await entity(true, false).unwrap()
  await t.throwsAsync(entity(false, true).unwrap())
  await entity(false, false).unwrap()
})

test('safe delete', async t => {
  t.plan(4)

  const writer: Writer<Item> = {
    delete () {
      t.pass()
    }
  }

  function entity (autoCommit?: boolean, safe?: boolean) {
    return readEntity<Item>(
      { id: 0 },
      { autoCommit, writer, safe }
    ).delete()
  }

  await entity().unwrap()
  await entity(true, true).unwrap()
  await entity(true, false).unwrap()
  await t.throwsAsync(entity(false, true).unwrap())
  await entity(false, false).unwrap()
})

test('entity routine', async t => {
  t.plan(3)

  const entity = createEntity<Item>(
    { id: 0 },
    {
      writer: {
        create () {
          t.pass()
        },
        test (data) {
          t.pass()
          return {
            ...data,
            value: 'ROUTINE'
          }
        }
      }
    }
  )

  const data = await entity
    .update(next)
    .run('test')
    .unwrap()

  t.deepEqual(data, {
    id: 1,
    value: 'ROUTINE'
  })
})

test('no routine', async t => {
  await t.throwsAsync(
    createEntity({ id: 0 }).run('test').unwrap(),
    { code: 'EMUT_NORTN' }
  )
})
