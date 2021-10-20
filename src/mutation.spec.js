import test from 'ava'

import { Mutation } from './mutation'
import { assign, pipe, update } from './mutators'
import { normalizeHooks } from './options'

function buildMutation (intent, argument, context = {}) {
  return new Mutation({
    adapter: {},
    argument,
    commitMode: 'AUTO',
    intent,
    mutators: [],
    writeMode: 'AUTO',
    writeSize: 16,
    ...context,
    hooks: normalizeHooks(context.hooks)
  })
}

function create (data, context) {
  return buildMutation('CREATE', data, context)
}

function read (data, context) {
  return buildMutation('FROM', data, context)
}

function next (item) {
  return {
    ...item,
    id: item.id + 1
  }
}

async function consume (iterable) {
  const results = []
  for await (const value of iterable) {
    results.push(value)
  }
  return results
}

test('one:unwrap', async t => {
  const context = {
    adapter: {
      create () {}
    }
  }
  const out = await create({ id: 0, value: 'UNWRAP' }, context).unwrap()
  t.deepEqual(out, { id: 0, value: 'UNWRAP' })
})

test('one:iterate', async t => {
  const context = {
    adapter: {
      create () {}
    }
  }
  const out = await consume(create({ id: 0, value: 'ITERATE' }, context).iterate())
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
  const context = {
    adapter: {
      update () {}
    }
  }

  const entity = read({ id: 0 }, context)

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

  const f = await entity.if(false, mUpdate).unwrap()
  t.deepEqual(f, { id: 0 })

  const g = await entity.if(false, mDelete).unwrap()
  t.deepEqual(g, { id: 0 })
})

test('instance:pipe', async t => {
  const context = {
    adapter: {
      update () {}
    }
  }

  const out = await read({ id: 0 }, context)
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
    async create (target, options) {
      t.deepEqual(target, {
        id: 1,
        value: 'CREATE'
      })
      t.is(options.hello, 'world')
    },
    async update () {
      t.fail()
    },
    async delete () {
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
      t.is(options.hello, 'world')
    },
    async delete () {
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

function getItems (count = 16) {
  const items = []
  for (let i = 0; i < count; i++) {
    items.push({ id: i * 2 })
  }
  return items
}

test('create many', async t => {
  t.plan(35)
  const context = {
    adapter: {
      create (data, options) {
        t.pass()
        t.is(options.db, 'test')
      }
    }
  }
  const results = await create(getItems(), context)
    .commit()
    .unwrap({ db: 'test' })
  t.is(results.length, 16)
  t.is(results[0].id, 0)
  t.is(results[15].id, 30)
})

test('update many', async t => {
  t.plan(35)
  const context = {
    adapter: {
      update (oldData, newData, options) {
        t.pass()
        t.is(options.db, 'test')
      }
    }
  }
  const results = await read(getItems(), context)
    .update(data => ({ id: data.id / 2 }))
    .commit()
    .unwrap({ db: 'test' })
  t.is(results.length, 16)
  t.is(results[0].id, 0)
  t.is(results[15].id, 15)
})

test('assign many', async t => {
  t.plan(37)
  const context = {
    adapter: {
      update (oldData, newData, options) {
        t.pass()
        t.is(options.db, 'test')
      }
    }
  }
  const results = await read(getItems(), context)
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
  const context = {
    adapter: {
      delete (data, options) {
        t.pass()
        t.is(options.db, 'test')
      }
    }
  }
  const results = await read(getItems(), context)
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
