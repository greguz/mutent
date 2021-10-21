import { iterateContext } from './adapter'
import { Entity } from './entity'
import { MutentError } from './error'
import { isAsyncIterable, isIterable } from './iterable'
import { assign, commit, ddelete, filter, iif, tap, update } from './mutators'
import {
  mergeHooks,
  normalizeHooks,
  normalizeMutators,
  parseCommitMode,
  parseWriteMode,
  parseWriteSize
} from './options'

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
    for await (const data of this.iterate(options)) {
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

  filter (predicate) {
    return this.pipe(filter(predicate))
  }

  if (condition, whenTrue, whenFalse) {
    return this.pipe(iif(condition, whenTrue, whenFalse))
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
  const { adapter, argument, intent, store } = context

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
    options: unwrapOptions,
    store,
    writeMode: mutentOptions.writeMode !== undefined
      ? parseWriteMode(mutentOptions.writeMode)
      : context.writeMode,
    writeSize: mutentOptions.writeSize !== undefined
      ? parseWriteSize(mutentOptions.writeSize)
      : context.writeSize
  }
}

async function * iterateMethod (context, mutators) {
  const { argument, intent, multiple, options, store } = context

  const iterable = context.mutators.concat(mutators).reduce(
    (accumulator, mutator) => mutator(accumulator, context),
    iterateEntities(iterateContext(context), context)
  )

  let count = 0
  for await (const entity of iterable) {
    if (!multiple && count >= 1) {
      throw new MutentError(
        'EMUT_MUTATION_OVERFLOW',
        'Current transaction returned multiple values unexpectedly',
        { store, intent, argument, options }
      )
    }
    count++
    yield entity.valueOf()
  }

  if (!multiple && count <= 0 && intent !== 'FIND') {
    throw new MutentError(
      'EMUT_ENTITY_REQUIRED',
      'Current transaction requires one entity to output',
      { store, intent, argument, options }
    )
  }
}

async function unwrapMethod (context, mutators) {
  const results = []
  for await (const data of iterateMethod(context, mutators)) {
    results.push(data)
  }
  return context.multiple ? results : results.length > 0 ? results[0] : null
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

function mutatorClose (iterable, context) {
  const { commitMode } = context

  if (commitMode === 'AUTO') {
    return commit()(iterable, context)
  } else if (commitMode === 'MANUAL') {
    return iterable
  } else {
    return mutatorSafe(iterable, context)
  }
}

async function * mutatorSafe (iterable, context) {
  const { argument, intent, options, store } = context

  for await (const entity of iterable) {
    if (entity.shouldCommit) {
      throw new MutentError(
        'EMUT_UNSAFE_UNWRAP',
        'An entity with uncommitted changes was found',
        { store, intent, argument, options, entity }
      )
    }
    yield entity
  }
}
