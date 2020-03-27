import test, { ExecutionContext } from 'ava'

import { Plugin, Handler, bindDriver } from './handler'
import { Status } from './status'

async function handleStatus<S, T, O> (
  t: ExecutionContext,
  handler: Handler<O>,
  status: Status<S, T>,
  options?: O
) {
  const result = await handler(status, options)
  t.true(result.source === status.target)
  t.true(result.target === status.target)
}

async function testHandler<S, T, O> (
  t: ExecutionContext,
  handler: Handler<O>,
  source: S,
  target: T,
  options?: O
) {
  await handleStatus(t, handler, { source: null, target }, options)
  await handleStatus(t, handler, { source, target }, options)
  await handleStatus(t, handler, { source, target: null }, options)
  await handleStatus(t, handler, { source: null, target: null }, options)
}

test('void handler', async t => {
  t.plan(8)
  await testHandler(t, bindDriver({}), 'Bob', 'Alice')
})

test('commit handler', async t => {
  t.plan(8 + 3 + 4)
  async function commit (source: any, target: any, options: any) {
    if (source === null && target === null) {
      t.fail()
    }
    if (source !== null) {
      t.is(source, 'Bob')
    }
    if (target !== null) {
      t.is(target, 'Alice')
    }
    t.is(options.hello, 'world')
  }
  await testHandler(
    t,
    bindDriver({}, commit),
    'Bob',
    'Alice',
    { hello: 'world' }
  )
})

test('plugin create handler', async t => {
  t.plan(8 + 2)
  const plugin: Plugin<any> = {
    async create (target, options) {
      t.is(target, 'Alice')
      t.is(options.hello, 'world')
    }
  }
  await testHandler(
    t,
    bindDriver({}, plugin),
    'Bob',
    'Alice',
    { hello: 'world' }
  )
})

test('plugin update handler', async t => {
  t.plan(8 + 3)
  const plugin: Plugin<any> = {
    async update (source, target, options) {
      t.is(source, 'Bob')
      t.is(target, 'Alice')
      t.is(options.hello, 'world')
    }
  }
  await testHandler(
    t,
    bindDriver({}, plugin),
    'Bob',
    'Alice',
    { hello: 'world' }
  )
})

test('plugin delete handler', async t => {
  t.plan(8 + 2)
  const plugin: Plugin<any> = {
    async delete (source, options) {
      t.is(source, 'Bob')
      t.is(options.hello, 'world')
    }
  }
  await testHandler(
    t,
    bindDriver({}, plugin),
    'Bob',
    'Alice',
    { hello: 'world' }
  )
})
