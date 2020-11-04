import test from 'ava'

import { createStore } from './store'

function createDriver(items = []) {
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
    },
    count(predicate) {
      return items.filter(predicate).length
    },
    exists(predicate) {
      return items.findIndex(predicate) >= 0
    }
  }
}

test('store:settings', t => {
  t.throws(() => createStore())
  t.throws(() => createStore({}))
})

test('store:create', async t => {
  const items = []
  const store = createStore({ driver: createDriver(items) })

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
  const store = createStore({ driver: createDriver(items) })

  t.is(await store.find(item => item.id === 0).unwrap(), items[0])
  t.is(await store.find(item => item.name === 'March Hare').unwrap(), items[1])
  t.is(await store.find(item => /mouse/.test(item.name)).unwrap(), items[2])
  t.is(await store.find(item => item.id > 2).unwrap(), null)
})

test('store:read', async t => {
  const items = [{ id: 0, name: 'Tom Orvoloson Riddle', nose: false }]
  const store = createStore({ driver: createDriver(items) })

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
  const store = createStore({ driver: createDriver(items) })

  const a = await store.filter(item => item.protagonist === true).unwrap()
  t.is(a.length, 3)

  const b = await store.filter(item => item.gender === 'female').unwrap()
  t.is(b.length, 2)

  const c = await store.filter(item => item.human === true).unwrap()
  t.is(c.length, 4)
})

test('store:count', async t => {
  const items = [
    { id: 0, name: 'Blossom', human: true, super: true },
    { id: 1, name: 'Bubbles', human: true, super: true },
    { id: 2, name: 'Buttercup', human: true, super: true },
    { id: 3, name: 'Professor Utonium', human: true },
    { id: 4, name: 'Mojo Jojo' }
  ]
  const store = createStore({ driver: createDriver(items) })

  t.is(await store.count(item => item.human === true), 4)
  t.is(await store.count(item => item.super === true), 3)
  t.is(await store.count(item => !item.human), 1)
})

test('store:exists', async t => {
  const items = [{ id: 0, name: 'The Narrator' }]
  const store = createStore({ driver: createDriver(items) })

  t.true(await store.exists(item => item.name === 'The Narrator'))
  t.false(await store.exists(item => item.name === 'Tyler Durden'))
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
    constructors: {
      Teapot
    },
    driver: createDriver(),
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
