import test from 'ava'

import { createStatus, updateStatus, commitStatus } from './status'

test('create status', t => {
  t.throws(() => createStatus(undefined))
  t.deepEqual(createStatus('CREATE'), {
    source: null,
    target: 'CREATE'
  })
})

test('update status', t => {
  t.throws(() => updateStatus(createStatus({}), undefined))
  t.deepEqual(
    updateStatus(createStatus({}), 'UPDATE'),
    { source: null, target: 'UPDATE' }
  )
})

test('commit status', t => {
  t.deepEqual(
    commitStatus(createStatus('COMMIT')),
    { source: 'COMMIT', target: 'COMMIT' }
  )
})
