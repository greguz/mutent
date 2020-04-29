import { UndefinedEntityError } from './errors'
import { isUndefined } from './utils'

export interface Status<T> {
  /**
   * Expresses a user's create intent.
   */
  created: boolean
  /**
   * Expresses a user's update intent.
   */
  updated: boolean
  /**
   * Expresses a user's delete intent.
   */
  deleted: boolean
  /**
   * Represents the current entity's data present inside its data source.
   */
  source: T | null
  /**
   * Represents the entity's data after all described mutations are applied.
   */
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
