import { Result } from './utils'

export interface Hooks<T, Q, O> {
  onFind?(query: Q, options: Partial<O>): void
  onFilter?(query: Q, options: Partial<O>): void
  onData?(data: T, options: Partial<O>): Result<void>
  beforeCreate?(data: T, options: Partial<O>): Result<void>
  beforeUpdate?(oldData: T, newData: T, options: Partial<O>): Result<void>
  beforeDelete?(data: T, options: Partial<O>): Result<void>
  afterCreate?(data: T, options: Partial<O>): Result<void>
  afterUpdate?(oldData: T, newData: T, options: Partial<O>): Result<void>
  afterDelete?(data: T, options: Partial<O>): Result<void>
}
