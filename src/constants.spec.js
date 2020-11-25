import test from 'ava'

import { isConstantValid, pushConstant, readConstants } from './constants'

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
