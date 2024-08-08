import { Mutation } from './mutation.mjs'
import {
  mergeHooks,
  normalizeHooks,
  normalizeMutators,
  parseCommitMode,
  parseWriteMode,
  parseWriteSize
} from './options.mjs'
import { isIterable, isObjectLike } from './util.mjs'

export class Store {
  get raw () {
    return this.adapter.raw
  }

  constructor (options) {
    if (!isObjectLike(options)) {
      throw new TypeError('Expected Store options object')
    }
    if (!isObjectLike(options.adapter)) {
      throw new TypeError('Exepcted Store adapter')
    }

    // Set defaults
    this.adapter = options.adapter
    this.commitMode = 'AUTO'
    this.handlers = []
    this.hooks = normalizeHooks()
    this.mutable = options.mutable === true
    this.mutators = []
    this.writeMode = 'AUTO'
    this.writeSize = 16

    // Parse and save submitted options
    this.register(options)

    // Register plugins
    if (isIterable(options.plugins)) {
      for (const plugin of options.plugins) {
        this.register(plugin)
      }
    }
  }

  create (data) {
    return this.mutation('CREATE', data)
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
    const mut = new Mutation({
      adapter: this.adapter,
      argument,
      commitMode: this.commitMode,
      handlers: this.handlers,
      hooks: this.hooks,
      intent,
      multiple: undefined,
      mutators: this.mutators,
      opaque: undefined,
      options: undefined,
      writeMode: this.writeMode,
      writeSize: this.writeSize
    })
    if (this.mutable) {
      mut.mutable = true
    }
    return mut
  }

  read (query) {
    return this.mutation('READ', query)
  }

  register (plugin) {
    if (!isObjectLike(plugin)) {
      throw new TypeError('A plugin must be an object')
    }
    const {
      commitMode,
      handlers,
      hooks,
      mutators,
      writeMode,
      writeSize
    } = plugin

    if (commitMode !== undefined) {
      this.commitMode = parseCommitMode(commitMode)
    }
    if (handlers !== undefined) {
      this.handlers = this.handlers.concat(normalizeMutators(handlers))
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
}
