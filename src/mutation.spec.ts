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

test('mutation#simple-conditions', async t => {
  const mutation = createMutation<Item>()
    .if(item => item.id === 0)
    .assign({ value: 'ZERO' })
    .elseIf(item => item.id === 1)
    .assign({ value: 'ONE' })
    .else()
    .assign({ value: 'NOT-BINARY' })
    .endIf()

  const a = await mutation.read({ id: 0 })
  t.deepEqual(a, { id: 0, value: 'ZERO' })

  const b = await mutation.read({ id: 1 })
  t.deepEqual(b, { id: 1, value: 'ONE' })

  const c = await mutation.read({ id: 42 })
  t.deepEqual(c, { id: 42, value: 'NOT-BINARY' })
})

test('mutation#nested-conditions', async t => {
  const mutation = createMutation<Item>()
    .if(item => item.id < 8)
    .if(item => item.id < 4)
    .if(item => item.id < 2)
    .assign({ value: 'BINARY' })
    .else()
    .assign({ value: 'NOK2' })
    .endIf()
    .else()
    .assign({ value: 'NOK1' })
    .endIf()
    .else()
    .assign({ value: 'NOK0' })
    .endIf()

  const a = await mutation.read({ id: 0 })
  t.deepEqual(a, { id: 0, value: 'BINARY' })

  const b = await mutation.read({ id: 2 })
  t.deepEqual(b, { id: 2, value: 'NOK2' })

  const c = await mutation.read({ id: 4 })
  t.deepEqual(c, { id: 4, value: 'NOK1' })

  const d = await mutation.read({ id: 8 })
  t.deepEqual(d, { id: 8, value: 'NOK0' })
})

test('mutation#errors', async t => {
  const mutation = createMutation<Item>()
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
  const a = createMutation<Item>().update(
    item => ({ ...item, id: item.id + 1 })
  )
  const b = createMutation<Item>().assign({ value: 'MUTATE' })
  const out = await a.mutate(b).read({ id: 0 })
  t.deepEqual(out, { id: 1, value: 'MUTATE' })
})
