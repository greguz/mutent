import fluente from 'fluente'

import {
  nodeCommit,
  nodeCondition,
  nodeDelete,
  nodeInspect,
  nodeUpdate
} from './ast'
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

function renderInputMutation(input, settings) {
  const mutation =
    typeof input === 'function' ? input(createMutation(settings)) : input

  return mutation.render()
}

export function ifMethod(state, condition, input) {
  return pushNode(
    state,
    nodeCondition(condition, renderInputMutation(input, state.settings))
  )
}

export function unlessMethod(state, condition, input) {
  return ifMethod(state, data => !unlazy(condition, data), input)
}

export function inspectMethod(state, inspector) {
  return pushNode(state, nodeInspect(inspector))
}

export function mutateMethod({ settings, tree }, input) {
  return {
    tree: tree.concat(renderInputMutation(input, settings))
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
