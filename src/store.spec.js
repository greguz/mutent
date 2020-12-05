import test from 'ava'
import { Readable } from 'stream'

import { createStore } from './store'

function createAdapter(items = []) {
  return {
    find(predicate) {
      return items.find(predicate)
    },
    filter(predicate) {
      return items.filter(predicate)
    },
    create(data) {
      items.push(data)
    },
    update(oldData, newData) {
      items.splice(
        items.findIndex(item => item === oldData),
        1,
        newData
      )
    },
    delete(data) {
      items.splice(
        items.findIndex(item => item === data),
        1
      )
    }
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

test('store:settings', t => {
  t.throws(() => createStore())
  t.throws(() => createStore({}))
  t.throws(() => createStore({ name: '', adapter: {} }))
  t.throws(() => createStore({ name: 'store:settings' }))
  t.throws(() => createStore({ adapter: {} }))
  createStore({ name: 'store:settings', adapter: {} })
})

test('store:create', async t => {
  const items = []
  const store = createStore({
    name: 'store:create',
    adapter: createAdapter(items)
  })

  const huey = { id: 0, name: 'Huey Duck' }
  const dewey = { id: 1, name: 'Dewey Duck' }
  const louie = { id: 2, name: 'Louie Duck' }
  const donald = { id: 3, name: 'Donald Duck' }
  const scrooge = { id: 4, name: 'Scrooge McDuck' }

  const uZero = await store.create([]).unwrap()
  t.deepEqual(uZero, [])
  t.is(items.length, 0)

  const uOne = await store.create(huey).unwrap()
  t.deepEqual(uOne, huey)
  t.deepEqual(items, [huey])

  const uMany = await store.create([dewey, louie]).unwrap()
  t.deepEqual(uMany, [dewey, louie])
  t.deepEqual(items, [huey, dewey, louie])

  const iZero = await consume(store.create([]).iterate())
  t.deepEqual(iZero, [])
  t.is(items.length, 3)

  const iOne = await consume(store.create(donald).iterate())
  t.deepEqual(iOne, [donald])
  t.deepEqual(items, [huey, dewey, louie, donald])

  const iMany = await consume(store.create([scrooge]).iterate())
  t.deepEqual(iMany, [scrooge])
  t.deepEqual(items, [huey, dewey, louie, donald, scrooge])
})

test('store:find', async t => {
  const items = [
    { id: 0, name: 'Mad Hatter' },
    { id: 1, name: 'March Hare' },
    { id: 2, name: 'Dormouse' }
  ]
  const store = createStore({
    name: 'store:find',
    adapter: createAdapter(items)
  })

  t.is(await store.find(item => item.id === 0).unwrap(), items[0])
  t.is(await store.find(item => item.name === 'March Hare').unwrap(), items[1])
  t.is(await store.find(item => /mouse/.test(item.name)).unwrap(), items[2])
  t.is(await store.find(item => item.id > 2).unwrap(), null)

  t.deepEqual(await consume(store.find(item => item.id === 2).iterate()), [
    items[2]
  ])
  t.deepEqual(await consume(store.find(() => false).iterate()), [])
})

test('store:read', async t => {
  const items = [{ id: 0, name: 'Tom Orvoloson Riddle', nose: false }]
  const store = createStore({
    name: 'store:read',
    adapter: createAdapter(items)
  })

  t.is(await store.read(item => item.nose !== true).unwrap(), items[0])
  await t.throwsAsync(store.read(item => item.nose === true).unwrap(), {
    code: 'EMUT_NOT_FOUND'
  })

  t.deepEqual(await consume(store.read(item => item.id === 0).iterate()), [
    items[0]
  ])
  await t.throwsAsync(consume(store.read(() => false).iterate()), {
    code: 'EMUT_NOT_FOUND'
  })
})

test('store:filter', async t => {
  const items = [
    { id: 0, name: 'Yakko', gender: 'male', protagonist: true },
    { id: 1, name: 'Wakko', gender: 'male', protagonist: true },
    { id: 2, name: 'Dot', gender: 'female', protagonist: true },
    { id: 3, name: 'Dr. Otto Scratchansniff', gender: 'male', human: true },
    { id: 4, name: 'Hello Nurse', gender: 'female', human: true },
    { id: 5, name: 'Ralph T. Guard', gender: 'male', human: true },
    { id: 6, name: 'Thaddeus Plotz ', gender: 'male', human: true }
  ]
  const store = createStore({
    name: 'store:filter',
    adapter: createAdapter(items)
  })

  const a = await store.filter(item => item.protagonist === true).unwrap()
  t.is(a.length, 3)

  const b = await store.filter(item => item.gender === 'female').unwrap()
  t.is(b.length, 2)

  const c = await store.filter(item => item.human === true).unwrap()
  t.is(c.length, 4)

  const d = await consume(store.filter(() => true).iterate())
  t.is(d.length, items.length)
})

test('store:schema', async t => {
  class Teapot {}

  const schema = {
    type: 'object',
    properties: {
      date: {
        anyOf: [
          {
            type: 'string',
            format: 'date-time',
            parse: 'toDate'
          },
          {
            type: 'object',
            instanceof: 'Date'
          }
        ]
      },
      teapot: {
        type: 'object',
        instanceof: 'Teapot'
      }
    },
    required: ['date', 'teapot'],
    additionalProperties: false
  }

  const store = createStore({
    name: 'store:schema',
    constructors: {
      Teapot
    },
    adapter: createAdapter(),
    parsers: {
      toDate: value => new Date(value)
    },
    schema
  })

  const data = await store
    .create({
      date: '2020-09-02T16:29:34.070Z',
      teapot: new Teapot()
    })
    .unwrap()
  t.true(data.date instanceof Date)
  t.is(data.date.toISOString(), '2020-09-02T16:29:34.070Z')
  t.true(data.teapot instanceof Teapot)

  await t.throwsAsync(store.from({}).unwrap(), {
    code: 'EMUT_INVALID_DATA'
  })
  await t.throwsAsync(
    store
      .create({
        date: '2020-09-02T16:29:34.070Z',
        teapot: new Teapot()
      })
      .assign({ teapot: {} })
      .commit()
      .unwrap(),
    { code: 'EMUT_INVALID_WRITE' }
  )
  await t.throwsAsync(
    store
      .read(() => true)
      .assign({ teapot: {} })
      .unwrap(),
    { code: 'EMUT_INVALID_WRITE' }
  )
})

test('store:migration', async t => {
  const items = [{ id: 0, name: 'Gandalf' }]

  const store = createStore({
    name: 'store:migration',
    adapter: createAdapter(items),
    migrationStrategies: {
      1: data => ({ ...data, v: 1, migrated: true })
    },
    versionKey: 'v',
    version: 1
  })

  const a = await store
    .create({
      id: 1,
      name: 'Bilbo'
    })
    .unwrap()
  t.deepEqual(a, {
    id: 1,
    v: 1,
    migrated: true,
    name: 'Bilbo'
  })

  const b = await store
    .read(item => item.name === 'Gandalf')
    .update(data => ({ ...data, white: true }))
    .unwrap()
  t.deepEqual(b, {
    id: 0,
    v: 1,
    migrated: true,
    name: 'Gandalf',
    white: true
  })

  const c = await store
    .create({
      id: 2,
      v: 1,
      name: 'Sam'
    })
    .unwrap()
  t.deepEqual(c, {
    id: 2,
    v: 1,
    name: 'Sam'
  })
})

test('hooks:find', async t => {
  t.plan(2)

  const store = createStore({
    name: 'hooks:find',
    adapter: createAdapter(),
    hooks: {
      onFind(query, options) {
        t.true(typeof query === 'function')
        t.deepEqual(options, { some: 'options' })
      }
    }
  })

  await store.find(() => true).unwrap({ some: 'options' })
})

test('hooks:filter', async t => {
  t.plan(2)

  const store = createStore({
    name: 'hooks:filter',
    adapter: createAdapter(),
    hooks: {
      onFilter(query, options) {
        t.true(typeof query === 'function')
        t.deepEqual(options, { some: 'options' })
      }
    }
  })

  await store.filter(() => true).unwrap({ some: 'options' })
})

test('hooks:data', async t => {
  t.plan(15)

  let expectedIntent

  const store = createStore({
    name: 'hooks:data',
    adapter: createAdapter(),
    hooks: {
      onData(intent, data, options) {
        t.is(intent, expectedIntent)
        t.deepEqual(data, { a: 'document' })
        t.deepEqual(options, { some: 'options' })
      }
    }
  })

  await store.find(() => false).unwrap()

  expectedIntent = 'CREATE'
  await store.create({ a: 'document' }).unwrap({ some: 'options' })

  expectedIntent = 'FIND'
  await store.find(() => true).unwrap({ some: 'options' })

  expectedIntent = 'READ'
  const data = await store.read(() => true).unwrap({ some: 'options' })

  expectedIntent = 'FILTER'
  await store.filter(() => true).unwrap({ some: 'options' })

  expectedIntent = 'FROM'
  await store.from(data).unwrap({ some: 'options' })
})

test('hooks:create', async t => {
  t.plan(4)

  const store = createStore({
    name: 'hooks:filter',
    adapter: createAdapter(),
    hooks: {
      beforeCreate(data, options) {
        t.deepEqual(data, { a: 'document' })
        t.deepEqual(options, { some: 'options' })
      },
      afterCreate(data, options) {
        t.deepEqual(data, { a: 'document' })
        t.deepEqual(options, { some: 'options' })
      }
    }
  })

  await store.create({ a: 'document' }).unwrap({ some: 'options' })
})

test('hooks:update', async t => {
  t.plan(6)

  const store = createStore({
    name: 'hooks:update',
    adapter: createAdapter([{ a: 'document' }]),
    hooks: {
      beforeUpdate(oldData, newData, options) {
        t.deepEqual(oldData, { a: 'document' })
        t.deepEqual(newData, { a: 'document', updated: true })
        t.deepEqual(options, { some: 'options' })
      },
      afterUpdate(oldData, newData, options) {
        t.deepEqual(oldData, { a: 'document' })
        t.deepEqual(newData, { a: 'document', updated: true })
        t.deepEqual(options, { some: 'options' })
      }
    }
  })

  await store
    .read(() => true)
    .assign({ updated: true })
    .unwrap({ some: 'options' })
})

test('hooks:delete', async t => {
  t.plan(4)

  const store = createStore({
    name: 'hooks:delete',
    adapter: createAdapter([{ a: 'document' }]),
    hooks: {
      beforeDelete(data, options) {
        t.deepEqual(data, { a: 'document' })
        t.deepEqual(options, { some: 'options' })
      },
      afterDelete(data, options) {
        t.deepEqual(data, { a: 'document' })
        t.deepEqual(options, { some: 'options' })
      }
    }
  })

  await store
    .read(() => true)
    .delete()
    .unwrap({ some: 'options' })
})

test('store:manualCommit', async t => {
  const items = []

  const store = createStore({
    name: 'store:manualCommit',
    adapter: createAdapter(items),
    manualCommit: true,
    unsafe: false
  })

  await t.throwsAsync(store.create({ id: 0 }).unwrap(), {
    code: 'EMUT_UNSAFE'
  })
  t.is(items.length, 0)

  await store.create({ id: 1 }).unwrap({ mutent: { unsafe: true } })
  t.is(items.length, 0)

  await store.create({ id: 2 }).commit().unwrap()
  t.deepEqual(items, [{ id: 2 }])

  await store.create({ id: 3 }).unwrap({ mutent: { manualCommit: false } })
  t.deepEqual(items, [{ id: 2 }, { id: 3 }])
})

test('store:unsafe', async t => {
  const items = []

  const store = createStore({
    name: 'store:unsafe',
    adapter: createAdapter(items),
    manualCommit: true,
    unsafe: true
  })

  await store.create({ id: 0 }).unwrap()
  t.is(items.length, 0)

  await t.throwsAsync(
    store.create({ id: 1 }).unwrap({ mutent: { unsafe: false } }),
    { code: 'EMUT_UNSAFE' }
  )
  t.is(items.length, 0)

  await store.create({ id: 2 }).commit().unwrap()
  t.deepEqual(items, [{ id: 2 }])

  await store.create({ id: 3 }).unwrap({ mutent: { manualCommit: false } })
  t.deepEqual(items, [{ id: 2 }, { id: 3 }])
})

test('store:mutable', async t => {
  const immStore = createStore({
    name: 'store:mutable',
    adapter: createAdapter()
    // mutable: false (default)
  })

  const a = immStore.read()
  const b = a.update(data => data)
  t.false(a === b)

  const mutStore = createStore({
    name: 'store:mutable',
    adapter: createAdapter(),
    mutable: true
  })

  const c = mutStore.read()
  const d = c.update(data => data)
  t.true(c === d)
})

test('store:constant', async t => {
  const store = createStore({
    name: 'store:constant',
    adapter: createAdapter(),
    schema: {
      type: 'object',
      properties: {
        a: {
          type: 'string',
          constant: false
        },
        b: {
          type: 'string',
          constant: true
        },
        c: {
          type: 'string',
          constant: true
        }
      },
      required: ['a', 'b']
    }
  })

  await store.create({ a: 'value', b: 'constant' }).unwrap()

  const first = () => true

  await store.read(first).assign({ c: 'constant' }).unwrap()

  await t.throwsAsync(store.read(first).assign({ b: 'error' }).unwrap(), {
    code: 'EMUT_CONSTANT'
  })
})

test('store:stream', async t => {
  const store = createStore({
    name: 'store:stream',
    adapter: {
      filter() {
        return Readable.from([{ name: 'Kuzco' }, { name: 'Pacha' }])
      }
    }
  })

  t.deepEqual(await store.filter().unwrap(), [
    { name: 'Kuzco' },
    { name: 'Pacha' }
  ])
})

test('store:inspect', async t => {
  t.plan(2)

  const items = [{ my: 'document' }]

  const store = createStore({
    name: 'store:inspect',
    adapter: createAdapter(items)
  })

  const results = await store
    .filter(() => true)
    .inspect(data => {
      t.deepEqual(data, items[0])
      return { nope: true }
    })
    .unwrap()

  t.deepEqual(results, items)
})
