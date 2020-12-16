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
  if(condition: Condition<T>, mutation: MutationOrMapper<T>): this
  unless(condition: Condition<T>, mutation: MutationOrMapper<T>): this
  inspect(inspector: Inspector<T>): this
  mutate(mutation: Mutation<T>): this
  undo(steps?: number): this
  redo(steps?: number): this
}

export type MutationMapper<T> = (mutation: Mutation<T>) => Mutation<T>

export type MutationOrMapper<T> = Mutation<T> | MutationMapper<T>

export declare function createMutation<T>(
  settings?: MutationSettings
): Mutation<T>
