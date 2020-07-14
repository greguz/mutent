import fluente from 'fluente'
import Herry from 'herry'

import { UnwrapOptions } from './data'
import { Status, createStatus, deleteStatus, readStatus, shouldCommit, updateStatus } from './status'
import { MaybePromise, isUndefined, objectify, isNil } from './utils'
import { Writer, handleWriter } from './writer'

export type Mapper<T, A extends any[]> = (
  data: Exclude<T, null>,
  ...args: A
) => MaybePromise<T>

export type Mutator<T, O = any> = (
  status: Status<T>,
  options: Partial<O>
) => MaybePromise<Status<T>>

export type Condition<T> = ((data: T) => MaybePromise<boolean>) | boolean

export interface Mutation<T, O = any> {
  update<A extends any[]> (mapper: Mapper<T, A>, ...args: A): Mutation<T>
  assign (object: Partial<T>): Mutation<T>
  delete (): Mutation<T>
  commit (): Mutation<T>
  if (condition: Condition<T>, mutation: Mutation<T, O>): Mutation<T, O>
  unless (condition: Condition<T>, mutation: Mutation<T, O>): Mutation<T, O>
  render (): Mutator<T, O>
  concat (mutation: Mutation<T, O>): Mutation<T, O>
  create (data: T, options?: UnwrapOptions<O>): Promise<T>
  read (data: T, options?: UnwrapOptions<O>): Promise<T>
  undo (steps?: number): Mutation<T, O>
  redo (steps?: number): Mutation<T, O>
}

export interface MutationSettings<T, O = any> {
  autoCommit?: boolean
  classy?: boolean
  historySize?: number
  safe?: boolean
  writer?: Writer<T, O>
}

interface State<T, O> {
  mutators: Array<Mutator<T, O>>
  settings: MutationSettings<T, O>
}

function pushMutators<T, O> (
  state: State<T, O>,
  ...mutators: Array<Mutator<T, O>>
): State<T, O> {
  return {
    ...state,
    mutators: [...state.mutators, ...mutators]
  }
}

function updateMethod<T, O, A extends any[]> (
  state: State<T, O>,
  mapper: Mapper<T, A>,
  ...args: A
): State<T, O> {
  return pushMutators(state, async (status: Status<any>) => {
    return updateStatus(
      status,
      await mapper(status.target, ...args)
    )
  })
}

function assignMethod<T, O> (
  state: State<T, O>,
  object: Partial<T>
): State<T, O> {
  return updateMethod(
    state,
    data => Object.assign({}, data, object)
  )
}

function deleteMethod<T, O> (
  state: State<T, O>
): State<T, O> {
  return pushMutators(state, deleteStatus)
}

function commitMethod<T, O> (
  state: State<T, O>
): State<T, O> {
  const { writer } = state.settings
  if (!writer) {
    return state
  }
  return pushMutators(
    state,
    (status, options) => handleWriter(writer, status, options)
  )
}

async function compileCondition<T> (
  condition: Condition<T>,
  data: T
): Promise<boolean> {
  if (typeof condition === 'boolean') {
    return condition
  } else {
    return condition(data)
  }
}

function negateCondition<T> (condition: Condition<T>): Condition<T> {
  return async function negatedCondition (data) {
    const ok = await compileCondition(condition, data)
    return !ok
  }
}

function applyCondition<T, O> (
  mutator: Mutator<T, O>,
  condition: Condition<T>
): Mutator<T, O> {
  return async function conditionalMutator (status, options) {
    const ok = await compileCondition(condition, status.target)
    if (!ok) {
      return status
    } else {
      return mutator(status, options)
    }
  }
}

function ifMethod<T, O> (
  state: State<T, O>,
  condition: Condition<T>,
  mutation: Mutation<T, O>
): State<T, O> {
  return pushMutators(state, applyCondition(mutation.render(), condition))
}

function unlessMethod<T, O> (
  state: State<T, O>,
  condition: Condition<T>,
  mutation: Mutation<T, O>
): State<T, O> {
  return ifMethod(state, negateCondition(condition), mutation)
}

function renderMethod<T, O> (
  state: State<T, O>
): Mutator<T, O> {
  return function renderizedMutation (status, options) {
    return state.mutators.reduce(
      (promise, mutator) => promise.then(status => mutator(status, options)),
      Promise.resolve(status)
    )
  }
}

function concatMethod<T, O> (
  state: State<T, O>,
  mutation: Mutation<T, O>
): State<T, O> {
  return pushMutators(state, mutation.render())
}

async function handleMutation<T, O> (
  state: State<T, O>,
  status: Status<T>,
  options: UnwrapOptions<O>
): Promise<T> {
  // Apply mutation to status object
  const mutator = renderMethod(state)
  status = await mutator(status, options)

  // Handle safe output
  const { writer } = state.settings
  if (writer && shouldCommit(status)) {
    const autoCommit = isUndefined(options.autoCommit)
      ? state.settings.autoCommit !== false
      : options.autoCommit !== false

    const safe = isUndefined(options.safe)
      ? state.settings.safe !== false
      : options.safe !== false

    if (autoCommit) {
      status = await handleWriter(writer, status, options)
    } else if (safe) {
      throw new Herry('EMUT_UNSAFE', 'Unsafe mutation', {
        source: status.source,
        target: status.target,
        options
      })
    }
  }

  // Return resulting object
  return status.target
}

function createMethod<T, O> (
  state: State<T, O>,
  data: T,
  options?: UnwrapOptions<O>
): Promise<T> {
  return handleMutation(state, createStatus(data), objectify(options))
}

function readMethod<T, O> (
  state: State<T, O>,
  data: T,
  options?: UnwrapOptions<O>
): Promise<T> {
  return handleMutation(state, readStatus(data), objectify(options))
}

export function createMutation<T, O = any> (
  settings: MutationSettings<T, O> = {}
): Mutation<T, O> {
  const state: State<T, O> = {
    mutators: [],
    settings
  }
  return fluente({
    historySize: settings.historySize,
    isMutable: settings.classy === true,
    state,
    fluent: {
      update: updateMethod,
      assign: assignMethod,
      delete: deleteMethod,
      commit: commitMethod,
      if: ifMethod,
      unless: unlessMethod,
      concat: concatMethod
    },
    methods: {
      render: renderMethod,
      create: createMethod,
      read: readMethod
    }
  })
}

export async function applyMutation<T, O> (
  data: T,
  persisted: boolean,
  mutation: Mutation<T, O>,
  options?: UnwrapOptions<O>
): Promise<T> {
  if (isNil(data)) {
    return data
  } else if (persisted) {
    return mutation.read(data, options)
  } else {
    return mutation.create(data, options)
  }
}
