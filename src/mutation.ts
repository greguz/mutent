import fluente from 'fluente'

import { Condition, Mutator, applyCondition, negateCondition, renderMutators } from './mutator'
import { Status, deleteStatus, updateStatus } from './status'
import { MaybePromise } from './utils'
import { Writer, handleWriter } from './writer'

export type Mapper<T, A extends any[]> = (
  data: Exclude<T, null>,
  ...args: A
) => MaybePromise<T>

export interface Mutation<T, O = any> {
  update<A extends any[]> (mapper: Mapper<T, A>, ...args: A): this
  assign (object: Partial<T>): this
  delete (): this
  commit (): this
  if (condition: Condition<T>, mutation: MutationOrMapper<T, O>): this
  unless (condition: Condition<T>, mutation: MutationOrMapper<T, O>): this
  mutate (mutation: Mutation<T, O>): this
  render (): Mutator<T, O>
  undo (steps?: number): this
  redo (steps?: number): this
}

export interface MutationSettings<T, O = any> {
  classy?: boolean
  historySize?: number
  writer?: Writer<T, O>
}

export type MutationMapper<T, O = any> = (mutation: Mutation<T, O>) => Mutation<T, O>

export type MutationOrMapper<T, O = any> = Mutation<T, O> | MutationMapper<T, O>

export interface MutationState<T, O> {
  mutators: Array<Mutator<T, O>>
  settings: MutationSettings<T, O>
}

function pushMutators<T, O> (
  state: MutationState<T, O>,
  ...mutators: Array<Mutator<T, O>>
): MutationState<T, O> {
  return {
    ...state,
    mutators: [...state.mutators, ...mutators]
  }
}

export function updateMethod<T, O, A extends any[]> (
  state: MutationState<T, O>,
  mapper: Mapper<T, A>,
  ...args: A
): MutationState<T, O> {
  return pushMutators(state, async (status: Status<any>) => {
    return updateStatus(
      status,
      await mapper(status.target, ...args)
    )
  })
}

export function assignMethod<T, O> (
  state: MutationState<T, O>,
  object: Partial<T>
): MutationState<T, O> {
  return updateMethod(
    state,
    data => Object.assign({}, data, object)
  )
}

export function deleteMethod<T, O> (
  state: MutationState<T, O>
): MutationState<T, O> {
  return pushMutators(state, deleteStatus)
}

export function commitMethod<T, O> (
  state: MutationState<T, O>
): MutationState<T, O> {
  const { writer } = state.settings
  if (!writer) {
    return state
  }
  return pushMutators(
    state,
    (status, options) => handleWriter(writer, status, options)
  )
}

function wrapMutationMapper<T, O> (
  fn: MutationMapper<T, O>,
  settings: MutationSettings<T, O>
): Mutator<T, O> {
  return function wrappedMutationMapper (status, options) {
    const mutation = fn(createMutation(settings))
    const mutator = mutation.render()
    return mutator(status, options)
  }
}

export function ifMethod<T, O> (
  state: MutationState<T, O>,
  condition: Condition<T>,
  mutation: MutationOrMapper<T, O>
): MutationState<T, O> {
  return pushMutators(
    state,
    applyCondition(
      typeof mutation === 'function'
        ? wrapMutationMapper(mutation, state.settings)
        : mutation.render(),
      condition
    )
  )
}

export function unlessMethod<T, O> (
  state: MutationState<T, O>,
  condition: Condition<T>,
  mutation: MutationOrMapper<T, O>
): MutationState<T, O> {
  return ifMethod(state, negateCondition(condition), mutation)
}

export function mutateMethod<T, O> (
  state: MutationState<T, O>,
  mutation: Mutation<T, O>
): MutationState<T, O> {
  return pushMutators(state, mutation.render())
}

export function renderMethod<T, O> (
  state: MutationState<T, O>
): Mutator<T, O> {
  return renderMutators(state.mutators)
}

export function createMutation<T, O = any> (
  settings: MutationSettings<T, O> = {}
): Mutation<T, O> {
  const state: MutationState<T, O> = {
    mutators: [],
    settings
  }
  return fluente({
    historySize: settings.historySize,
    isMutable: settings.classy,
    state,
    fluent: {
      update: updateMethod,
      assign: assignMethod,
      delete: deleteMethod,
      commit: commitMethod,
      if: ifMethod,
      unless: unlessMethod,
      mutate: mutateMethod
    },
    methods: {
      render: renderMethod
    }
  })
}
