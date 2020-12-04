import test from 'ava'

import {
  mutateStatus,
  nodeCommit,
  nodeCondition,
  nodeDelete,
  nodeInspect,
  nodeUpdate
} from './ast'
import { createDriver } from './driver'
import { createStatus, readStatus } from './status'

test('ast:commit', async t => {
  t.plan(3)
  const driver = createDriver({
    create(data, options) {
      t.is(data, 42)
      t.deepEqual(options, { it: 'works' })
    },
    update() {
      t.fail()
    },
    delete() {
      t.fail()
    }
  })
  const status = await mutateStatus(createStatus(42), [nodeCommit()], driver, {
    it: 'works'
  })
  t.deepEqual(status, {
    created: false,
    updated: false,
    deleted: false,
    source: 42,
    target: 42
  })
})

test('ast:condition', async t => {
  const driver = createDriver({
    create() {
      t.fail()
    },
    update() {
      t.fail()
    },
    delete() {
      t.fail()
    }
  })
  const condition = nodeCondition(value => value !== 42, [nodeDelete()])
  const a = await mutateStatus(createStatus('UGLY'), [condition], driver)
  t.deepEqual(a, {
    created: true,
    updated: false,
    deleted: true,
    source: null,
    target: 'UGLY'
  })
  const b = await mutateStatus(createStatus(42), [condition], driver)
  t.deepEqual(b, {
    created: true,
    updated: false,
    deleted: false,
    source: null,
    target: 42
  })
})

test('ast:delete', async t => {
  const driver = createDriver({
    create() {
      t.fail()
    },
    update() {
      t.fail()
    },
    delete() {
      t.fail()
    }
  })
  const value = 'DELETEME.md'
  const status = await mutateStatus(readStatus(value), [nodeDelete()], driver)
  t.deepEqual(status, {
    created: false,
    updated: false,
    deleted: true,
    source: value,
    target: value
  })
})

test('ast:update', async t => {
  const driver = createDriver({
    create() {
      t.fail()
    },
    update() {
      t.fail()
    },
    delete() {
      t.fail()
    }
  })
  const status = await mutateStatus(
    createStatus(41.8),
    [nodeUpdate(Math.round)],
    driver
  )
  t.deepEqual(status, {
    created: true,
    updated: true,
    deleted: false,
    source: null,
    target: 42
  })
})

test('ast:inspect', async t => {
  t.plan(2)
  const driver = createDriver({
    create() {
      t.fail()
    },
    update() {
      t.fail()
    },
    delete() {
      t.fail()
    }
  })
  const status = await mutateStatus(
    createStatus(42),
    [
      nodeInspect(data => {
        t.is(data, 42)
        return null
      })
    ],
    driver
  )
  t.deepEqual(status, {
    created: true,
    updated: false,
    deleted: false,
    source: null,
    target: 42
  })
})
