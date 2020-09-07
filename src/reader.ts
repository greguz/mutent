import Herry from 'herry'

import { Value, Values } from './producers'
import { isNull, isUndefined } from './utils'

export interface Reader<T, Q = any, O = any> {
  find? (query: Q, options: Partial<O>, isRequired: boolean): Value<T | null | undefined>
  filter? (query: Q, options: Partial<O>): Values<T>
}

async function find<T, Q, O> (
  reader: Reader<T, Q, O>,
  query: Q,
  options: Partial<O>,
  isRequired: boolean
): Promise<T | null> {
  const data = reader.find
    ? await reader.find(query, options, isRequired)
    : null
  return isUndefined(data) ? null : data
}

export function findData<T, Q, O> (
  reader: Reader<T, Q, O>,
  query: Q,
  options: Partial<O>
): Promise<T | null> {
  return find(reader, query, options, false)
}

export async function readData<T, Q, O> (
  reader: Reader<T, Q, O>,
  query: Q,
  options: Partial<O>
): Promise<T> {
  const data = await find(reader, query, options, true)
  if (isNull(data)) {
    throw new Herry('EMUT_NOT_FOUND', 'Entity not found', { query, options })
  }
  return data
}

export function filterData<T, Q, O> (
  reader: Reader<T, Q, O>,
  query: Q,
  options: Partial<O>
): Values<T> {
  return reader.filter
    ? reader.filter(query, options)
    : []
}
