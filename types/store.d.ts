import { Adapter } from './adapter'
import { Engine, EngineOptions } from './engine'
import { Hooks } from './hooks'
import { MutationMultiple, MutationNullable, MutationSingle } from './mutation'
import { CommitMode, UnwrapOptions, WriteMode } from './options'
import { JSONSchema7Definition } from './schema'
import { Lazy } from './utils'

export interface StoreOptions<T, Q, O> extends EngineOptions {
  /**
   * Adapter definition.
   */
  adapter: Adapter<T, Q, O>
  /**
   * Commit mode.
   * @default "AUTO"
   */
  commitMode?: CommitMode
  /**
   * Schema engine.
   */
  engine?: Engine
  /**
   * Event hooks.
   */
  hooks?: Hooks<T, Q, O>
  /**
   * Migration strategies (mappers).
   */
  migrationStrategies?: Record<number, Function>
  /**
   * Store identifier.
   */
  name: string
  /**
   * Entity schema.
   */
  schema?: JSONSchema7Definition
  /**
   * Required entity version.
   * @default null
   */
  version?: number
  /**
   * Version field name.
   * @default "v"
   */
  versionKey?: string
  /**
   * Write mode.
   * @default "AUTO"
   */
  writeMode?: WriteMode
  /**
   * Size (length) for bulk writes.
   * @default 16
   */
  writeSize?: number
}

/**
 * Single entity value definition. Can be lazy and async.
 */
export declare type One<T, O> = Lazy<T | Promise<T>, UnwrapOptions<O>>

/**
 * Many entities' values definition. Have to be and iterable. Can be lazy and async.
 */
export declare type Many<T, O> = Lazy<
  Iterable<T> | AsyncIterable<T>,
  UnwrapOptions<O>
>

export declare class Store<T, Q, O> {
  /**
   * Creates a new store instance.
   */
  static create<T, Q, O>(options?: StoreOptions<T, Q, O>): Store<T, Q, O>
  /**
   * @constructor
   */
  constructor(options?: StoreOptions<T, Q, O>)
  /**
   * Store identifier.
   */
  public readonly name: string
  /**
   * Required entity version. Migration is disabled when version is null.
   */
  public readonly version: null | number
  /**
   * Declares one or many new entities.
   */
  public create(one: One<T, O>): MutationSingle<T, O>
  public create(many: Many<T, O>): MutationMultiple<T, O>
  /**
   * Declares one entity that matches the query and could exist.
   */
  public find(query: Q): MutationNullable<T, O>
  /**
   * Declares one required entity that matches the query.
   */
  public read(query: Q): MutationSingle<T, O>
  /**
   * Declares many existing entities that match the query.
   */
  public filter(query: Q): MutationMultiple<T, O>
  /**
   * Declares one or many existing entities.
   */
  public from(one: One<T, O>): MutationSingle<T, O>
  public from(many: Many<T, O>): MutationMultiple<T, O>
}
