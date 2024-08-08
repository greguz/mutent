import { getAdapterName, iterateContext } from './adapter.mjs'
import { Entity } from './entity.mjs'
import { MutentError } from './error.mjs'
import {
  assign,
  commit,
  ddelete,
  ensure,
  filter,
  limit,
  skip,
  tap,
  update
} from './mutators.mjs'
import {
  mergeHooks,
  normalizeHooks,
  normalizeMutators,
  parseCommitMode,
  parseWriteMode,
  parseWriteSize
} from './options.mjs'
import { isAsyncIterable, isIterable, isObjectLike } from './util.mjs'

export class Mutation {
  constructor (ctx, mutators = []) {
    this._ctx = ctx
    this._mutators = mutators
    this.mutable = false
  }

  assign (...objects) {
    return this.pipe(assign(...objects))
  }

  async consume (options) {
    let count = 0
    // eslint-disable-next-line
    for await (const _ of this.iterate(options)) {
      count++
    }
    return count
  }

  commit () {
    return this.pipe(commit())
  }

  delete (predicate) {
    return this.pipe(ddelete(predicate))
  }

  ensure (one) {
    return this.pipe(ensure(one))
  }

  filter (predicate) {
    return this.pipe(filter(predicate))
  }

  iterate (options) {
    return iterateMethod(
      prepareContext(this._ctx, options),
      this._mutators
    )
  }

  limit (n) {
    return this.pipe(limit(n))
  }

  pipe (...mutators) {
    if (this.mutable) {
      this._mutators.push(...mutators)
      return this
    }

    return new Mutation(
      this._ctx,
      this._mutators.concat(mutators)
    )
  }

  skip (n) {
    return this.pipe(skip(n))
  }

  tap (callback) {
    return this.pipe(tap(callback))
  }

  unwrap (options) {
    return unwrapMethod(
      prepareContext(this._ctx, options),
      this._mutators
    )
  }

  update (mapper) {
    return this.pipe(update(mapper))
  }
}

function isMultiple (intent, argument) {
  if (intent === 'CREATE' || intent === 'FROM') {
    return isIterable(argument) || isAsyncIterable(argument)
  } else if (intent === 'FIND' || intent === 'READ') {
    return false
  } else {
    return true
  }
}

function prepareContext (ctx, options = {}) {
  if (!isObjectLike(options)) {
    throw new TypeError('Unwrap options must be an object')
  }

  const mutentOptions = Object(options.mutent)
  return {
    ...ctx,
    commitMode: mutentOptions.commitMode !== undefined
      ? parseCommitMode(mutentOptions.commitMode)
      : ctx.commitMode,
    handlers: ctx.handlers.concat(
      normalizeMutators(mutentOptions.handlers)
    ),
    hooks: mergeHooks(ctx.hooks, normalizeHooks(mutentOptions.hooks)),
    multiple: isMultiple(ctx.intent, ctx.argument),
    mutators: ctx.mutators.concat(
      normalizeMutators(mutentOptions.mutators)
    ),
    opaque: mutentOptions.opaque,
    options,
    writeMode: mutentOptions.writeMode !== undefined
      ? parseWriteMode(mutentOptions.writeMode)
      : ctx.writeMode,
    writeSize: mutentOptions.writeSize !== undefined
      ? parseWriteSize(mutentOptions.writeSize)
      : ctx.writeSize
  }
}

async function * iterateMethod (ctx, mutators) {
  const { adapter, argument, intent, multiple } = ctx

  const chain = [
    // Plugins' mutators
    ...ctx.mutators,
    // Local chain mutators
    ...mutators,
    // Internal end/safe mutator
    mutatorClose,
    // Plugins' handlers (end mutators)
    ...ctx.handlers
  ]

  const iterable = chain.reduce(
    (acc, mutator) => mutator(acc, ctx),
    iterateEntities(iterateContext(ctx), ctx)
  )

  let count = 0
  for await (const entity of iterable) {
    if (!multiple && count++ >= 1) {
      throw new MutentError(
        'EMUT_MUTATION_OVERFLOW',
        'Current transaction returned multiple values unexpectedly',
        {
          adapter: getAdapterName(adapter),
          intent,
          argument
        }
      )
    }
    yield entity.valueOf()
  }

  if (intent === 'READ' && count <= 0) {
    throw new MutentError(
      'EMUT_ENTITY_REQUIRED',
      'Current transaction requires one entity to output',
      {
        adapter: getAdapterName(adapter),
        intent,
        argument
      }
    )
  }
}

async function unwrapMethod (ctx, mutators) {
  const results = []
  for await (const data of iterateMethod(ctx, mutators)) {
    results.push(data)
  }
  return ctx.multiple
    ? results
    : results.length > 0
      ? results[0]
      : null
}

async function * iterateEntities (iterable, ctx) {
  const { hooks, intent } = ctx

  for await (const data of iterable) {
    const entity = intent === 'CREATE'
      ? Entity.create(data)
      : Entity.read(data)

    for (const hook of hooks.onEntity) {
      await hook(entity, ctx)
    }

    yield entity
  }
}

async function * mutatorClose (iterable, ctx) {
  const { commitMode } = ctx

  if (commitMode === 'AUTO') {
    yield * commit()(iterable, ctx)
  } else if (commitMode === 'MANUAL') {
    yield * iterable
  } else {
    yield * mutatorSafe(iterable, ctx)
  }
}

async function * mutatorSafe (iterable, ctx) {
  const { adapter, argument, intent } = ctx

  for await (const entity of iterable) {
    if (entity.shouldCommit) {
      throw new MutentError(
        'EMUT_UNSAFE_UNWRAP',
        'An entity with uncommitted changes was found',
        {
          adapter: getAdapterName(adapter),
          intent,
          argument,
          entity
        }
      )
    }
    yield entity
  }
}
