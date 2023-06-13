import test from 'ava'

import { isAsyncIterable, isIterable } from './util.mjs'

test('util:isAsyncIterable', t => {
  t.true(isAsyncIterable({ [Symbol.asyncIterator] () {} }))
  t.false(isAsyncIterable([]))
})

test('util:isIterable', t => {
  t.true(isIterable([]))
  t.false(isIterable({}))
})
