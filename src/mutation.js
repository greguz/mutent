import fluente from 'fluente'

import { nodeCommit, nodeCondition, nodeDelete, nodeUpdate } from './ast/nodes'
import { unlazy } from './utils'

function pushNode({ tree }, node) {
  return {
    tree: [...tree, node]
  }
}

export function updateMethod(state, mutator, ...args) {
  return pushNode(
    state,
    nodeUpdate(data => mutator(data, ...args))
  )
}

export function assignMethod(state, object) {
  return pushNode(
    state,
    nodeUpdate(data => Object.assign({}, data, object))
  )
}

export function deleteMethod(state) {
  return pushNode(state, nodeDelete())
}

export function commitMethod(state) {
  return pushNode(state, nodeCommit())
}

function renderIntent(intent, settings) {
  const mutation =
    typeof intent === 'function' ? intent(createMutation(settings)) : intent
  return mutation.render()
}

export function ifMethod(state, condition, intent) {
  return pushNode(
    state,
    nodeCondition(condition, renderIntent(intent, state.settings))
  )
}

export function unlessMethod(state, condition, intent) {
  return ifMethod(state, data => !unlazy(condition, data), intent)
}

export function mutateMethod({ settings, tree }, intent) {
  return {
    tree: tree.concat(renderIntent(intent, settings))
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
    isMutable: settings.classy,
    state,
    fluent: {
      update: updateMethod,
      assign: assignMethod,
      delete: deleteMethod,
      commit: commitMethod,
      if: ifMethod,
      unless: unlessMethod,
      mutate: mutateMethod
    },
    methods: {
      render: renderMethod
    }
  })
}
