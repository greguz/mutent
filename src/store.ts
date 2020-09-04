import Ajv from 'ajv'
import fluente from 'fluente'

import {
  Entities,
  Entity,
  InstanceSettings,
  createEntities,
  createEntity,
  readEntities,
  readEntity
} from './instance'
import { Strategies } from './migration'
import { Reader, filterData, findData, readData } from './reader'
import { MutentSchema } from './schema/index'
import { Writer } from './writer'

export interface Driver<T, Q = any, O = any> extends Reader<T, Q, O>, Writer<T, O> {}

export interface Constructors {
  [key: string]: Function
}

export interface StoreSettings<T, Q = any, O = any> extends InstanceSettings<T, O> {
  ajv?: Ajv.Ajv
  constructors?: Constructors
  driver?: Driver<T, Q, O>
  migration?: Strategies
  schema?: MutentSchema
}

export interface Store<T, Q = any, O = any> {
  find (query: Q): Entity<T | null, O>
  read (query: Q): Entity<T, O>
  filter (query: Q): Entities<T, O>
  create<F extends T[] | T> (data: F): F extends T[] ? Entities<T, O> : Entity<T, O>
  from<F extends T[] | T> (data: F): F extends T[] ? Entities<T, O> : Entity<T, O>
}

interface StoreState<T, Q, O> {
  constructors: Constructors
  reader: Reader<T, Q, O>
  settings: StoreSettings<T, Q, O>
  validate: Ajv.ValidateFunction | undefined
}

function findMethod<T, Q, O> (
  { reader, settings }: StoreState<T, Q, O>,
  query: Q
) {
  return readEntity(
    options => findData(reader, query, options),
    settings as StoreSettings<T | null>
  )
}

function readMethod<T, Q, O> (
  { reader, settings }: StoreState<T, Q, O>,
  query: Q
) {
  return readEntity(
    options => readData(reader, query, options),
    settings
  )
}

function filterMethod<T, Q, O> (
  { reader, settings }: StoreState<T, Q, O>,
  query: Q
) {
  return readEntities(
    options => filterData(reader, query, options),
    settings
  )
}

function createMethod<T, Q, O> (
  state: StoreState<T, Q, O>,
  data: any
): any {
  return Array.isArray(data)
    ? createEntities(data, state.settings)
    : createEntity(data, state.settings)
}

function fromMethod<T, Q, O> (
  state: StoreState<T, Q, O>,
  data: any
): any {
  return Array.isArray(data)
    ? readEntities(data, state.settings)
    : readEntity(data, state.settings)
}

function compileSchema (
  constructors: Constructors,
  ajv?: Ajv.Ajv,
  schema?: any
): Ajv.ValidateFunction | undefined {
  if (!schema) {
    return
  }

  if (!ajv) {
    ajv = new Ajv({
      coerceTypes: true,
      removeAdditional: true,
      useDefaults: true
    })
  }

  if (!ajv.getKeyword('instanceof')) {
    ajv.addKeyword('instanceof', {
      errors: false,
      metaSchema: {
        type: 'string'
      },
      validate (schema: string, data: any): boolean {
        return constructors.hasOwnProperty(schema)
          ? data instanceof constructors[schema]
          : false
      }
    })
  }

  return ajv.compile(schema)
}

export function createStore<T, Q, O> (
  settings: StoreSettings<T, Q, O>
): Store<T, Q, O> {
  const constructors: Constructors = {
    Array,
    Buffer,
    Date,
    Function,
    Number,
    Object,
    Promise,
    RegExp,
    String,
    ...settings.constructors
  }

  const state: StoreState<T, Q, O> = {
    constructors,
    reader: settings.driver || {},
    settings,
    validate: compileSchema(constructors, settings.ajv, settings.schema)
  }

  return fluente({
    historySize: settings.historySize,
    isMutable: settings.classy,
    state,
    fluent: {},
    methods: {
      find: findMethod,
      read: readMethod,
      filter: filterMethod,
      create: createMethod,
      from: fromMethod
    },
    constants: {}
  })
}
