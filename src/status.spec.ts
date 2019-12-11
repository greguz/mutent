import test from 'ava'

import { createStatus, updateStatus, commitStatus } from './status'

test('createStatus', t => {
  t.throws(() => createStatus(undefined))
  t.deepEqual(createStatus('CREATE'), {
    source: null,
    target: 'CREATE',
    options: undefined
  })
})

test('updateStatus', t => {
  t.throws(() => updateStatus(createStatus({}), undefined))
  t.deepEqual(
    updateStatus(createStatus({}), 'UPDATE'),
    { source: null, target: 'UPDATE', options: undefined }
  )
})

test('commit status', t => {
  t.deepEqual(
    commitStatus(createStatus('COMMIT')),
    { source: 'COMMIT', target: 'COMMIT', options: undefined }
  )
})
