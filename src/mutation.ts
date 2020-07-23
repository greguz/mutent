import fluente from 'fluente'

import { Condition, MutationNode, MutationTree } from './tree'
import { Result, unlazy } from './utils'

export type Mutator<T, A extends any[]> = (
  data: Exclude<T, null>,
  ...args: A
) => Result<T>

export interface MutationSettings {
  classy?: boolean
  historySize?: number
}

export interface Mutation<T> {
  update<A extends any[]> (mutator: Mutator<T, A>, ...args: A): this
  assign (object: Partial<T>): this
  delete (): this
  commit (): this
  if (condition: Condition<T>, mutation: Mutation<T>): this
  unless (condition: Condition<T>, mutation: Mutation<T>): this
  mutate (mutation: Mutation<T>): this
  render (): MutationTree<T>
  undo (steps?: number): this
  redo (steps?: number): this
}

export interface MutationState<T> {
  tree: MutationTree<T>
}

function pushNode<T> (
  state: MutationState<T>,
  node: MutationNode<T>
): MutationState<T> {
  return {
    ...state,
    tree: [...state.tree, node]
  }
}

export function updateMethod<T, A extends any[]> (
  state: MutationState<T>,
  mutator: Mutator<T, A>,
  ...args: A
): MutationState<T> {
  return pushNode(state, {
    type: 'UPDATE',
    mutate: data => mutator(data as any, ...args)
  })
}

export function assignMethod<T> (
  state: MutationState<T>,
  object: Partial<T>
): MutationState<T> {
  return pushNode(state, {
    type: 'UPDATE',
    mutate: data => Object.assign({}, data, object)
  })
}

export function deleteMethod<T> (
  state: MutationState<T>
): MutationState<T> {
  return pushNode(state, { type: 'DELETE' })
}

export function commitMethod<T> (
  state: MutationState<T>
): MutationState<T> {
  return pushNode(state, { type: 'COMMIT' })
}

export function ifMethod<T> (
  state: MutationState<T>,
  condition: Condition<T>,
  mutation: Mutation<T>
): MutationState<T> {
  return pushNode(state, {
    type: 'CONDITION',
    condition,
    mutation: mutation.render()
  })
}

export function unlessMethod<T> (
  state: MutationState<T>,
  condition: Condition<T>,
  mutation: Mutation<T>
): MutationState<T> {
  return ifMethod(
    state,
    data => !unlazy(condition, data),
    mutation
  )
}

export function mutateMethod<T> (
  state: MutationState<T>,
  mutation: Mutation<T>
): MutationState<T> {
  return {
    ...state,
    tree: [...state.tree, ...mutation.render()]
  }
}

export function renderMethod<T> (
  state: MutationState<T>
): MutationTree<T> {
  return state.tree
}

export function createMutation<T> (
  settings: MutationSettings = {}
): Mutation<T> {
  const state: MutationState<T> = {
    tree: []
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
    },
    constants: {}
  })
}
