import test from 'ava'
import { subscribe } from 'fluido'

import { streamOne } from './data'
import { createMutation } from './mutation'
import { readStatus } from './status'

test('streamOne#nulls', async t => {
  const out = await subscribe(
    streamOne(
      null,
      readStatus,
      createMutation().render(),
      {}
    )
  )
  t.is(out, null)
})
