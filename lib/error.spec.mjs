import test from 'ava'

import { MutentError } from './error.mjs'

test('error', t => {
  const error = new MutentError('EMUT_TEST', 'Oh no', { more: 'info' })

  t.is(error.code, 'EMUT_TEST')
  t.is(error.message, 'Oh no')
  t.deepEqual(error.info, { more: 'info' })

  t.deepEqual(error.toJSON(), {
    error: 'EMUT_TEST',
    message: 'Oh no',
    info: {
      more: 'info'
    }
  })

  t.is(Object.prototype.toString.call(error), '[object Error]')

  t.is(error.toString(), 'MutentError [EMUT_TEST]: Oh no')

  const empty = new MutentError()
  t.is(empty.code, 'EMUT_GENERIC_ERROR')
})
