import test from 'ava'

import { migrateStatus } from './migration'
import { readStatus } from './status'

test('migration: default', async t => {
  const out = await migrateStatus<any>(
    readStatus({
      value: '42'
    }),
    {
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
    }
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
  await t.throwsAsync(
    migrateStatus<any>(
      readStatus({}),
      { 2: data => data }
    ),
    { code: 'EMUT_MISSING_STRATEGY' }
  )
})

test('migration: no upgrade', async t => {
  await t.throwsAsync(
    migrateStatus<any>(
      readStatus({}),
      { 1: data => data }
    ),
    { code: 'EMUT_EXPECTED_UPGRADE' }
  )
})
