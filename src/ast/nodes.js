export const NODE_TYPE = {
  COMMIT: 0,
  CONDITION: 1,
  DELETE: 2,
  UPDATE: 3
}

export function nodeCommit() {
  return {
    type: NODE_TYPE.COMMIT
  }
}

export function nodeCondition(condition, tree) {
  return {
    type: NODE_TYPE.CONDITION,
    condition,
    tree
  }
}

export function nodeDelete() {
  return {
    type: NODE_TYPE.DELETE
  }
}

export function nodeUpdate(mutator) {
  return {
    type: NODE_TYPE.UPDATE,
    mutator
  }
}
