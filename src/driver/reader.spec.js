import test from 'ava'

import { driverCount, driverExists } from './reader'

test('reader:count', async t => {
  t.is(
    await driverCount(
      {
        count(query, options) {
          t.deepEqual(query, { imma: 'query' })
          t.deepEqual(options, { imma: 'options' })
          return 42
        }
      },
      { imma: 'query' },
      { imma: 'options' }
    ),
    42
  )
  await t.throwsAsync(driverCount({}, {}, {}), {
    code: 'EMUT_EXPECTED_DRIVER_METHOD'
  })
})

test('reader:exists', async t => {
  t.true(
    await driverExists(
      {
        exists(query, options) {
          t.deepEqual(query, { imma: 'query' })
          t.deepEqual(options, { imma: 'options' })
          return true
        }
      },
      { imma: 'query' },
      { imma: 'options' }
    )
  )
  t.true(
    await driverExists(
      {
        find(query, options) {
          t.deepEqual(query, { imma: 'query' })
          t.deepEqual(options, { imma: 'options' })
          return { a: 'document' }
        }
      },
      { imma: 'query' },
      { imma: 'options' }
    )
  )
  await t.throwsAsync(driverExists({}, {}, {}), {
    code: 'EMUT_EXPECTED_DRIVER_METHOD'
  })
})
