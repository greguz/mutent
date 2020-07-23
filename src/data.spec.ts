import test from 'ava'
import { subscribe } from 'fluido'

import { streamOne } from './data'
import { readStatus } from './status'

test('streamOne#nulls', async t => {
  const out = await subscribe(
    streamOne(
      null,
      readStatus,
      [],
      {},
      {}
    )
  )
  t.is(out, null)
})
