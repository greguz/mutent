import test from 'ava'

import {
  createStatus,
  deleteStatus,
  readStatus,
  shouldCommit,
  shouldCreate,
  shouldDelete,
  shouldUpdate,
  updateStatus
} from './status'

test('status:create', t => {
  t.deepEqual(createStatus('CREATE'), {
    created: true,
    updated: false,
    deleted: false,
    source: null,
    target: 'CREATE'
  })
})

test('status:read', t => {
  t.deepEqual(readStatus('READ'), {
    created: false,
    updated: false,
    deleted: false,
    source: 'READ',
    target: 'READ'
  })
})

test('status:update', t => {
  t.deepEqual(updateStatus(readStatus('READ'), 'UPDATE'), {
    created: false,
    updated: true,
    deleted: false,
    source: 'READ',
    target: 'UPDATE'
  })

  t.throws(() => updateStatus(createStatus(''), undefined), {
    code: 'EMUT_NULLISH_UPDATE'
  })
  t.throws(() => updateStatus(createStatus(''), null), {
    code: 'EMUT_NULLISH_UPDATE'
  })
})

test('status:delete', t => {
  t.deepEqual(deleteStatus(readStatus('READ')), {
    created: false,
    updated: false,
    deleted: true,
    source: 'READ',
    target: 'READ'
  })
})

test('status:shouldCreate', t => {
  t.true(shouldCreate(createStatus('CREATE')))
  t.false(shouldCreate(readStatus('READ')))

  t.true(shouldCreate(updateStatus(createStatus('CREATE'), 'UPDATE')))
  t.false(shouldCreate(updateStatus(readStatus('READ'), 'UPDATE')))

  t.false(shouldCreate(deleteStatus(createStatus('CREATE'))))
  t.false(shouldCreate(deleteStatus(readStatus('READ'))))

  t.false(
    shouldCreate(deleteStatus(updateStatus(createStatus('CREATE'), 'UPDATE')))
  )
  t.false(
    shouldCreate(deleteStatus(updateStatus(readStatus('READ'), 'UPDATE')))
  )
})

test('status:shouldUpdate', t => {
  t.false(shouldUpdate(createStatus('CREATE')))
  t.false(shouldUpdate(readStatus('READ')))

  t.false(shouldUpdate(updateStatus(createStatus('CREATE'), 'UPDATE')))
  t.true(shouldUpdate(updateStatus(readStatus('READ'), 'UPDATE')))

  t.false(shouldUpdate(deleteStatus(createStatus('CREATE'))))
  t.false(shouldUpdate(deleteStatus(readStatus('READ'))))

  t.false(
    shouldUpdate(deleteStatus(updateStatus(createStatus('CREATE'), 'UPDATE')))
  )
  t.false(
    shouldUpdate(deleteStatus(updateStatus(readStatus('READ'), 'UPDATE')))
  )
})

test('status:shouldDelete', t => {
  t.false(shouldDelete(createStatus('CREATE')))
  t.false(shouldDelete(readStatus('READ')))

  t.false(shouldDelete(updateStatus(createStatus('CREATE'), 'UPDATE')))
  t.false(shouldDelete(updateStatus(readStatus('READ'), 'UPDATE')))

  t.false(shouldDelete(deleteStatus(createStatus('CREATE'))))
  t.true(shouldDelete(deleteStatus(readStatus('READ'))))

  t.false(
    shouldDelete(deleteStatus(updateStatus(createStatus('CREATE'), 'UPDATE')))
  )
  t.true(shouldDelete(deleteStatus(updateStatus(readStatus('READ'), 'UPDATE'))))
})

test('status:shouldCommit', t => {
  t.true(shouldCommit(createStatus('CREATE')))
  t.false(shouldCommit(readStatus('READ')))

  t.true(shouldCommit(updateStatus(createStatus('CREATE'), 'UPDATE')))
  t.true(shouldCommit(updateStatus(readStatus('READ'), 'UPDATE')))

  t.false(shouldCommit(deleteStatus(createStatus('CREATE'))))
  t.true(shouldCommit(deleteStatus(readStatus('READ'))))

  t.false(
    shouldCommit(deleteStatus(updateStatus(createStatus('CREATE'), 'UPDATE')))
  )
  t.true(shouldCommit(deleteStatus(updateStatus(readStatus('READ'), 'UPDATE'))))
})
