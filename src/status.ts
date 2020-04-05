export interface Status<T> {
  updated: boolean
  deleted: boolean
  source: T | null
  target: T
}

function noUndef<T> (value: T): T {
  if (value === undefined) {
    throw new Error('An entity cannot be undefined')
  }
  return value
}

export function createStatus<T> (target: T): Status<T> {
  return {
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

export function commitStatus<T> (status: Status<T>): Status<T> {
  return {
    ...status,
    updated: false,
    source: status.target
  }
}

export function deleteStatus<T> (status: Status<T>): Status<T> {
  return {
    ...status,
    deleted: true
  }
}
