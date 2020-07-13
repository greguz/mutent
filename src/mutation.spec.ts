import test from 'ava'

import { createMutation } from './mutation'
import { Writer } from './writer'

interface Item {
  id: number
  value?: string
}

test('mutation#assign', async t => {
  const mutation = createMutation<Item>().assign({ value: 'ASSIGN' })
  const out = await mutation.read({ id: 0 })
  t.deepEqual(out, {
    id: 0,
    value: 'ASSIGN'
  })
})

test('mutation#update', async t => {
  const mutation = createMutation<Item>().update(
    item => ({ ...item, value: 'UDPATE' })
  )
  const out = await mutation.read({ id: 0 })
  t.deepEqual(out, {
    id: 0,
    value: 'UDPATE'
  })
})

test('mutation#void-commit', async t => {
  const mutation = createMutation<Item>()
    .assign({ value: 'UPDATE' })
    .commit()
  const out = await mutation.read({ id: 0 })
  t.deepEqual(out, { id: 0, value: 'UPDATE' })
})

test('mutation#auto-create', async t => {
  t.plan(2)
  const writer: Writer<Item> = {
    create (data) {
      t.deepEqual(data, { id: 0, value: 'CREATE' })
    },
    update () {
      t.fail()
    },
    delete () {
      t.fail()
    }
  }
  const mutation = createMutation({ writer })
  const out = await mutation.create({ id: 0, value: 'CREATE' })
  t.deepEqual(out, { id: 0, value: 'CREATE' })
})

test('mutation#manual-create', async t => {
  t.plan(3)
  const writer: Writer<Item> = {
    create (data) {
      t.deepEqual(data, { id: 0, value: 'CREATE' })
    },
    update () {
      t.fail()
    },
    delete () {
      t.fail()
    }
  }
  const mutation = createMutation({ writer })
  await t.throwsAsync(
    mutation.create(
      { id: 0, value: 'CREATE' },
      { autoCommit: false }
    )
  )
  const out = await mutation
    .commit()
    .create(
      { id: 0, value: 'CREATE' },
      { autoCommit: false }
    )
  t.deepEqual(out, { id: 0, value: 'CREATE' })
})

test('mutation#auto-update', async t => {
  t.plan(3)
  const writer: Writer<Item> = {
    create () {
      t.fail()
    },
    update (oldData, newData) {
      t.deepEqual(oldData, { id: 0 })
      t.deepEqual(newData, { id: 0, value: 'UPDATE' })
    },
    delete () {
      t.fail()
    }
  }
  const mutation = createMutation({ writer }).assign({ value: 'UPDATE' })
  const out = await mutation.read({ id: 0 })
  t.deepEqual(out, { id: 0, value: 'UPDATE' })
})

test('mutation#manual-update', async t => {
  t.plan(4)
  const writer: Writer<Item> = {
    create () {
      t.fail()
    },
    update (oldData, newData) {
      t.deepEqual(oldData, { id: 0 })
      t.deepEqual(newData, { id: 0, value: 'UPDATE' })
    },
    delete () {
      t.fail()
    }
  }
  const mutation = createMutation({ writer }).assign({ value: 'UPDATE' })
  await t.throwsAsync(mutation.read({ id: 0 }, { autoCommit: false }))
  const out = await mutation.commit().read({ id: 0 })
  t.deepEqual(out, { id: 0, value: 'UPDATE' })
})

test('mutation#auto-delete', async t => {
  t.plan(2)
  const writer: Writer<Item> = {
    create () {
      t.fail()
    },
    update () {
      t.fail()
    },
    delete (data) {
      t.deepEqual(data, { id: 0, value: 'DELETE' })
    }
  }
  const mutation = createMutation({ writer }).delete()
  const out = await mutation.read({ id: 0, value: 'DELETE' })
  t.deepEqual(out, { id: 0, value: 'DELETE' })
})

test('mutation#manual-delete', async t => {
  t.plan(3)
  const writer: Writer<Item> = {
    create () {
      t.fail()
    },
    update () {
      t.fail()
    },
    delete (data) {
      t.deepEqual(data, { id: 0, value: 'DELETE' })
    }
  }
  const mutation = createMutation({ writer }).delete()
  await t.throwsAsync(
    mutation.read(
      { id: 0, value: 'DELETE' },
      { autoCommit: false }
    )
  )
  const out = await mutation
    .commit()
    .read({ id: 0, value: 'DELETE' }, { autoCommit: false })
  t.deepEqual(out, { id: 0, value: 'DELETE' })
})

test('mutation#if', async t => {
  const mutation = createMutation<Item>()

  const isBinary = (item: Item) => item.id === 0 || item.id === 1

  const setValue = createMutation<Item>().assign({ value: 'UPDATE' })

  const a = await mutation
    .if(isBinary, setValue)
    .read({ id: 0, value: 'READ' })
  t.deepEqual(a, { id: 0, value: 'UPDATE' })

  const b = await mutation
    .if(isBinary, setValue)
    .read({ id: 42, value: 'READ' })
  t.deepEqual(b, { id: 42, value: 'READ' })
})

test('mutation#unless', async t => {
  const mutation = createMutation<Item>()

  const isBinary = (item: Item) => item.id === 0 || item.id === 1

  const setValue = createMutation<Item>().assign({ value: 'UPDATE' })

  const a = await mutation
    .unless(isBinary, setValue)
    .read({ id: 0, value: 'READ' })
  t.deepEqual(a, { id: 0, value: 'READ' })

  const b = await mutation
    .unless(isBinary, setValue)
    .read({ id: 42, value: 'READ' })
  t.deepEqual(b, { id: 42, value: 'UPDATE' })
})

test('mutation#mutate', async t => {
  const a = createMutation<Item>().update(
    item => ({ ...item, id: item.id + 1 })
  )
  const b = createMutation<Item>().assign({ value: 'MUTATE' })
  const out = await a.mutate(b).read({ id: 0 })
  t.deepEqual(out, { id: 1, value: 'MUTATE' })
})
