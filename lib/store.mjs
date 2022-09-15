import { Mutation } from './mutation.mjs'
import {
  mergeHooks,
  normalizeHooks,
  normalizeMutators,
  parseCommitMode,
  parseWriteMode,
  parseWriteSize
} from './options.mjs'

export class Store {
  constructor (options) {
    const {
      adapter,
      commitMode,
      hooks,
      mutators,
      plugins,
      writeMode,
      writeSize
    } = Object(options)

    if (!adapter) {
      throw new Error('Adapter is required')
    }

    // Save (valid) defaults
    this.adapter = adapter
    this.commitMode = 'AUTO'
    this.hooks = normalizeHooks()
    this.mutators = []
    this.writeMode = 'AUTO'
    this.writeSize = 16

    // Parse and save submitted options
    this.register({ commitMode, hooks, mutators, writeMode, writeSize })

    // Register plugins
    if (Array.isArray(plugins)) {
      for (const plugin of plugins) {
        this.register(plugin)
      }
    }
  }

  create (data) {
    return this.mutation('CREATE', data)
  }

  register (plugin) {
    const {
      commitMode,
      hooks,
      mutators,
      writeMode,
      writeSize
    } = Object(plugin)

    if (commitMode !== undefined) {
      this.commitMode = parseCommitMode(commitMode)
    }
    if (hooks !== undefined) {
      this.hooks = mergeHooks(this.hooks, normalizeHooks(hooks))
    }
    if (mutators !== undefined) {
      this.mutators = this.mutators.concat(normalizeMutators(mutators))
    }
    if (writeMode !== undefined) {
      this.writeMode = parseWriteMode(writeMode)
    }
    if (writeSize !== undefined) {
      this.writeSize = parseWriteSize(writeSize)
    }

    return this
  }

  filter (query) {
    return this.mutation('FILTER', query)
  }

  find (query) {
    return this.mutation('FIND', query)
  }

  from (data) {
    return this.mutation('FROM', data)
  }

  mutation (intent, argument) {
    return new Mutation({
      adapter: this.adapter,
      argument,
      commitMode: this.commitMode,
      hooks: this.hooks,
      intent,
      mutators: this.mutators,
      writeMode: this.writeMode,
      writeSize: this.writeSize
    })
  }

  read (query) {
    return this.mutation('READ', query)
  }
}
