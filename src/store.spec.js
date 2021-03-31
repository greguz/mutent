import test from 'ava'
import { Readable } from 'stream'

import { Store } from './store'

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

test('store:defaults', t => {
  t.throws(() => Store.create())
  t.throws(() => Store.create({}))
  t.throws(() => Store.create({ name: '', adapter: {} }))
  t.throws(() => Store.create({ name: 'store:defaults' }))
  t.throws(() => Store.create({ adapter: {} }))
  Store.create({ name: 'store:defaults', adapter: {} })
})

test('store:create', async t => {
  const items = []
  const store = Store.create({
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

  const uPromise = await store.create(Promise.resolve({ id: 5 })).unwrap()
  t.deepEqual(uPromise, { id: 5 })

  const iPromise = await consume(
    store.create(Promise.resolve({ id: 6 })).iterate()
  )
  t.deepEqual(iPromise, [{ id: 6 }])

  const uPromiseCallback = await store
    .create(async options => {
      t.deepEqual(options, { my: 'options' })
      return { id: 7 }
    })
    .unwrap({ my: 'options' })
  t.deepEqual(uPromiseCallback, { id: 7 })

  const iPromiseCallback = await consume(
    store
      .create(async options => {
        t.deepEqual(options, { my: 'options' })
        return { id: 8 }
      })
      .iterate({ my: 'options' })
  )
  t.deepEqual(iPromiseCallback, [{ id: 8 }])

  const uIterableCallback = await store
    .create(options => {
      t.deepEqual(options, { my: 'options' })
      return [{ id: 9 }]
    })
    .unwrap({ my: 'options' })
  t.deepEqual(uIterableCallback, [{ id: 9 }])

  const iIterableCallback = await consume(
    store
      .create(options => {
        t.deepEqual(options, { my: 'options' })
        return [{ id: 10 }]
      })
      .iterate({ my: 'options' })
  )
  t.deepEqual(iIterableCallback, [{ id: 10 }])
})

test('store:find', async t => {
  const items = [
    { id: 0, name: 'Mad Hatter' },
    { id: 1, name: 'March Hare' },
    { id: 2, name: 'Dormouse' }
  ]
  const store = Store.create({
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
  const store = Store.create({
    name: 'store:read',
    adapter: createAdapter(items)
  })

  t.is(await store.read(item => item.nose !== true).unwrap(), items[0])
  await t.throwsAsync(store.read(item => item.nose === true).unwrap(), {
    code: 'EMUT_EXPECTED_ENTITY'
  })

  t.deepEqual(await consume(store.read(item => item.id === 0).iterate()), [
    items[0]
  ])
  await t.throwsAsync(consume(store.read(() => false).iterate()), {
    code: 'EMUT_EXPECTED_ENTITY'
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
  const store = Store.create({
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

  const store = Store.create({
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
    code: 'EMUT_INVALID_ENTITY'
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
    { code: 'EMUT_INVALID_ENTITY' }
  )
  await t.throwsAsync(
    store
      .read(() => true)
      .assign({ teapot: {} })
      .unwrap(),
    { code: 'EMUT_INVALID_ENTITY' }
  )
})

test('store:migration', async t => {
  const items = [{ id: 0, name: 'Gandalf' }]

  const store = Store.create({
    name: 'store:migration',
    adapter: createAdapter(items),
    version: 1,
    versionKey: 'v',
    migrationStrategies: {
      1: data => ({
        ...data,
        v: 1,
        migrated: true
      })
    }
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

  const store = Store.create({
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

  const store = Store.create({
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

  const store = Store.create({
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

  const store = Store.create({
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

  const store = Store.create({
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

  const store = Store.create({
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

test('store:safe-commit', async t => {
  const items = []

  const store = Store.create({
    name: 'store:safe-commit',
    adapter: createAdapter(items),
    commitMode: 'SAFE'
  })

  await t.throwsAsync(store.create({ id: 0 }).unwrap(), {
    code: 'EMUT_UNSAFE_UNWRAP'
  })
  t.is(items.length, 0)

  await store.create({ id: 1 }).unwrap({ mutent: { commitMode: 'MANUAL' } })
  t.is(items.length, 0)

  await store.create({ id: 2 }).commit().unwrap()
  t.deepEqual(items, [{ id: 2 }])

  await store.create({ id: 3 }).unwrap({ mutent: { commitMode: 'AUTO' } })
  t.deepEqual(items, [{ id: 2 }, { id: 3 }])
})

test('store:manual-commit', async t => {
  const items = []

  const store = Store.create({
    name: 'store:manual-commit',
    adapter: createAdapter(items),
    commitMode: 'MANUAL'
  })

  await store.create({ id: 0 }).unwrap()
  t.is(items.length, 0)

  await t.throwsAsync(
    store.create({ id: 1 }).unwrap({ mutent: { commitMode: 'SAFE' } }),
    { code: 'EMUT_UNSAFE_UNWRAP' }
  )
  t.is(items.length, 0)

  await store.create({ id: 2 }).commit().unwrap()
  t.deepEqual(items, [{ id: 2 }])

  await store.create({ id: 3 }).unwrap({ mutent: { commitMode: 'AUTO' } })
  t.deepEqual(items, [{ id: 2 }, { id: 3 }])
})

test('store:constant', async t => {
  const store = Store.create({
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
  const store = Store.create({
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

test('store:tap', async t => {
  t.plan(2)

  const items = [{ my: 'document' }]

  const store = Store.create({
    name: 'store:tap',
    adapter: createAdapter(items)
  })

  const results = await store
    .filter(() => true)
    .tap(data => {
      t.deepEqual(data, items[0])
      return { nope: true }
    })
    .unwrap()

  t.deepEqual(results, items)
})

test('store:filter-mutator', async t => {
  t.plan(5)

  const items = [{ name: 'Shrek' }, { name: 'Fiona' }, { name: 'Donkey' }]

  const store = Store.create({
    name: 'store:filter',
    adapter: createAdapter(items)
  })

  const results = await store
    .filter(() => true)
    .tap(t.pass)
    .filter(data => data.name === 'Shrek')
    .tap(t.pass)
    .unwrap()

  t.deepEqual(results, [{ name: 'Shrek' }])
})

test('store:bulk', async t => {
  t.plan(14)

  const store = Store.create({
    name: 'store:bulk',
    adapter: {
      bulk(actions, options) {
        t.is(actions.length, 2)
        for (const action of actions) {
          t.is(action.type, 'CREATE')
          t.true(typeof action.data === 'string')
        }
      }
    },
    hooks: {
      beforeBulk(actions, options) {
        t.is(actions.length, 2)
      },
      afterBulk(actions, options) {
        t.is(actions.length, 2)
      }
    },
    writeMode: 'BULK',
    writeSize: 2
  })

  await store.create(['a', 'b', 'c', 'd']).unwrap()
})

test('store:bulk-partial', async t => {
  const store = Store.create({
    name: 'store:bulk',
    adapter: {},
    writeMode: 'BULK'
  })

  await t.throwsAsync(store.create(['a', 'b', 'c', 'd']).unwrap(), {
    code: 'EMUT_PARTIAL_ADAPTER'
  })
})

test('store:ignoreSchema', async t => {
  const store = Store.create({
    name: 'store:ignoreSchema',
    adapter: createAdapter(),
    schema: {
      type: 'object',
      properties: {
        value: {
          type: 'number'
        }
      },
      required: ['value']
    }
  })
  await store.create({ value: 42 }).unwrap()
  await t.throwsAsync(store.create({}).unwrap(), {
    code: 'EMUT_INVALID_ENTITY'
  })
  await store.create({}).unwrap({ mutent: { ignoreSchema: true } })
})
