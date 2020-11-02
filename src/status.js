import Herry from 'herry'

import { isUndefined } from './utils'

function noUndef(value) {
  if (isUndefined(value)) {
    throw new Herry('EMUT_UNDEFINED', 'Undefined values are not valid')
  }
  return value
}

export function commitStatus({ deleted, target }) {
  return {
    created: false,
    updated: false,
    deleted: false,
    source: deleted ? null : target,
    target
  }
}

export function createStatus(data) {
  return {
    created: true,
    updated: false,
    deleted: false,
    source: null,
    target: noUndef(data)
  }
}

export function readStatus(data) {
  return commitStatus(createStatus(data))
}

export function updateStatus({ created, deleted, source }, data) {
  return {
    created,
    updated: true,
    deleted,
    source,
    target: noUndef(data)
  }
}

export function deleteStatus({ created, updated, source, target }) {
  return {
    created,
    updated,
    deleted: true,
    source,
    target
  }
}

export function shouldCommit(status) {
  return status.created || status.updated || status.deleted
}
