import test from 'ava'

import { Mutation } from './mutation'
import { assign, pipe, update } from './mutators'

const defaultAdapter = {
  create() {},
  update() {},
  delete() {}
}

function create(data, context) {
  return Mutation.create({
    adapter: defaultAdapter,
    argument: data,
    commitMode: 'AUTO',
    intent: 'CREATE',
    hooks: {},
    ...context
  })
}

function read(data, context) {
  return Mutation.create({
    adapter: defaultAdapter,
    argument: data,
    commitMode: 'AUTO',
    intent: 'FROM',
    hooks: {},
    ...context
  })
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

  const mDelete = assign({ value: 'DELETE' })
  const mUpdate = assign({ value: 'UPDATE' })

  const a = await entity.unwrap()
  t.deepEqual(a, { id: 0 })

  const b = await entity.if(true, mDelete, mUpdate).unwrap()
  t.deepEqual(b, { id: 0, value: 'DELETE' })

  const c = await entity.if(false, mDelete, mUpdate).unwrap()
  t.deepEqual(c, { id: 0, value: 'UPDATE' })

  const d = await entity.if(data => data.id === 0, mDelete, mUpdate).unwrap()
  t.deepEqual(d, { id: 0, value: 'DELETE' })

  const e = await entity.if(data => data.id !== 0, mDelete, mUpdate).unwrap()
  t.deepEqual(e, { id: 0, value: 'UPDATE' })

  const f = await entity.if(true, undefined, mUpdate).unwrap()
  t.deepEqual(f, { id: 0 })

  const g = await entity.if(false, mDelete).unwrap()
  t.deepEqual(g, { id: 0 })
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
  await t.throwsAsync(
    create([1])
      .update(async () => {
        throw new Error('TEST')
      })
      .unwrap()
  )
})
