/// <reference types="node" />
import stream from 'stream'

import { JSONSchema7Definition, ParseFunction } from './mutent-schema'

export declare type Result<T> = Promise<T> | T

export declare type Lazy<T, A> = ((arg: A) => T) | T

export declare type Condition<T> = Lazy<boolean, T>

export interface MutentOptions {
  autoCommit?: boolean
  concurrency?: number
  highWaterMark?: number
  safe?: boolean
}

export declare type Options<O> = MutentOptions & Partial<O>

export declare type Mutator<T, A extends any[]> = (
  data: Exclude<T, null>,
  ...args: A
) => Result<T>

export interface MutationSettings {
  classy?: boolean
  historySize?: number
}

export interface Mutation<T> {
  update<A extends any[]>(mutator: Mutator<T, A>, ...args: A): this
  assign(object: Partial<T>): this
  delete(): this
  commit(): this
  if(condition: Condition<T>, intent: Intent<T>): this
  unless(condition: Condition<T>, intent: Intent<T>): this
  mutate(mutation: Mutation<T>): this
  undo(steps?: number): this
  redo(steps?: number): this
}

export type MutationMapper<T> = (mutation: Mutation<T>) => Mutation<T>

export type Intent<T> = Mutation<T> | MutationMapper<T>

export declare type Strategy = (data: any) => any

export interface Strategies {
  [version: number]: Strategy | undefined
}

export declare type Value<T> = Promise<T> | T

export declare type Values<T> = Iterable<T> | AsyncIterable<T> | stream.Readable

export interface Reader<T, Q = any, O = any> {
  find?(
    query: Q,
    options: Partial<O>,
    isRequired: boolean
  ): Value<T | null | undefined>
  filter?(query: Q, options: Partial<O>): Values<T>
}

export declare type WriteResult<T> = Result<T | null | undefined | void>

export interface Writer<T, O = any> {
  create?(data: T, options: Partial<O>): WriteResult<T>
  update?(oldData: T, newData: T, options: Partial<O>): WriteResult<T>
  delete?(data: T, options: Partial<O>): WriteResult<T>
}

export interface Driver<T, Q = any, O = any>
  extends Reader<T, Q, O>,
    Writer<T, O> {}

export interface ParseFunctions {
  [key: string]: ParseFunction | undefined
}

export interface Constructors {
  [key: string]: Function
}

export interface SchemaHandlerSettings {
  ajv?: any
  constructors?: Constructors
  parseFunctions?: ParseFunctions
}

export declare type One<T, O> = Lazy<Value<T>, Options<O>>

export declare type Many<T, O> = Lazy<Values<T>, Options<O>>

export interface InstanceSettings<T, O> extends MutationSettings {
  autoCommit?: boolean
  driver?: Writer<T, O>
  migrationStrategies?: Strategies
  prepare?: (data: any, options: Partial<O>) => T | null | undefined | void
  safe?: boolean
  versionKey?: string
}

export interface Entity<T, O = any> extends Mutation<T> {
  unwrap(options?: Options<O>): Promise<T>
  stream(options?: Options<O>): stream.Readable
}

export interface Entities<T, O = any> extends Mutation<T> {
  unwrap(options?: Options<O>): Promise<T[]>
  stream(options?: Options<O>): stream.Readable
}

export interface StoreSettings<T, Q = any, O = any>
  extends InstanceSettings<T, O>,
    SchemaHandlerSettings {
  driver?: Driver<T, Q, O>
  schema?: JSONSchema7Definition
}

export interface Store<T, Q = any, O = any> {
  defineConstructor(key: string, fn: Function): this
  defineParser(key: string, fn: ParseFunction): this
  create(data: T): Entity<T, O>
  create(data: T[]): Entities<T, O>
  find(query: Q): Entity<T | null, O>
  read(query: Q): Entity<T, O>
  filter(query: Q): Entities<T, O>
  from(data: T): Entity<T, O>
  from(data: T[]): Entities<T, O>
}

export declare function createMutation<T>(): Mutation<T>

export declare function createEntity<T, O = any>(
  one: One<T, O>,
  settings?: InstanceSettings<T, O>
): Entity<T, O>
export declare function createEntities<T, O = any>(
  many: Many<T, O>,
  settings?: InstanceSettings<T, O>
): Entities<T, O>
export declare function readEntity<T, O = any>(
  one: One<T, O>,
  settings?: InstanceSettings<T, O>
): Entity<T, O>
export declare function readEntities<T, O = any>(
  many: Many<T, O>,
  settings?: InstanceSettings<T, O>
): Entities<T, O>

export declare function createStore<T, Q = any, O = any>(
  settings: StoreSettings<T, Q, O>
): Store<T, Q, O>
