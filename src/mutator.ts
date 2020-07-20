import { Status, updateStatus } from './status'
import { Lazy, Result, isNil, unlazy } from './utils'

export type Mutator<T, O = any> = (
  status: Status<T>,
  options: Partial<O>
) => Result<Status<T>>

export type Mapper<T, A extends any[]> = (
  data: Exclude<T, null>,
  ...args: A
) => Result<T>

export type Condition<T> = Lazy<Result<boolean>, T>

export function createMutator<T, A extends any[]> (
  mapper: Mapper<T, A>,
  ...args: A
): Mutator<T, any> {
  return async function mapMutator (status: Status<any>) {
    return updateStatus(
      status,
      await mapper(status.target, ...args)
    )
  }
}

export function negateCondition<T> (condition: Condition<T>): Condition<T> {
  return async function negatedCondition (data) {
    const ok = await unlazy(condition, data)
    return !ok
  }
}

export function applyCondition<T, O> (
  mutator: Mutator<T, O>,
  condition: Condition<T>
): Mutator<T, O> {
  return async function conditionalMutator (status, options) {
    const ok = await unlazy(condition, status.target)
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
