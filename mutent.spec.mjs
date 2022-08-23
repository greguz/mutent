import test from 'ava'
import { Readable } from 'stream'

import { Entity, MutentError, Store } from './mutent.mjs'

function createAdapter (items = []) {
  return {
    [Symbol.for('adapter-name')]: 'Array Adapter',
    find (predicate) {
      return items.find(predicate)
    },
    filter (predicate) {
      return items.filter(predicate)
    },
    create (data) {
      items.push(data)
    },
    update (oldData, newData) {
      items.splice(
        items.findIndex(item => item === oldData),
        1,
        newData
      )
    },
    delete (data) {
      items.splice(
        items.findIndex(item => item === data),
        1
      )
    }
  }
}

async function consume (iterable, handler) {
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
  t.throws(() => new Store())
  t.throws(() => new Store({}))
  // new Store({ adapter: {} })
})

test('store:create', async t => {
  const items = []
  const store = new Store({
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
    .create(async () => ({ id: 7 }))
    .unwrap({ my: 'options' })
  t.deepEqual(uPromiseCallback, { id: 7 })

  const iPromiseCallback = await consume(
    store
      .create(async () => ({ id: 8 }))
      .iterate({ my: 'options' })
  )
  t.deepEqual(iPromiseCallback, [{ id: 8 }])
})

test('store:find', async t => {
  const items = [
    { id: 0, name: 'Mad Hatter' },
    { id: 1, name: 'March Hare' },
    { id: 2, name: 'Dormouse' }
  ]
  const store = new Store({
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
  const store = new Store({
    adapter: createAdapter(items)
  })

  t.is(await store.read(item => item.nose !== true).unwrap(), items[0])
  await t.throwsAsync(store.read(item => item.nose === true).unwrap(), {
    code: 'EMUT_ENTITY_REQUIRED'
  })

  t.deepEqual(await consume(store.read(item => item.id === 0).iterate()), [
    items[0]
  ])
  await t.throwsAsync(consume(store.read(() => false).iterate()), {
    code: 'EMUT_ENTITY_REQUIRED'
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
  const store = new Store({
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

test('hooks:find', async t => {
  t.plan(2)

  const store = new Store({
    adapter: createAdapter(),
    hooks: {
      onFind (query, context) {
        t.true(typeof query === 'function')
        t.deepEqual(context.options, { some: 'options' })
      }
    }
  })

  await store.find(() => true).unwrap({ some: 'options' })
})

test('hooks:filter', async t => {
  t.plan(2)

  const store = new Store({
    adapter: createAdapter(),
    hooks: {
      onFilter (query, context) {
        t.true(typeof query === 'function')
        t.deepEqual(context.options, { some: 'options' })
      }
    }
  })

  await store.filter(() => true).unwrap({ some: 'options' })
})

test('hooks:data', async t => {
  t.plan(15)

  let expectedIntent

  const store = new Store({
    adapter: createAdapter(),
    hooks: {
      onEntity (entity, context) {
        t.is(context.intent, expectedIntent)
        t.deepEqual(entity.valueOf(), { a: 'document' })
        t.deepEqual(context.options, { some: 'options' })
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

  const store = new Store({
    adapter: createAdapter(),
    hooks: {
      beforeCreate (entity, context) {
        t.deepEqual(entity.target, { a: 'document' })
        t.deepEqual(context.options, { some: 'options' })
      },
      afterCreate (entity, context) {
        t.deepEqual(entity.target, { a: 'document' })
        t.deepEqual(context.options, { some: 'options' })
      }
    }
  })

  await store.create({ a: 'document' }).unwrap({ some: 'options' })
})

test('hooks:update', async t => {
  t.plan(6)

  const store = new Store({
    adapter: createAdapter([{ a: 'document' }]),
    hooks: {
      beforeUpdate (entity, context) {
        t.deepEqual(entity.source, { a: 'document' })
        t.deepEqual(entity.target, { a: 'document', updated: true })
        t.deepEqual(context.options, { some: 'options' })
      },
      afterUpdate (entity, context) {
        t.deepEqual(entity.source, { a: 'document' })
        t.deepEqual(entity.target, { a: 'document', updated: true })
        t.deepEqual(context.options, { some: 'options' })
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

  const store = new Store({
    adapter: createAdapter([{ a: 'document' }]),
    hooks: {
      beforeDelete (entity, context) {
        t.deepEqual(entity.source, { a: 'document' })
        t.deepEqual(context.options, { some: 'options' })
      },
      afterDelete (entity, context) {
        t.deepEqual(entity.source, { a: 'document' })
        t.deepEqual(context.options, { some: 'options' })
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

  const store = new Store({
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

  const store = new Store({
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

test('store:stream', async t => {
  const store = new Store({
    adapter: {
      filter () {
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

  const store = new Store({
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

  const store = new Store({
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
  t.plan(18)

  let bi = 0
  let ai = 0

  const values = ['a', 'b', 'c', 'd']

  const store = new Store({
    adapter: {
      bulk (actions, options) {
        t.is(actions.length, 2)
        for (const action of actions) {
          t.is(action.type, 'CREATE')
          t.true(typeof action.data === 'string')
        }
      }
    },
    hooks: {
      beforeCreate (entity) {
        const index = bi++
        t.is(entity.target, values[index])
      },
      afterCreate (entity) {
        const index = ai++
        t.is(entity.target, values[index])
      }
    },
    writeMode: 'BULK',
    writeSize: 2
  })

  await store.create(values).unwrap()
})

test('store:bulk-partial', async t => {
  const store = new Store({
    adapter: {},
    writeMode: 'BULK'
  })

  await t.throwsAsync(store.create(['a', 'b', 'c', 'd']).unwrap())
})

test('store:consume', async t => {
  const items = []

  const store = new Store({
    adapter: createAdapter(items)
  })

  const count = await store.create({ value: 42 }).consume()
  t.is(count, 1)

  t.deepEqual(items, [{ value: 42 }])
})

test('store:register', async t => {
  t.plan(9)

  let index = 0

  const store = new Store({
    adapter: {},
    plugins: [
      {
        hooks: {
          onEntity: [
            () => {
              t.is(index++, 3)
            }
          ]
        },
        mutators: [
          iterable => {
            t.is(index++, 0)
            return iterable
          }
        ]
      }
    ]
  })

  store.register({
    hooks: {
      onEntity: [
        () => {
          t.is(index++, 4)
        }
      ]
    },
    mutators: [
      iterable => {
        t.is(index++, 1)
        return iterable
      }
    ]
  })

  store.register({
    commitMode: 'MANUAL',
    hooks: {
      onEntity () {
        t.is(index++, 5)
      }
    },
    mutators: [
      iterable => {
        t.is(index++, 2)
        return iterable
      }
    ],
    writeMode: 'CONCURRENT',
    writeSize: 8
  })

  await store.create({ value: 42 }).consume()
  t.is(index, 6)

  t.throws(() => store.register({ hooks: { onEntity: null } }), {
    message: 'Invalid onEntity hook definition'
  })
  t.throws(() => store.register({ mutators: null }), {
    message: 'Invalid mutators'
  })
})

test('store:overflow', async t => {
  const store = new Store({
    adapter: createAdapter(['a']),
    name: 'test',
    mutators: [
      async function * (iterable) {
        for await (const entity of iterable) {
          yield entity
        }
        yield Entity.read('b')
      }
    ]
  })

  const query = () => true
  const error = await t.throwsAsync(store.read(query).unwrap(), {
    code: 'EMUT_MUTATION_OVERFLOW',
    instanceOf: MutentError
  })
  t.is(error.info.adapter, 'Array Adapter')
  t.is(error.info.intent, 'READ')
  t.is(error.info.argument, query)
})
