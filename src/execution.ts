import { Commit } from './commit'

export interface Execution<O> {
  and<X>(commit: Commit<X>): Execution<O & X>
  unwrap(): Commit<O>
}

type AsyncCommit<O> = (source: any, target: any, options?: O) => Promise<any>

type Commits = Array<AsyncCommit<any>>

function makeAsyncCommit<O> (commit: Commit<O>): AsyncCommit<O> {
  return (source, target, options) => Promise.resolve(commit(source, target, options))
}

function reduceCommits (fns: Commits) {
  return fns.reduce((acc, commit) => {
    return (source, target, options) => {
      return acc(source, target, options).then(() => commit(source, target, options))
    }
  })
}

function unwrapCommits (commits: Commits) {
  if (commits.length <= 0) {
    return () => Promise.resolve()
  } else if (commits.length === 1) {
    return commits[0]
  } else {
    return reduceCommits(commits)
  }
}

function wrapCommits (commits: Commits): Execution<any> {
  return {
    and: commit => wrapCommits([...commits, makeAsyncCommit(commit)]),
    unwrap: () => unwrapCommits(commits)
  }
}

export function execute<O> (commit: Commit<O>): Execution<O> {
  return wrapCommits([makeAsyncCommit(commit)])
}
