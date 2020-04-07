import test from 'ava'

import { Definition, createPlugin } from './plugin'

interface Item {
  id: number
  value?: string
}

function match (item: Item, value: number | string) {
  return typeof value === 'number'
    ? item.id === value
    : item.value === value
}

function definePlugin (): Definition<Item, number | string> {
  const store: Item[] = []

  return {
    get: query => store.find(item => match(item, query)) || null,
    find: query => store.filter(item => match(item, query)),
    async create (target) {
      store.push(target)
    },
    async update (source, target) {
      const index = store.findIndex(item => item.id === source.id)
      if (index < 0) {
        throw new Error()
      }
      store.splice(index, 1, target)
    },
    async delete (source) {
      const index = store.findIndex(item => item.id === source.id)
      if (index < 0) {
        throw new Error()
      }
      store.splice(index, 1)
    }
  }
}

test('plugin', async t => {
  const plugin = createPlugin(definePlugin())

  const a = await plugin.get(0).unwrap()
  t.is(a, null)

  await t.throwsAsync(() => plugin.read(0).unwrap())

  await plugin
    .create({ id: 42 })
    .commit()
    .unwrap()

  const b = await plugin.read(42).unwrap()
  t.deepEqual(b, { id: 42 })

  await plugin
    .insert([
      { id: 0, value: 'YES' },
      { id: 1, value: 'NO' },
      { id: 2 },
      { id: 3, value: 'NO' },
      { id: 4, value: 'YES' }
    ])
    .commit()
    .unwrap()

  const c = await plugin
    .find('YES')
    .unwrap()
  t.deepEqual(c, [
    { id: 0, value: 'YES' },
    { id: 4, value: 'YES' }
  ])

  const d = await plugin.from(b).unwrap()
  t.deepEqual(d, { id: 42 })

  const e = await plugin.from(c).unwrap()
  t.deepEqual(e, [
    { id: 0, value: 'YES' },
    { id: 4, value: 'YES' }
  ])
})
