/// <reference types="ajv" />

import { ValidateFunction } from 'ajv'

import { Adapter } from './adapter'
import { Intent, Hooks } from './hooks'
import { JSONSchema7 } from './schema'
import { CommitMode, WriteMode } from './options'

/**
 * Mutation context. This object is accessible from any mutators.
 */
export interface Context<T, O> {
  /**
   * Current adapter.
   */
  adapter: Adapter<T, unknown, O>
  /**
   * The argument that has generated this mutation (store method argument).
   */
  argument: unknown
  /**
   * Store commit mode.
   */
  commitMode: CommitMode
  /**
   * Hooks collection.
   */
  hooks: Hooks<T, unknown, O>
  /**
   * The intent that has generated this mutation (store method name).
   */
  intent: Intent
  /**
   * Configured migration strategies.
   */
  migrationStrategies: Record<number, Function>
  /**
   * True when multiple entities can be retrieved.
   */
  multiple: boolean
  /**
   * Target entity JSON schema.
   */
  schema: JSONSchema7 | null
  /**
   * Store name.
   */
  store: string
  /**
   * Compiled AJV validate function.
   */
  validate: ValidateFunction | null
  /**
   * Required entity version.
   */
  version: number | null
  /**
   * Entity version field name.
   */
  versionKey: string
  /**
   * Store write mode.
   */
  writeMode: WriteMode
  /**
   * Store write size.
   */
  writeSize: number
}
