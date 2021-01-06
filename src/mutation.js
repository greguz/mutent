import fluente from 'fluente'

import { deleteStatus, updateStatus } from './status'
import { unlazy } from './utils'

function doCommit() {
  return function (status, options) {
    return this.driver.write(status, options)
  }
}

function doCondition(condition, tree) {
  return function (status, options) {
    const ok = unlazy(condition, status.target)
    if (ok) {
      return mutateStatus(tree, status, options, this)
    } else {
      return status
    }
  }
}

function doUpdate(mutator) {
  return async function (status) {
    return updateStatus(status, await mutator(status.target))
  }
}

function doInspect(inspector) {
  return async function (status) {
    await inspector(status.target)
    return status
  }
}

export async function mutateStatus(tree, status, options, context) {
  for (const fn of tree) {
    status = await fn.call(context, status, options)
  }
  return status
}

function pushNode({ tree }, node) {
  return {
    tree: [...tree, node]
  }
}

export function updateMethod(state, mutator, ...args) {
  return pushNode(
    state,
    doUpdate(data => mutator(data, ...args))
  )
}

export function assignMethod(state, object) {
  return pushNode(
    state,
    doUpdate(data => Object.assign({}, data, object))
  )
}

export function deleteMethod(state) {
  return pushNode(state, deleteStatus)
}

export function commitMethod(state) {
  return pushNode(state, doCommit())
}

function renderInputMutation(settings, input, args) {
  const mutation =
    typeof input === 'function'
      ? input(createMutation(settings), ...args)
      : input

  return mutation.render()
}

export function ifMethod(state, condition, input, ...args) {
  return pushNode(
    state,
    doCondition(condition, renderInputMutation(state.settings, input, args))
  )
}

export function unlessMethod(state, condition, input, ...args) {
  return ifMethod(state, data => !unlazy(condition, data), input, ...args)
}

export function inspectMethod(state, inspector) {
  return pushNode(state, doInspect(inspector))
}

export function mutateMethod({ settings, tree }, input, ...args) {
  return {
    tree: tree.concat(renderInputMutation(settings, input, args))
  }
}

export function renderMethod({ tree }) {
  return tree
}

export function createMutation(settings = {}) {
  const state = {
    settings,
    tree: []
  }

  return fluente({
    historySize: settings.historySize,
    isMutable: settings.mutable,
    state,
    fluent: {
      update: updateMethod,
      assign: assignMethod,
      delete: deleteMethod,
      commit: commitMethod,
      if: ifMethod,
      unless: unlessMethod,
      inspect: inspectMethod,
      mutate: mutateMethod
    },
    methods: {
      render: renderMethod
    }
  })
}
