import Herry from 'herry'

import { isNil } from './utils'

function noUndef(data) {
  return isNil(data) ? null : data
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
  return commitStatus(createStatus(noUndef(data)))
}

export function updateStatus({ created, deleted, source }, target) {
  if (isNil(target)) {
    throw new Herry('EMUT_NIL_UPDATE', 'Cannot accept a nil value as entity', {
      source,
      target
    })
  }
  return {
    created,
    updated: true,
    deleted,
    source,
    target
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
