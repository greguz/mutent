import test from 'ava'

import { createMigration, migrateStatus } from './migration'
import { readStatus } from './status'

test('migration:smoke', async t => {
  const migration = createMigration({
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
  })

  const out = await migrateStatus(
    migration,
    readStatus({
      value: '41.7'
    })
  )
  t.deepEqual(out, {
    created: false,
    updated: true,
    deleted: false,
    source: {
      value: '41.7'
    },
    target: {
      version: 3,
      number: 42
    }
  })
})

test('migration:missingStrategy', async t => {
  const migration = createMigration({
    2: data => data
  })
  await t.throwsAsync(migrateStatus(migration, readStatus({})), {
    code: 'EMUT_MISSING_STRATEGY'
  })
})

test('migration:expectedUpgrade', async t => {
  const migration = createMigration({
    1: data => data
  })
  await t.throwsAsync(migrateStatus(migration, readStatus({})), {
    code: 'EMUT_EXPECTED_UPGRADE'
  })
})

test('migration:futureVersion', async t => {
  const migration = createMigration({
    1: data => ({ ...data, version: 1 })
  })
  const out = await migrateStatus(
    migration,
    readStatus({ version: 2, value: 'TEST' })
  )
  t.deepEqual(out, {
    created: false,
    updated: false,
    deleted: false,
    source: {
      version: 2,
      value: 'TEST'
    },
    target: {
      version: 2,
      value: 'TEST'
    }
  })
})
