import { Status } from './status'
import { MaybePromise, isNil } from './utils'

export type Mutator<T, O = any> = (
  status: Status<T>,
  options: Partial<O>
) => MaybePromise<Status<T>>

export type Condition<T> = ((data: T) => MaybePromise<boolean>) | boolean

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

export function negateCondition<T> (condition: Condition<T>): Condition<T> {
  return async function negatedCondition (data) {
    const ok = await compileCondition(condition, data)
    return !ok
  }
}

export function applyCondition<T, O> (
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

export function renderMutators<T, O> (
  mutators: Array<Mutator<T, O>>
): Mutator<T, O> {
  return function renderizedMutation (status, options) {
    return mutators.reduce(
      (promise, mutator) => promise.then(status => mutator(status, options)),
      Promise.resolve(status)
    )
  }
}

export async function applyMutator<T, O> (
  status: Status<T>,
  mutator: Mutator<T>,
  options: Partial<O>
): Promise<T> {
  if (isNil(status.target)) {
    return status.target
  }
  const result = await mutator(status, options)
  return result.target
}
