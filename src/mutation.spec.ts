import test from 'ava'

import { Mutation, createMutation } from './mutation'
import { applyMutator } from './mutator'
import { createStatus, readStatus } from './status'
import { Writer } from './writer'

interface Item {
  id: number
  value?: string
}

function create<T, O> (
  data: T,
  mutation: Mutation<T, O>,
  options: Partial<O> = {}
): Promise<T> {
  return applyMutator(createStatus(data), mutation.render(), options)
}

function read<T, O> (
  data: T,
  mutation: Mutation<T, O>,
  options: Partial<O> = {}
): Promise<T> {
  return applyMutator(readStatus(data), mutation.render(), options)
}

test('mutation#assign', async t => {
  const mutation = createMutation<Item>().assign({ value: 'ASSIGN' })
  const out = await read({ id: 0 }, mutation)
  t.deepEqual(out, {
    id: 0,
    value: 'ASSIGN'
  })
})

test('mutation#update', async t => {
  const mutation = createMutation<Item>().update(
    item => ({ ...item, value: 'UDPATE' })
  )
  const out = await read({ id: 0 }, mutation)
  t.deepEqual(out, {
    id: 0,
    value: 'UDPATE'
  })
})

test('mutation#write-void', async t => {
  const mutation = createMutation<Item>()
    .assign({ value: 'UPDATE' })
    .commit()
  const out = await read({ id: 0 }, mutation)
  t.deepEqual(out, { id: 0, value: 'UPDATE' })
})

test('mutation#write-create', async t => {
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
  const mutation = createMutation({ writer }).commit()
  const out = await create({ id: 0, value: 'CREATE' }, mutation)
  t.deepEqual(out, { id: 0, value: 'CREATE' })
})

test('mutation#write-update', async t => {
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
  const mutation = createMutation({ writer }).assign({ value: 'UPDATE' }).commit()
  const out = await read({ id: 0 }, mutation)
  t.deepEqual(out, { id: 0, value: 'UPDATE' })
})

test('mutation#write-delete', async t => {
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
  const mutation = createMutation({ writer }).delete().commit()
  const out = await read({ id: 0, value: 'DELETE' }, mutation)
  t.deepEqual(out, { id: 0, value: 'DELETE' })
})

test('mutation#if', async t => {
  const mutation = createMutation<Item>()

  const isBinary = (item: Item) => item.id === 0 || item.id === 1

  const setValue = createMutation<Item>().assign({ value: 'UPDATE' })

  const a = await read(
    { id: 0, value: 'READ' },
    mutation.if(isBinary, setValue)
  )
  t.deepEqual(a, { id: 0, value: 'UPDATE' })

  const b = await read(
    { id: 42, value: 'READ' },
    mutation.if(isBinary, setValue)
  )
  t.deepEqual(b, { id: 42, value: 'READ' })
})

test('mutation#unless', async t => {
  const mutation = createMutation<Item>()

  const isBinary = (item: Item) => item.id === 0 || item.id === 1

  const setValue = createMutation<Item>().assign({ value: 'UPDATE' })

  const a = await read(
    { id: 0, value: 'READ' },
    mutation.unless(isBinary, setValue)
  )
  t.deepEqual(a, { id: 0, value: 'READ' })

  const b = await read(
    { id: 42, value: 'READ' },
    mutation.unless(isBinary, setValue)
  )
  t.deepEqual(b, { id: 42, value: 'UPDATE' })
})

test('mutation#concat', async t => {
  const a = createMutation<Item>().update(
    item => ({ ...item, id: item.id + 1 })
  )
  const b = createMutation<Item>().assign({ value: 'MUTATE' })
  const out = await read({ id: 0 }, a.mutate(b))
  t.deepEqual(out, { id: 1, value: 'MUTATE' })
})

test('mutation#mapper', async t => {
  const mutation = createMutation<Item>()

  const isBinary = (item: Item) => item.id === 0 || item.id === 1

  const setValue = (mutation: Mutation<Item>) => mutation.assign({ value: 'UPDATE' })

  const a = await read(
    { id: 0, value: 'READ' },
    mutation.if(isBinary, setValue)
  )
  t.deepEqual(a, { id: 0, value: 'UPDATE' })

  const b = await read(
    { id: 42, value: 'READ' },
    mutation.if(isBinary, setValue)
  )
  t.deepEqual(b, { id: 42, value: 'READ' })
})
