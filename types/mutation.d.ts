import { Lazy, Result } from './utils'

export declare type Condition<T> = Lazy<boolean, T>

export declare type Mutator<T, A extends any[]> = (
  data: Exclude<T, null>,
  ...args: A
) => Result<T>

export declare type Inspector<T> = (data: T) => Result<void>

export interface MutationSettings {
  historySize?: number
  mutable?: boolean
}

export interface Mutation<T> {
  update<A extends any[]>(mutator: Mutator<T, A>, ...args: A): this
  assign(object: Partial<T>): this
  delete(): this
  commit(): this
  if<A extends any[]>(
    condition: Condition<T>,
    mutation: MutationOrMapper<T, A>,
    ...args: A
  ): this
  unless<A extends any[]>(
    condition: Condition<T>,
    mutation: MutationOrMapper<T, A>,
    ...args: A
  ): this
  inspect(inspector: Inspector<T>): this
  mutate<A extends any[]>(mutation: MutationOrMapper<T, A>, ...args: A): this
  undo(steps?: number): this
  redo(steps?: number): this
}

export type MutationMapper<T, A extends any[]> = (
  mutation: Mutation<T>,
  ...args: A
) => Mutation<T>

export type MutationOrMapper<T, A extends any[]> =
  | Mutation<T>
  | MutationMapper<T, A>

export declare function createMutation<T>(
  settings?: MutationSettings
): Mutation<T>
