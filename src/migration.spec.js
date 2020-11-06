import test from 'ava'

import { Migration } from './migration'
import { readStatus } from './status'

test('migration: default', async t => {
  const migration = new Migration({
    1: data => {
      return {
        version: 1,
        value: parseInt(data.value, 10)
      }
    },
    2: data => {
      return {
        version: 2,
        number: data.value
      }
    }
  })

  const out = await migration.migrateStatus(
    readStatus({
      value: '42'
    })
  )
  t.deepEqual(out, {
    created: false,
    updated: true,
    deleted: false,
    source: {
      value: '42'
    },
    target: {
      version: 2,
      number: 42
    }
  })
})

test('migration: missing stratery', async t => {
  const migration = new Migration({
    2: data => data
  })

  await t.throwsAsync(migration.migrateStatus(readStatus({})), {
    code: 'EMUT_MISSING_STRATEGY'
  })
})

test('migration: no upgrade', async t => {
  const migration = new Migration({
    1: data => data
  })

  await t.throwsAsync(migration.migrateStatus(readStatus({})), {
    code: 'EMUT_EXPECTED_UPGRADE'
  })
})
