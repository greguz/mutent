import test from 'ava'

import { deleteValue, isDeleted, restoreValue } from './deleted'

test('delete object', t => {
  const obj = { value: 42 }
  t.is(obj.value, 42)
  t.false(isDeleted(obj))
  const deletedObj = deleteValue(obj)
  t.is(deletedObj.value, 42)
  t.true(isDeleted(deletedObj))
  const restoredObj = restoreValue(deletedObj)
  t.is(restoredObj.value, 42)
  t.false(isDeleted(restoredObj))
})

test('delete primitive', t => {
  const val = 42
  t.is(val, 42)
  t.false(isDeleted(val))
  const deletedVal = deleteValue(val)
  t.is(deletedVal, 42)
  // t.true(isDeleted(deletedVal))
  const restoredVal = restoreValue(deletedVal)
  t.is(restoredVal, 42)
  t.false(isDeleted(restoredVal))
})
