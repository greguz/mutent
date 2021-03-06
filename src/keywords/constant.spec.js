import test from 'ava'

import {
  isConstantValid,
  pushConstant,
  readConstants,
  writeConstants
} from './constant'

test('constants', t => {
  const obj = {
    a: 'value',
    b: 'constant'
  }
  t.deepEqual(readConstants(obj), [])
  pushConstant(obj, 'b', obj.b)
  const constants = readConstants(obj)
  t.deepEqual(constants, [{ path: 'b', value: 'constant' }])
  t.true(isConstantValid(constants[0], { b: 'constant' }))
  t.false(isConstantValid(constants[0], { b: 'nope' }))
})

test('writeConstants', t => {
  const source = {
    a: true
  }
  for (const key of Object.keys(source)) {
    pushConstant(source, key, source[key])
  }
  const target = {
    ...source
  }
  t.deepEqual(readConstants(target), [])
  writeConstants(target, readConstants(source))
  t.deepEqual(readConstants(target), [{ path: 'a', value: true }])
})
