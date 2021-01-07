import { deleteStatus, updateStatus } from './status'

export function _delete() {
  return deleteStatus
}

export function commit() {
  return function commitMutator(status, options) {
    return this.driver.write(status, options)
  }
}

function isTrue(condition, data) {
  return typeof condition === 'function' ? condition(data) : condition
}

export function _if(condition, mutator) {
  return async function conditionalMutator(status, options) {
    return isTrue(condition, status.target)
      ? mutator.call(this, status, options)
      : status
  }
}

export function unless(condition, mutator) {
  return _if(data => !isTrue(condition, data), mutator)
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
