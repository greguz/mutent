import { ValidateFunction } from 'ajv'

import { Adapter } from './adapter'
import { Hooks } from './hooks'

/**
 *
 */
export interface Context<T, O> {
  /**
   *
   */
  adapter: Adapter<T, any, O>
  /**
   *
   */
  hooks: Hooks<T, any, O>
  /**
   *
   */
  mode: 'AUTO' | 'SAFE' | 'MANUAL'
  /**
   *
   */
  store: string
  /**
   *
   */
  validate: ValidateFunction | null
  /**
   *
   */
  version: number | null
}
