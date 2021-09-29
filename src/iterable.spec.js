import test from 'ava'

import { isAsyncIterable, isIterable, unwrapIterable } from './iterable'

test('iterable:isAsyncIterable', t => {
  t.true(isAsyncIterable({ [Symbol.asyncIterator]() {} }))
  t.false(isAsyncIterable([]))
})

test('iterable:isIterable', t => {
  t.true(isIterable([]))
  t.false(isIterable({}))
})

test('iterable:unwrapIterable', t => {
  unwrapIterable({ [Symbol.asyncIterator]() {} })
  unwrapIterable([])
  t.throws(() => unwrapIterable({}))
})
