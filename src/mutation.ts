import fluente from 'fluente'
import Herry from 'herry'

import { Status, deleteStatus, updateStatus } from './status'
import { Writer, handleWriter } from './writer'

export type Mapper<T, A extends any[]> = (
  data: T,
  ...args: A
) => Promise<T> | T

export type Mutator<T, O = any> = (
  status: Status<T>,
  options: Partial<O>
) => Status<T> | Promise<Status<T>>

export type Condition<T> = (data: T) => Promise<boolean> | boolean

interface ConditionalBlock<T> {
  previous: Array<Condition<T>>
  current: Condition<T> | null
}

type ConditionalStack<T> = Array<ConditionalBlock<T>>

export interface Mutation<T, O = any> {
  update<A extends any[]> (mapper: Mapper<T, A>, ...args: A): Mutation<T>
  assign (object: Partial<T>): Mutation<T>
  delete (): Mutation<T>
  commit (): Mutation<T>
  if (condition: Condition<T>): Mutation<T, O>
  elseIf (condition: Condition<T>): Mutation<T, O>
  else (): Mutation<T, O>
  endIf (): Mutation<T, O>
  mutate (mutation: Mutation<T, O>): Mutation<T, O>
  render (): Mutator<T, O>
  undo (steps?: number): Mutation<T, O>
  redo (steps?: number): Mutation<T, O>
}

interface State<T, O> {
  mutators: Array<Mutator<T, O>>
  stack: ConditionalStack<T>
  writer: Writer<T, O>
}

function setCurrentCondition<T> (
  block: ConditionalBlock<T>,
  condition: Condition<T> | null
): ConditionalBlock<T> {
  const { current, previous } = block
  if (current === null) {
    throw new Herry('EMUT_CLSIF', 'Closed condition')
  }
  return {
    previous: [...previous, current],
    current: condition
  }
}

function updateCurrentConditionalBlock<T> (
  stack: ConditionalStack<T>,
  condition: Condition<T> | null
): ConditionalStack<T> {
  const index = stack.length - 1
  if (index < 0) {
    throw new Herry('EMUT_EXPIF', 'Expected open condition')
  }
  return stack.map(
    (block, i) => index === i ? setCurrentCondition(block, condition) : block
  )
}

async function compileConditionalBlock<T> (
  data: T,
  block: ConditionalBlock<T>
): Promise<boolean> {
  for (const condition of block.previous) {
    const a = await condition(data)
    if (a) {
      return false
    }
  }
  if (block.current) {
    const b = await block.current(data)
    return !!b
  } else {
    return true
  }
}

function applyConditions<T, O> (
  mutator: Mutator<T, O>,
  stack: ConditionalStack<T>
): Mutator<T> {
  if (stack.length <= 0) {
    return mutator
  }
  return async function conditionalMutator (status, options) {
    for (const block of stack) {
      const out = await compileConditionalBlock(status.target, block)
      if (!out) {
        return status
      }
    }
    return mutator(status, options)
  }
}

function pushMutators<T, O> (
  state: State<T, O>,
  ...mutators: Array<Mutator<T, O>>
): State<T, O> {
  return {
    ...state,
    mutators: [
      ...state.mutators,
      ...mutators.map(mutator => applyConditions(mutator, state.stack))
    ]
  }
}

function updateMethod<T, O, A extends any[]> (
  state: State<T, O>,
  mapper: Mapper<T, A>,
  ...args: A
): State<T, O> {
  return pushMutators(state, async status => {
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
  return pushMutators(
    state,
    (status, options) => handleWriter(state.writer, status, options)
  )
}

function ifMethod<T, O> (
  state: State<T, O>,
  condition: Condition<T>
): State<T, O> {
  return {
    ...state,
    stack: [
      ...state.stack,
      {
        previous: [],
        current: condition
      }
    ]
  }
}

function elseIfMethod<T, O> (
  state: State<T, O>,
  condition: Condition<T>
): State<T, O> {
  return {
    ...state,
    stack: updateCurrentConditionalBlock(state.stack, condition)
  }
}

function elseMethod<T, O> (
  state: State<T, O>
): State<T, O> {
  return {
    ...state,
    stack: updateCurrentConditionalBlock(state.stack, null)
  }
}

function endIfMethod<T, O> (
  state: State<T, O>
): State<T, O> {
  const end = state.stack.length - 1
  if (end < 0) {
    throw new Herry('EMUT_ENDIF', 'Unexpected conditional block end')
  }
  return {
    ...state,
    stack: state.stack.slice(0, end)
  }
}

function mutateMethod<T, O> (
  state: State<T, O>,
  mutation: Mutation<T, O>
): State<T, O> {
  return pushMutators(state, mutation.render())
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

export function defineMutation<T, O = any> (writer: Writer<T, O> = {}): Mutation<T, O> {
  const state: State<T, O> = {
    mutators: [],
    stack: [],
    writer
  }
  return fluente({
    state,
    fluent: {
      update: updateMethod,
      assign: assignMethod,
      delete: deleteMethod,
      commit: commitMethod,
      if: ifMethod,
      elseIf: elseIfMethod,
      else: elseMethod,
      endIf: endIfMethod,
      mutate: mutateMethod
    },
    methods: {
      render: renderMethod
    },
    skipLocking: true,
    isMutable: false,
    historySize: 8
  })
}
