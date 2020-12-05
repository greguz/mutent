import test from 'ava'

import { createMigration, migrateData } from './migration'

test('migration:smoke', async t => {
  t.throws(() => createMigration(undefined, null), {
    code: 'EMUT_INVALID_VERSION'
  })

  const migration = createMigration(
    {
      1: data => ({
        version: 1,
        value: parseFloat(data.value)
      }),
      2: data => ({
        version: 2,
        number: data.value
      }),
      3: data => ({
        version: 3,
        number: Math.round(data.number)
      })
    },
    3
  )

  const out = await migrateData(migration, {
    value: '41.7'
  })
  t.deepEqual(out, {
    version: 3,
    number: 42
  })
})

test('migration:missed', async t => {
  const migration = createMigration(
    {
      2: data => data
    },
    2
  )
  await t.throwsAsync(migrateData(migration, {}), {
    code: 'EMUT_MISSING_STRATEGY'
  })
})

test('migration:upgrade', async t => {
  const migration = createMigration(
    {
      1: data => data
    },
    1
  )
  await t.throwsAsync(migrateData(migration, {}), {
    code: 'EMUT_EXPECTED_UPGRADE'
  })
})

test('migration:future', async t => {
  const migration = createMigration(
    {
      1: data => ({ ...data, version: 1 })
    },
    1
  )
  await t.throwsAsync(migrateData(migration, { version: 2, value: 'TEST' }), {
    code: 'EMUT_FUTURE_VERSION'
  })
})
