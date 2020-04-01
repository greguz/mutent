import test, { ExecutionContext } from 'ava'

import { deleteValue } from './deleted'
import { Driver, Handler, createHandler } from './handler'
import { Status } from './status'

interface Item {
  value: number
}

async function handleStatus<T, O> (
  t: ExecutionContext,
  handler: Handler<T, O>,
  status: Status<T>,
  options?: O
) {
  const result = await handler(status, options)
  t.true(result.source === status.target)
  t.true(result.target === status.target)
}

async function testHandler (
  t: ExecutionContext,
  source: Item,
  target: Item,
  driver?: Driver<Item, any>,
  options?: any
) {
  const handler = createHandler(driver)
  return [
    await handleStatus(t, handler, { source: null, target }, options),
    await handleStatus(t, handler, { source, target }, options),
    await handleStatus(t, handler, { source, target: deleteValue(target) }, options),
    await handleStatus(t, handler, { source: null, target: deleteValue(target) }, options)
  ]
}

test('void handler', async t => {
  t.plan(8)
  await testHandler(
    t,
    { value: 0 },
    { value: 100 }
  )
})

test('plugin create handler', async t => {
  t.plan(8 + 2)
  const plugin: Driver<Item> = {
    async create (target, options) {
      t.is(target.value, 100)
      t.is(options.hello, 'world')
    }
  }
  await testHandler(
    t,
    { value: 0 },
    { value: 100 },
    plugin,
    { hello: 'world' }
  )
})

test('plugin update handler', async t => {
  t.plan(8 + 3)
  const plugin: Driver<Item> = {
    async update (source, target, options) {
      t.is(source.value, 0)
      t.is(target.value, 100)
      t.is(options.hello, 'world')
    }
  }
  await testHandler(
    t,
    { value: 0 },
    { value: 100 },
    plugin,
    { hello: 'world' }
  )
})

test('plugin delete handler', async t => {
  t.plan(8 + 2)
  const plugin: Driver<Item> = {
    async delete (source, options) {
      t.is(source.value, 0)
      t.is(options.hello, 'world')
    }
  }
  await testHandler(
    t,
    { value: 0 },
    { value: 100 },
    plugin,
    { hello: 'world' }
  )
})
