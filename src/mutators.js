import { deleteStatus, updateStatus } from './status'

export function ddelete() {
  return deleteStatus
}

export function commit() {
  return function commitMutator(status, options) {
    return this.write(status, options)
  }
}

function isTrue(condition, data) {
  return typeof condition === 'function' ? condition(data) : condition
}

export function iif(condition, mutator) {
  return async function conditionalMutator(status, options) {
    return isTrue(condition, status.target)
      ? mutator.call(this, status, options)
      : status
  }
}

export function unless(condition, mutator) {
  return iif(data => !isTrue(condition, data), mutator)
}

export function update(mapper) {
  return async function updateMutator(status) {
    return updateStatus(status, await mapper(status.target))
  }
}

export function tap(tapper) {
  return async function tapMutator(status) {
    await tapper(status.target)
    return status
  }
}

export function assign(object) {
  return update(data => Object.assign({}, data, object))
}

export function pipe(...mutators) {
  return async function pipeMutator(status, options) {
    for (const mutator of mutators) {
      status = await mutator.call(this, status, options)
    }
    return status
  }
}
