import test from 'ava'

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

  const a = { id: 0, name: 'Huey' }
  const b = { id: 1, name: 'Dewey' }
  const c = { id: 2, name: 'Louie' }

  const d = await store.create(a).unwrap()
  t.true(d === a)
  t.true(d === items[0])

  const [e, f] = await store.create([b, c]).unwrap()
  t.true(e === b)
  t.true(e === items[1])
  t.true(f === c)
  t.true(f === items[2])
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
})

test('store:migration', async t => {
  const items = [{ id: 0, name: 'Gandalf' }]

  const store = createStore({
    name: 'store:migration',
    adapter: createAdapter(items),
    migrationStrategies: {
      1: data => ({ ...data, v: 1, migrated: true })
    },
    versionKey: 'v'
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
  t.plan(2)

  const store = createStore({
    name: 'hooks:data',
    adapter: createAdapter([{ a: 'document' }]),
    hooks: {
      onData(data, options) {
        t.deepEqual(data, { a: 'document' })
        t.deepEqual(options, { some: 'options' })
      }
    }
  })

  await store.find(() => false).unwrap()
  await store.read(() => true).unwrap({ some: 'options' })
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
