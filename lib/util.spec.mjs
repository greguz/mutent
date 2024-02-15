import test from 'ava'

import { isAsyncIterable, isIterable } from './util.mjs'

test('util:isAsyncIterable', t => {
  t.false(isAsyncIterable(''))
  t.true(isAsyncIterable({ [Symbol.asyncIterator] () {} }))
  t.false(isAsyncIterable([]))
})

test('util:isIterable', t => {
  t.false(isIterable(''))
  t.true(isIterable([]))
  t.false(isIterable({}))
})
