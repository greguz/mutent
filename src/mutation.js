import fluente from 'fluente'

import { nodeCommit, nodeCondition, nodeDelete, nodeUpdate } from './ast'
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

function renderAlteration(alteration, settings) {
  const mutation =
    typeof alteration === 'function'
      ? alteration(createMutation(settings))
      : alteration

  return mutation.render()
}

export function ifMethod(state, condition, alteration) {
  return pushNode(
    state,
    nodeCondition(condition, renderAlteration(alteration, state.settings))
  )
}

export function unlessMethod(state, condition, alteration) {
  return ifMethod(state, data => !unlazy(condition, data), alteration)
}

export function mutateMethod({ settings, tree }, alteration) {
  return {
    tree: tree.concat(renderAlteration(alteration, settings))
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
