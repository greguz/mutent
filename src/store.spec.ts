import test from 'ava'

import { StoreSettings, createStore } from './store'
import { Writer } from './writer'

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
    reader: {
      find (query) {
        return items.find(item => match(item, query))
      },
      filter (query) {
        return items.filter(item => match(item, query))
      }
    },
    writer: {
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
  const store = createStore({
    reader: {
      Error
    }
  })
  await t.throwsAsync(
    store.read('STOP').unwrap(),
    { message: 'STOP' }
  )
  await t.throwsAsync(
    createStore({}).read({}).unwrap(),
    { code: 'EMUT_NOENT' }
  )
})

test('store mutation', async t => {
  t.plan(3)
  const writer: Writer<Item> = {
    async create () {
      t.fail()
    },
    async update (oldData, newData) {
      t.deepEqual(oldData, { id: 0 })
      t.deepEqual(newData, { id: 0, value: 'MUTATED' })
    },
    async delete () {
      t.fail()
    }
  }
  const out = await createStore({ writer })
    .createMutation()
    .assign({ value: 'MUTATED' })
    .read({ id: 0 })
  t.deepEqual(out, { id: 0, value: 'MUTATED' })
})
