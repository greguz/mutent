import { getAdapterName, iterateContext } from './adapter.mjs'
import { Entity } from './entity.mjs'
import { MutentError } from './error.mjs'
import {
  assign,
  commit,
  ddelete,
  ensure,
  filter,
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
import { isAsyncIterable, isIterable } from './util.mjs'

export class Mutation {
  constructor (context, mutators = []) {
    this._context = context
    this._mutators = mutators
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

  delete () {
    return this.pipe(ddelete())
  }

  ensure (one) {
    return this.pipe(ensure(one))
  }

  filter (predicate) {
    return this.pipe(filter(predicate))
  }

  iterate (options) {
    return iterateMethod(
      prepareContext(this._context, options),
      this._mutators.concat(mutatorClose)
    )
  }

  pipe (...mutators) {
    return new Mutation(this._context, this._mutators.concat(mutators))
  }

  tap (callback) {
    return this.pipe(tap(callback))
  }

  unwrap (options) {
    return unwrapMethod(
      prepareContext(this._context, options),
      this._mutators.concat(mutatorClose)
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

function prepareContext (context, unwrapOptions) {
  const { adapter, argument, intent } = context

  unwrapOptions = Object(unwrapOptions)
  const mutentOptions = Object(unwrapOptions.mutent)

  return {
    adapter,
    argument,
    commitMode: mutentOptions.commitMode !== undefined
      ? parseCommitMode(mutentOptions.commitMode)
      : context.commitMode,
    hooks: mergeHooks(context.hooks, normalizeHooks(mutentOptions.hooks)),
    intent,
    multiple: isMultiple(intent, argument),
    mutators: context.mutators.concat(
      normalizeMutators(mutentOptions.mutators)
    ),
    opaque: mutentOptions.opaque,
    options: unwrapOptions,
    writeMode: mutentOptions.writeMode !== undefined
      ? parseWriteMode(mutentOptions.writeMode)
      : context.writeMode,
    writeSize: mutentOptions.writeSize !== undefined
      ? parseWriteSize(mutentOptions.writeSize)
      : context.writeSize
  }
}

async function * iterateMethod (context, mutators) {
  const { adapter, argument, intent, multiple, options } = context

  const iterable = context.mutators.concat(mutators).reduce(
    (accumulator, mutator) => mutator(accumulator, context),
    iterateEntities(iterateContext(context), context)
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
          argument,
          options
        }
      )
    }
    yield entity.valueOf()
  }

  if (!multiple && count <= 0 && intent !== 'FIND') {
    throw new MutentError(
      'EMUT_ENTITY_REQUIRED',
      'Current transaction requires one entity to output',
      {
        adapter: getAdapterName(adapter),
        intent,
        argument,
        options
      }
    )
  }
}

async function unwrapMethod (context, mutators) {
  const results = []
  for await (const data of iterateMethod(context, mutators)) {
    results.push(data)
  }
  return context.multiple
    ? results
    : results.length > 0
      ? results[0]
      : null
}

async function * iterateEntities (iterable, context) {
  const { hooks, intent } = context

  for await (const data of iterable) {
    const entity = intent === 'CREATE'
      ? Entity.create(data)
      : Entity.read(data)

    for (const hook of hooks.onEntity) {
      await hook(entity, context)
    }

    yield entity
  }
}

async function * mutatorClose (iterable, context) {
  const { commitMode } = context

  if (commitMode === 'AUTO') {
    yield * commit()(iterable, context)
  } else if (commitMode === 'MANUAL') {
    yield * iterable
  } else {
    yield * mutatorSafe(iterable, context)
  }
}

async function * mutatorSafe (iterable, context) {
  const { adapter, argument, intent, options } = context

  for await (const entity of iterable) {
    if (entity.shouldCommit) {
      throw new MutentError(
        'EMUT_UNSAFE_UNWRAP',
        'An entity with uncommitted changes was found',
        {
          adapter: getAdapterName(adapter),
          intent,
          argument,
          options,
          entity
        }
      )
    }
    yield entity
  }
}
