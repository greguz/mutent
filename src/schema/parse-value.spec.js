import test from 'ava'

import { parseValue } from './parse-value'

test('parseValue:function', t => {
  t.is(
    parseValue('42', value => parseInt(value, 10)),
    42
  )
})

test('parseValue:string', t => {
  t.is(
    parseValue('42', 'test', {
      test(value, radix = 10) {
        return parseInt(value, radix)
      }
    }),
    42
  )
  t.throws(() => parseValue('42', 'nope'), { code: 'EMUT_EXPECTED_PARSER' })
})

test('parseValue:array', t => {
  t.is(
    parseValue('101010', ['test', 2], {
      test(value, radix = 10) {
        return parseInt(value, radix)
      }
    }),
    42
  )
  t.throws(() => parseValue('42', ['nope']), { code: 'EMUT_EXPECTED_PARSER' })
})

test('parseValue:object', t => {
  t.is(
    parseValue(
      '2A',
      { test: [16] },
      {
        test(value, radix = 10) {
          return parseInt(value, radix)
        }
      }
    ),
    42
  )
  t.throws(() => parseValue('42', { nope: [] }), {
    code: 'EMUT_EXPECTED_PARSER'
  })
})
