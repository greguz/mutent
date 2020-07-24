import { Status, commitStatus, deleteStatus, shouldCommit, updateStatus } from './status'
import { Lazy, Result, unlazy } from './utils'
import { Writer, writeStatus } from './writer'

export type Condition<T> = Lazy<boolean, T>

export interface UpdateNode<T> {
  type: 'UPDATE'
  mutate: (data: T) => Result<T>
}

export interface DeleteNode {
  type: 'DELETE'
}

export interface CommitNode {
  type: 'COMMIT'
}

export interface ConditionalNode<T> {
  type: 'CONDITION'
  condition: Condition<T>
  mutation: MutationTree<T>
}

export type MutationNode<T> =
  | UpdateNode<T>
  | DeleteNode
  | CommitNode
  | ConditionalNode<T>

export type MutationTree<T> = Array<MutationNode<T>>

async function handleUpdateNode<T> (
  status: Status<T>,
  node: UpdateNode<T>
): Promise<Status<T>> {
  return updateStatus(
    status,
    await node.mutate(status.target)
  )
}

async function handleConditionalNode<T, O> (
  status: Status<T>,
  node: ConditionalNode<T>,
  writer?: Writer<T, O>,
  options?: Partial<O>
): Promise<Status<T>> {
  const ok = unlazy(node.condition, status.target)
  if (!ok) {
    return status
  } else {
    return mutateStatus(status, node.mutation, writer, options)
  }
}

export async function mutateStatus<T, O> (
  status: Status<T>,
  tree: MutationTree<T>,
  writer?: Writer<T, O>,
  options?: Partial<O>
): Promise<Status<T>> {
  for (const node of tree) {
    switch (node.type) {
      case 'COMMIT':
        if (writer && shouldCommit(status)) {
          status = await writeStatus(status, writer, options)
        } else {
          status = commitStatus(status)
        }
        break
      case 'CONDITION':
        status = await handleConditionalNode(status, node, writer, options)
        break
      case 'DELETE':
        status = deleteStatus(status)
        break
      case 'UPDATE':
        status = await handleUpdateNode(status, node)
        break
    }
  }
  return status
}
