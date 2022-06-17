import test from 'ava'

import {
  mergeHooks,
  normalizeHooks,
  normalizeMutators,
  parseCommitMode,
  parseWriteMode,
  parseWriteSize
} from './options.mjs'

test('options:commitMode', t => {
  t.is(parseCommitMode(), 'AUTO')
  t.throws(() => parseCommitMode(null))
})

test('options:writeMode', t => {
  t.is(parseWriteMode(), 'AUTO')
  t.throws(() => parseWriteMode(null))
})

test('options:writeSize', t => {
  t.is(parseWriteSize(), 16)
  t.throws(() => parseWriteSize(null))
})

test('options:hooks', t => {
  t.plan(10)

  const a = normalizeHooks()
  t.deepEqual(a, {
    onFind: [],
    onFilter: [],
    onEntity: [],
    beforeCreate: [],
    beforeUpdate: [],
    beforeDelete: [],
    afterCreate: [],
    afterUpdate: [],
    afterDelete: []
  })

  const b = mergeHooks(a, {
    onFind () {
      t.pass()
    },
    onFilter () {
      t.pass()
    },
    onEntity () {
      t.pass()
    },
    beforeCreate () {
      t.pass()
    },
    beforeUpdate () {
      t.pass()
    },
    beforeDelete () {
      t.pass()
    },
    afterCreate () {
      t.pass()
    },
    afterUpdate () {
      t.pass()
    },
    afterDelete () {
      t.pass()
    }
  })
  b.onFind[0]()
  b.onFilter[0]()
  b.onEntity[0]()
  b.beforeCreate[0]()
  b.beforeUpdate[0]()
  b.beforeDelete[0]()
  b.afterCreate[0]()
  b.afterUpdate[0]()
  b.afterDelete[0]()
})

test('options:mutators', t => {
  t.deepEqual(normalizeMutators(), [])
  t.throws(() => normalizeMutators(null))
})
