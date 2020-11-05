import test from 'ava'

import {
  createStatus,
  updateStatus,
  commitStatus,
  deleteStatus
} from './status'

test('create status', t => {
  t.deepEqual(createStatus(undefined), {
    created: true,
    updated: false,
    deleted: false,
    source: null,
    target: null
  })
  t.deepEqual(createStatus('CREATE'), {
    created: true,
    updated: false,
    deleted: false,
    source: null,
    target: 'CREATE'
  })
})

test('commit status', t => {
  t.deepEqual(commitStatus(createStatus('COMMIT')), {
    created: false,
    updated: false,
    deleted: false,
    source: 'COMMIT',
    target: 'COMMIT'
  })
})

test('update status', t => {
  t.throws(() => updateStatus(createStatus({}), undefined))
  t.deepEqual(updateStatus(createStatus('CREATE'), 'UPDATE'), {
    created: true,
    updated: true,
    deleted: false,
    source: null,
    target: 'UPDATE'
  })
})

test('delete status', t => {
  t.deepEqual(deleteStatus(createStatus('DELETE')), {
    created: true,
    updated: false,
    deleted: true,
    source: null,
    target: 'DELETE'
  })
})
