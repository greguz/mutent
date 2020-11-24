import test from 'ava'
import { Readable, Writable, pipeline } from 'fluido'

import { createDriver } from './driver'
import { createEngine } from './engine'
import { createInstance } from './instance'
import { intentCreate, intentFilter, intentFrom } from './intent'
import { createMigration } from './migration'
import { createMutation } from './mutation'

const defaultAdapter = {
  create() {},
  update() {},
  delete() {}
}

function prepareSettings(settings = {}) {
  return {
    ...settings,
    driver: createDriver(settings.adapter || defaultAdapter, settings.hooks)
  }
}

function create(data, settings) {
  return createInstance(intentCreate(data), prepareSettings(settings))
}

function read(data, settings) {
  return createInstance(intentFrom(data), prepareSettings(settings))
}

function next(item) {
  return {
    ...item,
    id: item.id + 1
  }
}

function createIterator(iterable) {
  return iterable[Symbol.asyncIterator]
    ? iterable[Symbol.asyncIterator]()
    : iterable[Symbol.iterator]()
}

async function consumeIterable(iterable, handler) {
  const iterator = createIterator(iterable)
  let active = true
  const results = []
  while (active) {
    const { done, value } = await iterator.next()
    if (done) {
      active = false
    } else if (handler) {
      results.push(await handler(value))
    } else {
      results.push(value)
    }
  }
  return results
}

test('one:unwrap', async t => {
  const out = await create({ id: 0, value: 'UNWRAP' }).unwrap()
  t.deepEqual(out, { id: 0, value: 'UNWRAP' })
})

test('one:iterate', async t => {
  const out = await consumeIterable(
    create({ id: 0, value: 'ITERATE' }).iterate()
  )
  t.deepEqual(out, [{ id: 0, value: 'ITERATE' }])
})

test('many:unwrap', async t => {
  const out = await read({ id: 0, value: 'UNWRAP' }).unwrap()
  t.deepEqual(out, { id: 0, value: 'UNWRAP' })
})

test('many:iterate', async t => {
  const out = await consumeIterable(read({ id: 0, value: 'ITERATE' }).iterate())
  t.deepEqual(out, [{ id: 0, value: 'ITERATE' }])
})

test('instance:condition', async t => {
  const entity = read({ id: 0 })

  const mDelete = createMutation().assign({ value: 'DELETE' })
  const mUpdate = createMutation().assign({ value: 'UPDATE' })

  const a = await entity.if(true, mDelete).unless(true, mUpdate).unwrap()
  t.deepEqual(a, { id: 0, value: 'DELETE' })

  const b = await entity
    .unless(() => false, mUpdate)
    .if(() => false, mDelete)
    .unwrap()
  t.deepEqual(b, { id: 0, value: 'UPDATE' })
})

test('instance:alteration', async t => {
  const data = await create({ a: 'test' })
    .if(true, mutation => mutation.assign({ b: 'free' }))
    .unwrap()
  t.deepEqual(data, {
    a: 'test',
    b: 'free'
  })
})

test('instance:mutate', async t => {
  const entity = read({ id: 0 })
  const mutation = createMutation().assign({ value: 'UPDATE' })
  const out = await entity.mutate(mutation).unwrap()
  t.deepEqual(out, { id: 0, value: 'UPDATE' })
})

test('instance:invalid-mutation', async t => {
  const engine = createEngine()

  const validate = engine.compile({
    type: 'object',
    properties: {
      value: {
        type: 'number'
      }
    },
    required: ['value']
  })

  await t.throwsAsync(
    read({ value: 42 }, { validate }).update(JSON.stringify).unwrap(),
    { code: 'EMUT_INVALID_MUTATION' }
  )
})

test('instance:create-one', async t => {
  t.plan(3)

  const adapter = {
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

  const item = await create({ id: 0 }, { adapter })
    .assign({ value: 'CREATE' })
    .update(next)
    .commit()
    .unwrap({ hello: 'world' })

  t.deepEqual(item, {
    id: 1,
    value: 'CREATE'
  })
})

test('instance:update-one', async t => {
  t.plan(4)

  const adapter = {
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

  const item = await read({ id: 0 }, { adapter })
    .assign({ value: 'UPDATE' })
    .update(next)
    .commit()
    .unwrap({ hello: 'world' })

  t.deepEqual(item, {
    id: 1,
    value: 'UPDATE'
  })
})

test('instance:delete-one', async t => {
  t.plan(3)

  const adapter = {
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

  const item = await read({ id: 0 }, { adapter })
    .delete()
    .commit()
    .unwrap({ hello: 'world' })

  t.deepEqual(item, {
    id: 0
  })
})

test('instance:undo', async t => {
  const a = await read(2)
    .update(value => value * -1)
    .update(value => value * 2)
    .update(value => value * 10)
    .undo(2)
    .unwrap()
  t.is(a, -2)

  const b = await read(2)
    .update(value => value * -1)
    .update(value => value * 2)
    .update(value => value * 10)
    .undo(Infinity)
    .unwrap()
  t.is(b, 2)

  const c = await read(2)
    .update(value => value * -1)
    .update(value => value * 2)
    .update(value => value * 10)
    .undo(-1)
    .unwrap()
  t.is(c, -40)
})

test('instance:redo', async t => {
  const result = await read(2)
    .update(value => value * -1)
    .update(value => value * 2)
    .update(value => value * 10)
    .undo(2)
    .redo()
    .unwrap()
  t.is(result, -4)
})

test('instance:classy', async t => {
  const entity = create({ id: 0 }, { classy: true })
  entity.update(next)
  entity.update(next)
  entity.update(next)
  const result = await entity.unwrap()
  t.deepEqual(result, { id: 3 })
  t.throws(entity.unwrap)
})

test('instance:manualCommit-override', async t => {
  t.plan(1)
  function entity(manualCommit) {
    return create(
      { id: 0 },
      {
        manualCommit,
        unsafe: true,
        adapter: {
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
  await entity(true).unwrap({ manualCommit: false })
  await entity(false).unwrap({ manualCommit: true })
})

test('instance:unsafe-override', async t => {
  t.plan(1)
  function entity(unsafe) {
    return create(
      { id: 0 },
      {
        manualCommit: true,
        unsafe,
        adapter: {
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
  await entity(false).unwrap({ unsafe: true })
  await t.throwsAsync(entity(true).unwrap({ unsafe: false }), {
    code: 'EMUT_UNSAFE'
  })
})

test('instance:safe-create', async t => {
  t.plan(4)

  const adapter = {
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

  function entity(manualCommit, unsafe) {
    return create({ id: 0 }, { adapter, manualCommit, unsafe })
  }

  await entity().unwrap()
  await entity(false, false).unwrap()
  await t.throwsAsync(entity(true, false).unwrap())
  await entity(false, true).unwrap()
  await entity(true, true).unwrap()
})

test('instance:safe-update', async t => {
  t.plan(4)

  const adapter = {
    create() {
      t.fail()
    },
    update() {
      t.pass()
    },
    delete() {
      t.fail()
    }
  }

  function entity(manualCommit, unsafe) {
    return read({ id: 0 }, { adapter, manualCommit, unsafe }).update(next)
  }

  await entity().unwrap()
  await entity(false, false).unwrap()
  await t.throwsAsync(entity(true, false).unwrap())
  await entity(false, true).unwrap()
  await entity(true, true).unwrap()
})

test('instance:safe-delete', async t => {
  t.plan(4)

  const adapter = {
    create() {
      t.fail()
    },
    update() {
      t.fail()
    },
    delete() {
      t.pass()
    }
  }

  function entity(manualCommit, unsafe) {
    return read({ id: 0 }, { adapter, manualCommit, unsafe }).delete()
  }

  await entity().unwrap()
  await entity(false, false).unwrap()
  await t.throwsAsync(entity(true, false).unwrap())
  await entity(false, true).unwrap()
  await entity(true, true).unwrap()
})

function bind(t, mode = {}) {
  const adapter = {
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
  return { adapter }
}

function getItems(count = 16) {
  const items = []
  for (let i = 0; i < count; i++) {
    items.push({ id: i * 2 })
  }
  return items
}

test('create many', async t => {
  t.plan(35)
  const results = await create(getItems(), bind(t, { create: true }))
    .commit()
    .unwrap({ db: 'test' })
  t.is(results.length, 16)
  t.is(results[0].id, 0)
  t.is(results[15].id, 30)
})

test('update many', async t => {
  t.plan(35)
  const results = await read(getItems(), bind(t, { update: true }))
    .update(data => ({ id: data.id / 2 }))
    .commit()
    .unwrap({ db: 'test' })
  t.is(results.length, 16)
  t.is(results[0].id, 0)
  t.is(results[15].id, 15)
})

test('assign many', async t => {
  t.plan(37)
  const results = await read(getItems(), bind(t, { update: true }))
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
  const results = await read(getItems(), bind(t, { delete: true }))
    .delete()
    .commit()
    .unwrap({ db: 'test' })
  t.is(results.length, 16)
  t.is(results[0].id, 0)
  t.is(results[15].id, 30)
})

test('insert-error', async t => {
  await t.throwsAsync(async () => {
    await create([1])
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
      Readable.from(
        create(getItems(), bind(t, { create: true }))
          .commit()
          .iterate({ db: 'test' })
      ),
      new Writable({
        objectMode: true,
        write(data, encoding, callback) {
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
  function getErroredStream(err) {
    return new Readable({
      read() {
        this.emit('error', err)
      }
    })
  }

  await t.throwsAsync(async () => {
    await new Promise((resolve, reject) => {
      pipeline(
        Readable.from(
          createInstance(intentFilter(), {
            adapter: {
              filter() {
                return getErroredStream(new Error())
              }
            }
          }).iterate()
        ),
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
  const results = await read(getItems())
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
  const results = await read(getItems())
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

test('instance:migration', async t => {
  const migration = createMigration({
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
  })

  const item = {
    version: 0,
    id: 0
  }

  const data = await read(item, { migration }).unwrap()

  t.deepEqual(data, {
    version: 2,
    id: 1,
    value: 'MIGRATED'
  })
})
