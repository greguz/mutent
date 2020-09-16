import test, { ExecutionContext } from 'ava'
import { Readable, Writable, collect, pipeline, subscribe } from 'fluido'

import {
  createEntities,
  createEntity,
  readEntities,
  readEntity
} from './instance'
import { createMutation } from './mutation'
import { Writer } from './writer'

interface Item {
  version?: number
  id: number
  value?: any
}

function next(item: Item): Item {
  return {
    ...item,
    id: item.id + 1
  }
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

  const mDelete = createMutation<Item>().assign({ value: 'DELETE' })
  const mUpdate = createMutation<Item>().assign({ value: 'UPDATE' })

  const a = await entity.if(true, mDelete).unless(true, mUpdate).unwrap()
  t.deepEqual(a, { id: 0, value: 'DELETE' })

  const b = await entity
    .unless(() => false, mUpdate)
    .if(() => false, mDelete)
    .unwrap()
  t.deepEqual(b, { id: 0, value: 'UPDATE' })
})

test('instance#mutate', async t => {
  const entity = readEntity<Item>({ id: 0 })
  const mutation = createMutation<Item>().assign({ value: 'UPDATE' })
  const out = await entity.mutate(mutation).unwrap()
  t.deepEqual(out, { id: 0, value: 'UPDATE' })
})

test('create one', async t => {
  t.plan(3)

  const writer: Writer<Item> = {
    async create(target, options) {
      t.deepEqual(target, {
        id: 1,
        value: 'CREATE'
      })
      t.is(options.hello, 'world')
    },
    async update() {
      t.fail()
    },
    async delete() {
      t.fail()
    }
  }

  const item = await createEntity({ id: 0 }, { driver: writer })
    .assign({ value: 'CREATE' })
    .update(next)
    .commit()
    .unwrap({ hello: 'world' })

  t.deepEqual(item, {
    id: 1,
    value: 'CREATE'
  })
})

test('update one', async t => {
  t.plan(4)

  const writer: Writer<Item> = {
    async create() {
      t.fail()
    },
    async update(source, target, options) {
      t.deepEqual(source, {
        id: 0
      })
      t.deepEqual(target, {
        id: 1,
        value: 'UPDATE'
      })
      t.is(options.hello, 'world')
    },
    async delete() {
      t.fail()
    }
  }

  const item = await readEntity({ id: 0 }, { driver: writer })
    .assign({ value: 'UPDATE' })
    .update(next)
    .commit()
    .unwrap({ hello: 'world' })

  t.deepEqual(item, {
    id: 1,
    value: 'UPDATE'
  })
})

test('delete one', async t => {
  t.plan(3)

  const writer: Writer<Item> = {
    async create() {
      t.fail()
    },
    async update() {
      t.fail()
    },
    async delete(source, options) {
      t.deepEqual(source, {
        id: 0
      })
      t.is(options.hello, 'world')
    }
  }

  const item = await readEntity({ id: 0 }, { driver: writer })
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

test('classy entity', async t => {
  const entity = createEntity<Item>({ id: 0 }, { classy: true })
  entity.update(next)
  entity.update(next)
  entity.update(next)
  const result = await entity.unwrap()
  t.deepEqual(result, { id: 3 })
  t.throws(entity.unwrap)
})

test('entity autoCommit override', async t => {
  t.plan(1)
  function entity(autoCommit: boolean) {
    return createEntity<Item>(
      { id: 0 },
      {
        autoCommit,
        safe: false,
        driver: {
          create() {
            t.pass()
          },
          update() {
            t.fail()
          },
          delete() {
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
  function entity(safe: boolean) {
    return createEntity<Item>(
      { id: 0 },
      {
        autoCommit: false,
        safe,
        driver: {
          create() {
            t.pass()
          },
          update() {
            t.pass()
          },
          delete() {
            t.pass()
          }
        }
      }
    )
  }
  await entity(true).unwrap({ safe: false })
  await t.throwsAsync(entity(false).unwrap({ safe: true }), {
    code: 'EMUT_UNSAFE'
  })
})

test('safe create', async t => {
  t.plan(4)

  const writer: Writer<Item> = {
    create() {
      t.pass()
    }
  }

  function entity(autoCommit?: boolean, safe?: boolean) {
    return createEntity<Item>({ id: 0 }, { autoCommit, driver: writer, safe })
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
    update() {
      t.pass()
    }
  }

  function entity(autoCommit?: boolean, safe?: boolean) {
    return readEntity<Item>(
      { id: 0 },
      { autoCommit, driver: writer, safe }
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
    delete() {
      t.pass()
    }
  }

  function entity(autoCommit?: boolean, safe?: boolean) {
    return readEntity<Item>(
      { id: 0 },
      { autoCommit, driver: writer, safe }
    ).delete()
  }

  await entity().unwrap()
  await entity(true, true).unwrap()
  await entity(true, false).unwrap()
  await t.throwsAsync(entity(false, true).unwrap())
  await entity(false, false).unwrap()
})

interface CommitMode {
  create?: boolean
  update?: boolean
  delete?: boolean
}

function bind(t: ExecutionContext, mode: Partial<CommitMode> = {}) {
  const writer: Writer<Item> = {
    async create(target, options) {
      if (mode.create === true) {
        t.pass()
      } else {
        t.fail()
      }
      t.is(options.db, 'test')
    },
    async update(source, target, options) {
      if (mode.update === true) {
        t.pass()
      } else {
        t.fail()
      }
      t.is(options.db, 'test')
    },
    async delete(source, options) {
      if (mode.delete === true) {
        t.pass()
      } else {
        t.fail()
      }
      t.is(options.db, 'test')
    }
  }
  return { driver: writer }
}

function getItems(count: number = 16) {
  const items: Item[] = []
  for (let i = 0; i < count; i++) {
    items.push({ id: i * 2 })
  }
  return items
}

test('create many', async t => {
  t.plan(35)
  const results = await createEntities(getItems(), bind(t, { create: true }))
    .commit()
    .unwrap({ db: 'test' })
  t.is(results.length, 16)
  t.is(results[0].id, 0)
  t.is(results[15].id, 30)
})

test('update many', async t => {
  t.plan(35)
  const results = await readEntities(getItems(), bind(t, { update: true }))
    .update(data => ({ id: data.id / 2 }))
    .commit()
    .unwrap({ db: 'test' })
  t.is(results.length, 16)
  t.is(results[0].id, 0)
  t.is(results[15].id, 15)
})

test('assign many', async t => {
  t.plan(37)
  const results = await readEntities(getItems(), bind(t, { update: true }))
    .assign({ value: 42 })
    .commit()
    .unwrap({ db: 'test' })
  t.is(results.length, 16)
  t.is(results[0].id, 0)
  t.is(results[0].value, 42)
  t.is(results[15].id, 30)
  t.is(results[15].value, 42)
})

test('delete many', async t => {
  t.plan(35)
  const results = await readEntities(getItems(), bind(t, { delete: true }))
    .delete()
    .commit()
    .unwrap({ db: 'test' })
  t.is(results.length, 16)
  t.is(results[0].id, 0)
  t.is(results[15].id, 30)
})

test('insert-error', async t => {
  await t.throwsAsync(async () => {
    await createEntities([1])
      .update(async () => {
        throw new Error('TEST')
      })
      .unwrap()
  })
})

test('stream many', async t => {
  t.plan(48)
  await new Promise((resolve, reject) => {
    let index = 0
    pipeline(
      createEntities(getItems(), bind(t, { create: true }))
        .commit()
        .stream({ db: 'test' }),
      new Writable({
        objectMode: true,
        write(data: Item, encoding, callback) {
          t.is(data.id, index++ * 2)
          callback()
        }
      }),
      err => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      }
    )
  })
})

test('stream-error', async t => {
  function getErroredStream(err: any) {
    return new Readable({
      read() {
        this.emit('error', err)
      }
    })
  }

  await t.throwsAsync(async () => {
    await new Promise((resolve, reject) => {
      pipeline(
        createEntities(getErroredStream(new Error())).stream(),
        new Writable({
          objectMode: true,
          write(chunk, encoding, callback) {
            callback()
          }
        }),
        err => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        }
      )
    })
  })
})

test('undo entitites', async t => {
  t.plan(3)
  const results = await readEntities(getItems())
    .update(data => ({ id: data.id * -1 }))
    .update(data => ({ id: data.id * 2 }))
    .delete()
    .undo(2)
    .unwrap({ db: 'test' })
  t.is(results.length, 16)
  t.is(results[0].id, -0)
  t.is(results[15].id, -30)
})

test('redo entitites', async t => {
  t.plan(3)
  const results = await readEntities(getItems())
    .update(data => ({ id: data.id * -1 }))
    .update(data => ({ id: data.id * 2 }))
    .update(data => ({ id: data.id * 10 }))
    .undo(2)
    .redo(2)
    .unwrap()
  t.is(results.length, 16)
  t.is(results[0].id, -0)
  t.is(results[15].id, -600)
})

test('migration', async t => {
  const item: Item = {
    version: 0,
    id: 0
  }

  const data = await readEntity(item, {
    migrationStrategies: {
      1: function (data) {
        return {
          ...data,
          version: 1,
          id: data.id + 1
        }
      },
      2: function (data) {
        return {
          ...data,
          version: 2,
          value: 'MIGRATED'
        }
      }
    }
  }).unwrap()

  t.deepEqual(data, {
    version: 2,
    id: 1,
    value: 'MIGRATED'
  })
})
