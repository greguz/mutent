import { adapterFilter, adapterFind } from './adapter'
import { MutentError } from './error'
import { assign, commit, ddelete, filter, iif, tap, update } from './mutators'
import { createStatus, readStatus, shouldCommit } from './status'

function readContext(context, options) {
  const { argument, intent } = context
  switch (intent) {
    case 'CREATE':
    case 'FROM':
      return typeof argument === 'function' ? argument(options) : argument
    case 'FIND':
    case 'READ':
      return adapterFind(context, options)
    case 'FILTER':
      return adapterFilter(context, options)
  }
}

function isAsyncIterable(value) {
  return Symbol.asyncIterator in Object(value)
}

function isIterable(value) {
  return Symbol.iterator in Object(value)
}

async function* fromPromise(blob) {
  const data = await blob
  if (data !== null && data !== undefined) {
    yield data
  }
}

async function* iterateNewData(iterable) {
  for await (const data of iterable) {
    yield createStatus(data)
  }
}

async function* iterateOldData(iterable) {
  for await (const data of iterable) {
    yield readStatus(data)
  }
}

async function* iterateMany(context, blob, mutators, options) {
  const iterable = mutators.reduce(
    (accumulator, mutator) => mutator.call(context, accumulator, options),
    context.intent === 'CREATE' ? iterateNewData(blob) : iterateOldData(blob)
  )

  for await (const status of iterable) {
    yield status.target
  }
}

async function* iterateOne(context, blob, mutators, options) {
  const { argument, intent, store } = context
  let count = 0
  for await (const data of iterateMany(
    context,
    fromPromise(blob),
    mutators,
    options
  )) {
    if (count++ > 0) {
      throw new Error('Unexpected iteration')
    }
    yield data
  }
  if (count <= 0 && intent !== 'FIND') {
    throw new MutentError('EMUT_EXPECTED_ENTITY', 'Required entity not found', {
      argument,
      intent,
      store
    })
  }
}

async function unwrapMany(context, blob, mutators, options) {
  const results = []
  for await (const data of iterateMany(context, blob, mutators, options)) {
    results.push(data)
  }
  return results
}

async function unwrapOne(context, blob, mutators, options) {
  let result = null
  for await (const item of iterateOne(context, blob, mutators, options)) {
    result = item
  }
  return result
}

async function* mutatorSafe(iterable, options) {
  for await (const status of iterable) {
    if (shouldCommit(status)) {
      throw new MutentError('EMUT_UNSAFE_UNWRAP', 'Unsafe mutation', {
        store: this.store,
        data: status.target,
        options
      })
    }
    yield status
  }
}

function mutatorClose(iterable, options) {
  const mutentOptions = options.mutent || {}
  const commitMode = mutentOptions.commitMode || this.commitMode || 'AUTO'

  if (commitMode === 'AUTO') {
    return commit().call(this, iterable, options)
  } else if (commitMode === 'MANUAL') {
    return iterable
  } else {
    return mutatorSafe.call(this, iterable, options)
  }
}

function unwrap(context, mutators, options) {
  const blob = readContext(context, options)
  context.multiple = isIterable(blob) || isAsyncIterable(blob)
  return isIterable(blob) || isAsyncIterable(blob)
    ? unwrapMany(context, blob, mutators, options)
    : unwrapOne(context, blob, mutators, options)
}

function iterate(context, mutators, options) {
  const blob = readContext(context, options)
  context.multiple = isIterable(blob) || isAsyncIterable(blob)
  return context.multiple
    ? iterateMany(context, blob, mutators, options)
    : iterateOne(context, blob, mutators, options)
}

export class Mutation {
  static create(context, mutators) {
    return new Mutation(context, mutators)
  }

  constructor(context, mutators = []) {
    this._context = context
    this._mutators = mutators
  }

  assign(...objects) {
    return this.pipe(assign(...objects))
  }

  commit() {
    return this.pipe(commit())
  }

  delete() {
    return this.pipe(ddelete())
  }

  filter(predicate) {
    return this.pipe(filter(predicate))
  }

  if(condition, whenTrue, whenFalse) {
    return this.pipe(iif(condition, whenTrue, whenFalse))
  }

  iterate(options = {}) {
    return iterate(this._context, [...this._mutators, mutatorClose], options)
  }

  pipe(...mutators) {
    return new Mutation(this._context, this._mutators.concat(mutators))
  }

  tap(callback) {
    return this.pipe(tap(callback))
  }

  unwrap(options = {}) {
    return unwrap(this._context, [...this._mutators, mutatorClose], options)
  }

  update(mapper) {
    return this.pipe(update(mapper))
  }
}
