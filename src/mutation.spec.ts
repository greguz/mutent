import test from 'ava'

import { applyMutation, defineMutation } from './mutation'
import { createStatus, readStatus } from './status'
import { Writer } from './writer'

interface Item {
  id: number
  value?: string
}

test('mutation#assign', async t => {
  const mutation = defineMutation<Item>().assign({ value: 'ASSIGN' })
  const out = await applyMutation({ id: 0 }, readStatus, mutation)
  t.deepEqual(out, {
    id: 0,
    value: 'ASSIGN'
  })
})

test('mutation#update', async t => {
  const mutation = defineMutation<Item>().update(
    item => ({ ...item, value: 'UDPATE' })
  )
  const out = await applyMutation({ id: 0 }, readStatus, mutation)
  t.deepEqual(out, {
    id: 0,
    value: 'UDPATE'
  })
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
  const mutation = defineMutation(writer)
  const out = await applyMutation(
    { id: 0, value: 'CREATE' },
    createStatus,
    mutation
  )
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
  const mutation = defineMutation(writer)
  await t.throwsAsync(
    applyMutation(
      { id: 0, value: 'CREATE' },
      createStatus,
      mutation,
      { autoCommit: false }
    )
  )
  const out = await applyMutation(
    { id: 0, value: 'CREATE' },
    createStatus,
    mutation.commit(),
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
  const mutation = defineMutation(writer).assign({ value: 'UPDATE' })
  const out = await applyMutation(
    { id: 0 },
    readStatus,
    mutation
  )
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
  const mutation = defineMutation(writer).assign({ value: 'UPDATE' })
  await t.throwsAsync(
    applyMutation(
      { id: 0 },
      createStatus,
      mutation,
      { autoCommit: false }
    )
  )
  const out = await applyMutation(
    { id: 0 },
    readStatus,
    mutation.commit(),
    { autoCommit: false }
  )
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
  const mutation = defineMutation(writer).delete()
  const out = await applyMutation(
    { id: 0, value: 'DELETE' },
    readStatus,
    mutation
  )
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
  const mutation = defineMutation(writer).delete()
  await t.throwsAsync(
    applyMutation(
      { id: 0, value: 'DELETE' },
      createStatus,
      mutation,
      { autoCommit: false }
    )
  )
  const out = await applyMutation(
    { id: 0, value: 'DELETE' },
    readStatus,
    mutation.commit(),
    { autoCommit: false }
  )
  t.deepEqual(out, { id: 0, value: 'DELETE' })
})

test('mutation#simple-conditions', async t => {
  const mutation = defineMutation<Item>()
    .if(item => item.id === 0)
    .assign({ value: 'ZERO' })
    .elseIf(item => item.id === 1)
    .assign({ value: 'ONE' })
    .else()
    .assign({ value: 'NOT-BINARY' })
    .endIf()

  const a = await applyMutation({ id: 0 }, readStatus, mutation)
  t.deepEqual(a, { id: 0, value: 'ZERO' })

  const b = await applyMutation({ id: 1 }, readStatus, mutation)
  t.deepEqual(b, { id: 1, value: 'ONE' })

  const c = await applyMutation({ id: 42 }, readStatus, mutation)
  t.deepEqual(c, { id: 42, value: 'NOT-BINARY' })
})

test('mutation#errors', async t => {
  const mutation = defineMutation<Item>()
  const yes = () => true
  t.throws(
    () => mutation.elseIf(yes),
    { code: 'EMUT_EXPIF' }
  )
  t.throws(
    () => mutation.else(),
    { code: 'EMUT_EXPIF' }
  )
  t.throws(
    () => mutation.endIf(),
    { code: 'EMUT_ENDIF' }
  )
  const closed = mutation.if(yes).elseIf(yes).elseIf(yes).else()
  t.throws(
    () => closed.elseIf(yes),
    { code: 'EMUT_CLSIF' }
  )
  t.throws(
    () => closed.else(),
    { code: 'EMUT_CLSIF' }
  )
  const dead = closed.endIf()
  t.throws(
    () => dead.elseIf(yes),
    { code: 'EMUT_EXPIF' }
  )
  t.throws(
    () => dead.else(),
    { code: 'EMUT_EXPIF' }
  )
  t.throws(
    () => dead.endIf(),
    { code: 'EMUT_ENDIF' }
  )
})

test('mutation#mutate', async t => {
  const a = defineMutation<Item>().update(
    item => ({ ...item, id: item.id + 1 })
  )
  const b = defineMutation<Item>().assign({ value: 'MUTATE' })
  const out = await applyMutation({ id: 0 }, readStatus, a.mutate(b))
  t.deepEqual(out, { id: 1, value: 'MUTATE' })
})
