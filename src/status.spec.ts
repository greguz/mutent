import test from 'ava'

import { createStatus, updateStatus, commitStatus, deleteStatus } from './status'

test('create status', t => {
  t.throws(() => createStatus(undefined))
  t.deepEqual(createStatus('CREATE'), {
    committed: false,
    deleted: false,
    source: null,
    target: 'CREATE'
  })
})

test('commit status', t => {
  t.deepEqual(
    commitStatus(createStatus('COMMIT')),
    {
      committed: true,
      deleted: false,
      source: 'COMMIT',
      target: 'COMMIT'
    }
  )
})

test('update status', t => {
  t.throws(() => updateStatus(createStatus({}), undefined))
  t.deepEqual(
    updateStatus(createStatus('CREATE'), 'UPDATE'),
    {
      committed: false,
      deleted: false,
      source: null,
      target: 'UPDATE'
    }
  )
  t.deepEqual(
    updateStatus(commitStatus(createStatus('CREATE')), 'UPDATE'),
    {
      committed: false,
      deleted: false,
      source: 'CREATE',
      target: 'UPDATE'
    }
  )
})

test('delete status', t => {
  t.deepEqual(
    deleteStatus(commitStatus(createStatus('DELETE'))),
    {
      committed: false,
      deleted: true,
      source: 'DELETE',
      target: 'DELETE'
    }
  )
})
