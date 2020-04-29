import { UndefinedEntityError } from './errors'
import { isUndefined } from './utils'

export interface Status<T> {
  created: boolean
  updated: boolean
  deleted: boolean
  source: T | null
  target: T
}

function noUndef<T> (value: T): T {
  if (isUndefined(value)) {
    throw new UndefinedEntityError()
  }
  return value
}

export function createStatus<T> (target: T): Status<T> {
  return {
    created: true,
    updated: false,
    deleted: false,
    source: null,
    target: noUndef(target)
  }
}

export function updateStatus<T> (status: Status<T>, target: T): Status<T> {
  return {
    ...status,
    updated: true,
    target: noUndef(target)
  }
}

export function deleteStatus<T> (status: Status<T>): Status<T> {
  return {
    ...status,
    deleted: true
  }
}

export function commitStatus<T> (status: Status<T>): Status<T> {
  return {
    ...status,
    created: false,
    updated: false,
    deleted: false,
    source: status.deleted ? null : status.target
  }
}

export function shouldCommit (status: Status<any>) {
  return status.created || status.updated || status.deleted
}
