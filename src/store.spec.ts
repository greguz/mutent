import test from 'ava'

import { Plugin, createStore } from './store'

interface Item {
  id: number
  value?: string
}

function match (item: Item, value: number | string) {
  return typeof value === 'number'
    ? item.id === value
    : item.value === value
}

function createPlugin (): Plugin<Item, number | string> {
  const items: Item[] = []

  return {
    get: query => items.find(item => match(item, query)) || null,
    find: query => items.filter(item => match(item, query)),
    async create (target) {
      items.push(target)
    },
    async update (source, target) {
      const index = items.findIndex(item => item.id === source.id)
      if (index < 0) {
        throw new Error()
      }
      items.splice(index, 1, target)
    },
    async delete (source) {
      const index = items.findIndex(item => item.id === source.id)
      if (index < 0) {
        throw new Error()
      }
      items.splice(index, 1)
    }
  }
}

test('plugin', async t => {
  const store = createStore(createPlugin())

  const a = await store.get(0).unwrap()
  t.is(a, null)

  await t.throwsAsync(() => store.read(0).unwrap())

  await store
    .create({ id: 42 })
    .commit()
    .unwrap()

  const b = await store.read(42).unwrap()
  t.deepEqual(b, { id: 42 })

  await store
    .insert([
      { id: 0, value: 'YES' },
      { id: 1, value: 'NO' },
      { id: 2 },
      { id: 3, value: 'NO' },
      { id: 4, value: 'YES' }
    ])
    .commit()
    .unwrap()

  const c = await store
    .find('YES')
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
