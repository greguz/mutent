import test from 'ava'

import { createMigration, migrateData } from './migration'

test('migration:smoke', async t => {
  t.throws(() => createMigration(null), {
    code: 'EMUT_VERSION_INVALID'
  })
  t.throws(() => createMigration(-1), {
    code: 'EMUT_VERSION_INVALID'
  })
  t.throws(() => createMigration(Infinity), {
    code: 'EMUT_VERSION_INVALID'
  })

  const migration = createMigration(3, {
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

  const out = await migrateData(migration, {
    value: '41.7'
  })
  t.deepEqual(out, {
    version: 3,
    number: 42
  })
})

test('migration:absent', async t => {
  const migration = createMigration(2, { 2: data => data })
  await t.throwsAsync(migrateData(migration, {}), {
    code: 'EMUT_MIGRATION_ABSENT'
  })
})

test('migration:upgrade', async t => {
  const migration = createMigration(1, { 1: data => data })
  await t.throwsAsync(migrateData(migration, {}), {
    code: 'EMUT_MIGRATION_UPGRADE'
  })
})

test('migration:future', async t => {
  const migration = createMigration(1, { 1: data => ({ ...data, version: 1 }) })
  await t.throwsAsync(migrateData(migration, { version: 2, value: 'TEST' }), {
    code: 'EMUT_MIGRATION_FUTURE'
  })
})

test('migration:unknown', async t => {
  const migration = createMigration(1, { 1: data => ({ ...data, version: 1 }) })
  await t.throwsAsync(migrateData(migration, { version: new Date() }), {
    code: 'EMUT_MIGRATION_UNKNOWN'
  })
})
