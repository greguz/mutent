import { Lazy, Result } from './utils'

export declare type Condition<T> = Lazy<boolean, T>

export declare type Mutator<T, A extends any[]> = (
  data: Exclude<T, null>,
  ...args: A
) => Result<T>

export interface MutationSettings {
  isMutable?: boolean
  historySize?: number
}

export interface Mutation<T> {
  update<A extends any[]>(mutator: Mutator<T, A>, ...args: A): this
  assign(object: Partial<T>): this
  delete(): this
  commit(): this
  if(condition: Condition<T>, alteration: Alteration<T>): this
  unless(condition: Condition<T>, alteration: Alteration<T>): this
  mutate(mutation: Mutation<T>): this
  undo(steps?: number): this
  redo(steps?: number): this
}

export type MutationMapper<T> = (mutation: Mutation<T>) => Mutation<T>

export type Alteration<T> = Mutation<T> | MutationMapper<T>

export declare function createMutation<T>(
  settings?: MutationSettings
): Mutation<T>
