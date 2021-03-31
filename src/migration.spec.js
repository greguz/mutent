import test from 'ava'

import { migrate } from './migration'

test('migration:success', async t => {
  const migrationStrategies = {
    1: data => ({
      v: 1,
      number: parseFloat(data.value)
    }),
    2: data => ({
      v: 2,
      number: data.number
    }),
    3: data => ({
      v: 3,
      integer: Math.round(data.number)
    })
  }

  const out = await migrate(
    {
      migrationStrategies,
      version: 3,
      versionKey: 'v'
    },
    { value: '41.7' }
  )
  t.deepEqual(out, {
    v: 3,
    integer: 42
  })
})

test('migration:skip', async t => {
  const input = { v: 1 }
  const output = await migrate({ version: 1, versionKey: 'v' }, input)
  t.true(input === output)
})

test('migration:errors', async t => {
  await t.throwsAsync(
    migrate(
      {
        migrationStrategies: {},
        version: 1,
        versionKey: 'v'
      },
      {}
    ),
    { code: 'EMUT_EXPECTED_STRATEGY' }
  )

  await t.throwsAsync(
    migrate(
      {
        migrationStrategies: { 1: null },
        version: 1,
        versionKey: 'v'
      },
      {}
    ),
    { code: 'EMUT_INVALID_STRATEGY' }
  )

  await t.throwsAsync(
    migrate(
      {
        migrationStrategies: { 1: data => data },
        version: 1,
        versionKey: 'v'
      },
      {}
    ),
    { code: 'EMUT_INVALID_UPGRADE' }
  )

  await t.throwsAsync(
    migrate(
      {
        version: 0,
        versionKey: 'v'
      },
      { v: 1 }
    ),
    { code: 'EMUT_FUTURE_ENTITY' }
  )

  await t.throwsAsync(
    migrate(
      {
        version: 0,
        versionKey: 'v'
      },
      null
    ),
    { code: 'EMUT_UNVERSIONABLE_ENTITY' }
  )

  await t.throwsAsync(
    migrate(
      {
        version: 0,
        versionKey: 'v'
      },
      { v: true }
    ),
    { code: 'EMUT_INVALID_ENTITY_VERSION' }
  )
})
