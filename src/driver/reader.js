import Herry from 'herry'

import { isNull, isUndefined } from '../utils'

async function find(reader, query, options, isRequired) {
  const data = reader.find
    ? await reader.find(query, options, isRequired)
    : null

  return isUndefined(data) ? null : data
}

export function findData(reader, query, options) {
  return find(reader, query, options, false)
}

export async function readData(reader, query, options) {
  const data = await find(reader, query, options, true)
  if (isNull(data)) {
    throw new Herry('EMUT_NOT_FOUND', 'Entity not found', {
      query,
      options
    })
  }
  return data
}

export function filterData(reader, query, options) {
  return reader.filter ? reader.filter(query, options) : []
}
