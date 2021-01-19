import test from 'ava'

import { createDriver } from './driver'
import { createInstance } from './instance'
import { intentCreate, intentFrom } from './intent'
import { createMigration } from './migration'
import { assign, pipe, update } from './mutators'

const defaultAdapter = {
  create() {},
  update() {},
  delete() {}
}

function prepareSettings(settings = {}) {
  return {
    historySize: 8,
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

async function consume(iterable, handler) {
  const results = []
  for await (const value of iterable) {
    if (handler) {
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
  const out = await consume(create({ id: 0, value: 'ITERATE' }).iterate())
  t.deepEqual(out, [{ id: 0, value: 'ITERATE' }])
})

test('many:unwrap', async t => {
  const out = await read({ id: 0, value: 'UNWRAP' }).unwrap()
  t.deepEqual(out, { id: 0, value: 'UNWRAP' })
})

test('many:iterate', async t => {
  const out = await consume(read({ id: 0, value: 'ITERATE' }).iterate())
  t.deepEqual(out, [{ id: 0, value: 'ITERATE' }])
})

test('instance:condition', async t => {
  const entity = read({ id: 0 })

  const mDelete = update(data => ({ ...data, value: 'DELETE' }))
  const mUpdate = update(data => ({ ...data, value: 'UPDATE' }))

  const a = await entity.if(true, mDelete).unless(true, mUpdate).unwrap()
  t.deepEqual(a, { id: 0, value: 'DELETE' })

  const b = await entity
    .unless(() => false, mUpdate)
    .if(() => false, mDelete)
    .unwrap()
  t.deepEqual(b, { id: 0, value: 'UPDATE' })
})

test('instance:pipe', async t => {
  const out = await read({ id: 0 })
    .pipe(
      pipe(
        assign({ value: 'update' }),
        update(data => ({ ...data, value: data.value.toUpperCase() }))
      )
    )
    .unwrap()

  t.deepEqual(out, { id: 0, value: 'UPDATE' })
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
    .undo(0)
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

test('instance:mutable', async t => {
  const entity = create({ id: 0 }, { mutable: true })
  entity.update(next)
  entity.update(next)
  entity.update(next)
  const result = await entity.unwrap()
  t.deepEqual(result, { id: 3 })
  t.throws(entity.unwrap)
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
    .update((data, n) => ({ id: data.id / n }), 2)
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
  const migration = createMigration(2, {
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
