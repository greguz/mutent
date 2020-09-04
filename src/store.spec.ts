import test from 'ava'

import { StoreSettings, createStore } from './store'

interface Item {
  id: number
  value?: string
}

function match (item: Item, value: number | string) {
  return typeof value === 'number'
    ? item.id === value
    : item.value === value
}

function createSettings (): StoreSettings<Item, number | string> {
  const items: Item[] = []

  return {
    driver: {
      find (query) {
        return items.find(item => match(item, query))
      },
      filter (query) {
        return items.filter(item => match(item, query))
      },
      create (target) {
        items.push(target)
      },
      update (source, target) {
        const index = items.findIndex(item => item.id === source.id)
        if (index < 0) {
          throw new Error()
        }
        items.splice(index, 1, target)
      },
      delete (source) {
        const index = items.findIndex(item => item.id === source.id)
        if (index < 0) {
          throw new Error()
        }
        items.splice(index, 1)
      }
    }
  }
}

test('plugin', async t => {
  const store = createStore(createSettings())

  const a = await store.find(0).unwrap()
  t.is(a, null)

  await t.throwsAsync(store.read(0).unwrap())

  await store
    .create({ id: 42 })
    .commit()
    .unwrap()

  const b = await store.read(42).unwrap()
  t.deepEqual(b, { id: 42 })

  await store
    .create([
      { id: 0, value: 'YES' },
      { id: 1, value: 'NO' },
      { id: 2 },
      { id: 3, value: 'NO' },
      { id: 4, value: 'YES' }
    ])
    .commit()
    .unwrap()

  const c = await store
    .filter('YES')
    .unwrap()
  t.deepEqual(c, [
    { id: 0, value: 'YES' },
    { id: 4, value: 'YES' }
  ])

  const d = await store.from(b).unwrap()
  t.deepEqual(d, { id: 42 })

  const e = await store.from(c).unwrap()
  t.deepEqual(e, [
    { id: 0, value: 'YES' },
    { id: 4, value: 'YES' }
  ])
})

test('default store', async t => {
  const store = createStore({})

  const entity = await store.find({}).unwrap()
  t.is(entity, null)

  await t.throwsAsync(store.read({}).unwrap())

  const entities = await store.filter({}).unwrap()
  t.deepEqual(entities, [])
})

test('store missing', async t => {
  t.plan(3)
  const store = createStore<any, string, any>({
    driver: {
      find (query, options, isRequired) {
        t.true(isRequired)
        throw new Error('STOP')
      }
    }
  })
  await t.throwsAsync(
    store.read('STOP').unwrap(),
    { message: 'STOP' }
  )
  await t.throwsAsync(
    createStore({}).read({}).unwrap(),
    { code: 'EMUT_NOT_FOUND' }
  )
})

test('schema', async t => {
  const schema: any = {
    type: 'object',
    properties: {
      date: {
        anyOf: [
          { type: 'string', format: 'date-time' },
          { type: 'object', instanceof: 'Date' }
        ],
        parse: (value: any) => new Date(value)
      }
    }
  }

  const store = createStore<any, any, any>({
    schema
  })

  const input: any = {
    date: '2020-09-02T16:29:34.070Z'
  }

  const output = await store
    .create(input)
    .unwrap()

  t.is(output.date.toISOString(), '2020-09-02T16:29:34.070Z')
})
