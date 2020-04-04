export interface Status<T> {
  committed: boolean
  deleted: boolean
  source: T | null,
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
    committed: false,
    deleted: false,
    source: null,
    target: noUndef(target)
  }
}

export function updateStatus<T> (status: Status<T>, target: T): Status<T> {
  return {
    ...status,
    committed: false,
    target: noUndef(target)
  }
}

export function commitStatus<T> (status: Status<T>): Status<T> {
  return {
    ...status,
    committed: true,
    source: status.target
  }
}

export function deleteStatus<T> (status: Status<T>): Status<T> {
  return {
    ...status,
    committed: false,
    deleted: true
  }
}
